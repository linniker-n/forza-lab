"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhook = exports.customerPortal = exports.checkout = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const stripe_1 = require("stripe");
admin.initializeApp({ projectId: "forza-tune-lab" });
const db = admin.firestore();
// ─────────────────────────────────────────────────────────────────────────────
// Domínios autorizados para CORS — não aceita requisições de origens desconhecidas
// ─────────────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = new Set([
    "https://forza-tune-lab.pages.dev",
    "https://forzalab.app",
    "http://localhost:3000",
    "http://localhost:3001",
]);
function setCors(req, res) {
    var _a;
    const origin = (_a = req.headers.origin) !== null && _a !== void 0 ? _a : "";
    if (ALLOWED_ORIGINS.has(origin)) {
        res.set("Access-Control-Allow-Origin", origin);
    }
    else {
        res.set("Access-Control-Allow-Origin", "https://forza-tune-lab.pages.dev");
    }
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Vary", "Origin");
    return req.method === "OPTIONS";
}
// ─────────────────────────────────────────────────────────────────────────────
// Stripe client — chaves via variáveis de ambiente (.env na pasta functions/)
// ─────────────────────────────────────────────────────────────────────────────
function getStripe() {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret)
        throw new Error("STRIPE_SECRET_KEY não configurado.");
    return new stripe_1.default(secret, { apiVersion: "2024-06-20" });
}
// ─────────────────────────────────────────────────────────────────────────────
// Verificação de ID Token — retorna uid e email ou lança erro 401
// ─────────────────────────────────────────────────────────────────────────────
async function verifyToken(req, res) {
    var _a, _b;
    const authHeader = (_a = req.headers.authorization) !== null && _a !== void 0 ? _a : "";
    if (!authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Token ausente." });
        return null;
    }
    try {
        const decoded = await admin.auth().verifyIdToken(authHeader.split("Bearer ")[1]);
        return { uid: decoded.uid, email: (_b = decoded.email) !== null && _b !== void 0 ? _b : "" };
    }
    catch (_c) {
        res.status(401).json({ error: "Token inválido ou expirado." });
        return null;
    }
}
// ─────────────────────────────────────────────────────────────────────────────
// checkout — cria sessão de pagamento Stripe
// ─────────────────────────────────────────────────────────────────────────────
exports.checkout = functions.https.onRequest(async (req, res) => {
    var _a;
    if (setCors(req, res)) {
        res.status(204).send("");
        return;
    }
    if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
    }
    const auth = await verifyToken(req, res);
    if (!auth)
        return;
    const { priceId, successUrl, cancelUrl } = req.body;
    // Valida entradas
    if (!priceId || typeof priceId !== "string" || priceId.length > 100) {
        res.status(400).json({ error: "priceId inválido." });
        return;
    }
    const validPrices = new Set([
        process.env.STRIPE_PRICE_MONTHLY,
        process.env.STRIPE_PRICE_YEARLY,
    ]);
    if (!validPrices.has(priceId)) {
        res.status(400).json({ error: "Plano não reconhecido." });
        return;
    }
    if (!successUrl || !cancelUrl) {
        res.status(400).json({ error: "successUrl e cancelUrl são obrigatórios." });
        return;
    }
    try {
        const stripe = getStripe();
        let customerId;
        try {
            const snap = await db.collection("userProfiles").doc(auth.uid).get();
            customerId = (_a = snap.data()) === null || _a === void 0 ? void 0 : _a.stripe_customer_id;
        }
        catch ( /* best-effort */_b) { /* best-effort */ }
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: auth.email,
                metadata: { firebase_uid: auth.uid },
            });
            customerId = customer.id;
            try {
                await db.collection("userProfiles").doc(auth.uid).set({ stripe_customer_id: customerId }, { merge: true });
            }
            catch ( /* best-effort */_c) { /* best-effort */ }
        }
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: "subscription",
            payment_method_types: ["card"],
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: successUrl,
            cancel_url: cancelUrl,
            client_reference_id: auth.uid,
            metadata: { firebase_uid: auth.uid },
            subscription_data: { metadata: { firebase_uid: auth.uid } },
        });
        res.json({ sessionId: session.id, url: session.url });
    }
    catch (err) {
        console.error("Checkout error:", err);
        res.status(500).json({ error: "Não foi possível iniciar o checkout." });
    }
});
// ─────────────────────────────────────────────────────────────────────────────
// customerPortal — portal de gerenciamento/cancelamento
// ─────────────────────────────────────────────────────────────────────────────
exports.customerPortal = functions.https.onRequest(async (req, res) => {
    var _a;
    if (setCors(req, res)) {
        res.status(204).send("");
        return;
    }
    if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
    }
    const auth = await verifyToken(req, res);
    if (!auth)
        return;
    const { returnUrl } = req.body;
    try {
        const stripe = getStripe();
        const profileSnap = await db.collection("userProfiles").doc(auth.uid).get();
        const customerId = (_a = profileSnap.data()) === null || _a === void 0 ? void 0 : _a.stripe_customer_id;
        if (!customerId) {
            res.status(400).json({ error: "Nenhuma assinatura encontrada." });
            return;
        }
        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl !== null && returnUrl !== void 0 ? returnUrl : "https://forza-tune-lab.pages.dev/profile",
        });
        res.json({ url: session.url });
    }
    catch (err) {
        console.error("Portal error:", err);
        res.status(500).json({ error: "Não foi possível abrir o portal." });
    }
});
// ─────────────────────────────────────────────────────────────────────────────
// stripeWebhook — recebe eventos do Stripe
// ─────────────────────────────────────────────────────────────────────────────
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
    var _a, _b;
    // Garante que o segredo do webhook está configurado
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.error("STRIPE_WEBHOOK_SECRET não configurado — webhook desabilitado.");
        res.status(500).json({ error: "Configuração de servidor incompleta." });
        return;
    }
    const sig = req.headers["stripe-signature"];
    if (!sig) {
        res.status(400).json({ error: "Header stripe-signature ausente." });
        return;
    }
    const stripe = getStripe();
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    }
    catch (err) {
        console.error("Webhook signature inválida:", err);
        res.status(400).json({ error: "Assinatura do webhook inválida." });
        return;
    }
    async function updateProfile(uid, update) {
        await db.collection("userProfiles").doc(uid).set(update, { merge: true });
    }
    async function uidFromCustomer(customerId) {
        const snap = await db.collection("userProfiles")
            .where("stripe_customer_id", "==", customerId)
            .limit(1)
            .get();
        return snap.empty ? null : snap.docs[0].id;
    }
    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object;
                const uid = ((_b = (_a = session.metadata) === null || _a === void 0 ? void 0 : _a.firebase_uid) !== null && _b !== void 0 ? _b : session.client_reference_id);
                if (!uid) {
                    console.warn("checkout.session.completed sem firebase_uid");
                    break;
                }
                await updateProfile(uid, {
                    subscription_tier: "pro",
                    subscription_status: "active",
                    stripe_customer_id: session.customer,
                });
                console.log(`✓ Pro ativado uid=${uid}`);
                break;
            }
            case "invoice.payment_succeeded": {
                const invoice = event.data.object;
                const uid = await uidFromCustomer(invoice.customer);
                if (uid)
                    await updateProfile(uid, { subscription_status: "active" });
                break;
            }
            case "invoice.payment_failed": {
                const invoice = event.data.object;
                const uid = await uidFromCustomer(invoice.customer);
                if (uid)
                    await updateProfile(uid, { subscription_status: "past_due" });
                break;
            }
            case "customer.subscription.deleted": {
                const sub = event.data.object;
                const uid = await uidFromCustomer(sub.customer);
                if (!uid) {
                    console.warn("subscription.deleted sem uid mapeado");
                    break;
                }
                await updateProfile(uid, { subscription_tier: "free", subscription_status: "canceled" });
                console.log(`✓ Revertido para free uid=${uid}`);
                break;
            }
            case "customer.subscription.updated": {
                const sub = event.data.object;
                const uid = await uidFromCustomer(sub.customer);
                if (uid)
                    await updateProfile(uid, {
                        subscription_status: sub.status,
                        subscription_tier: ["active", "trialing"].includes(sub.status) ? "pro" : "free",
                    });
                break;
            }
            default:
                break;
        }
    }
    catch (err) {
        console.error(`Erro ao processar evento ${event.type}:`, err);
        res.status(500).json({ error: "Erro interno ao processar evento." });
        return;
    }
    res.json({ received: true });
});
//# sourceMappingURL=index.js.map