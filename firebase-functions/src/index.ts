import * as admin from "firebase-admin"
import * as functions from "firebase-functions"
import Stripe from "stripe"

admin.initializeApp({ projectId: "forza-tune-lab" })
const db = admin.firestore()

// ─────────────────────────────────────────────────────────────────────────────
// Stripe client — chaves via variáveis de ambiente (.env na pasta functions/)
// ─────────────────────────────────────────────────────────────────────────────
function getStripe(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY ?? ""
  return new Stripe(secret, { apiVersion: "2024-06-20" })
}

// Price IDs lidos em runtime via process.env (definidos em functions/.env)

// ─────────────────────────────────────────────────────────────────────────────
// createCheckoutSession — HTTPS function com CORS explícito
// Autenticação via Bearer token (Firebase ID Token) no header Authorization
// ─────────────────────────────────────────────────────────────────────────────
export const checkout = functions.https.onRequest(async (req, res) => {
  // CORS — permite qualquer origem (necessário para Cloudflare Pages)
  res.set("Access-Control-Allow-Origin", "*")
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization")

  if (req.method === "OPTIONS") { res.status(204).send(""); return }
  if (req.method !== "POST")    { res.status(405).send("Method Not Allowed"); return }

  // Verifica Firebase ID Token
  const authHeader = req.headers.authorization ?? ""
  if (!authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: token ausente" }); return
  }

  let uid: string
  let email: string
  try {
    const decoded = await admin.auth().verifyIdToken(authHeader.split("Bearer ")[1])
    uid   = decoded.uid
    email = decoded.email ?? ""
  } catch {
    res.status(401).json({ error: "Unauthorized: token inválido" }); return
  }

  const { priceId, successUrl, cancelUrl } = req.body as {
    priceId: string; successUrl: string; cancelUrl: string
  }
  if (!priceId) { res.status(400).json({ error: "priceId ausente" }); return }

  try {
    const stripe = getStripe()

    // Busca ou cria customer Stripe
    const profileRef = db.collection("userProfiles").doc(uid)
    const profile    = await profileRef.get()
    let customerId: string | undefined = profile.data()?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({ email, metadata: { firebase_uid: uid } })
      customerId = customer.id
      await profileRef.set({ stripe_customer_id: customerId }, { merge: true })
    }

    const session = await stripe.checkout.sessions.create({
      customer:             customerId,
      mode:                 "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url:  cancelUrl,
      client_reference_id: uid,
      metadata: { firebase_uid: uid },
      subscription_data: { metadata: { firebase_uid: uid } },
    })

    res.json({ sessionId: session.id, url: session.url })
  } catch (err) {
    console.error("Checkout error:", err)
    res.status(500).json({ error: err instanceof Error ? err.message : "Erro interno" })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// stripeWebhook — chamado pelo Stripe quando eventos ocorrem
// Configura no Stripe Dashboard: Endpoint URL = https://<region>-<project>.cloudfunctions.net/stripeWebhook
// ─────────────────────────────────────────────────────────────────────────────
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const stripe        = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? ""
  const sig           = req.headers["stripe-signature"] as string

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret)
  } catch (err) {
    console.error("Webhook signature failed:", err)
    res.status(400).send("Webhook Error")
    return
  }

  async function updateProfile(uid: string, update: Record<string, unknown>) {
    await db.collection("userProfiles").doc(uid).set(update, { merge: true })
  }

  async function uidFromCustomer(customerId: string): Promise<string | null> {
    const snap = await db.collection("userProfiles")
      .where("stripe_customer_id", "==", customerId)
      .limit(1)
      .get()
    return snap.empty ? null : snap.docs[0].id
  }

  switch (event.type) {
    // ── Assinatura criada / ativada ──────────────────────────────────────────
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const uid = (session.metadata?.firebase_uid ?? session.client_reference_id) as string | null
      if (!uid) break
      await updateProfile(uid, {
        subscription_tier:   "pro",
        subscription_status: "active",
        stripe_customer_id:  session.customer as string,
      })
      console.log(`✓ Pro ativado: ${uid}`)
      break
    }

    // ── Pagamento recorrente bem-sucedido ────────────────────────────────────
    case "invoice.payment_succeeded": {
      const invoice    = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      const uid = await uidFromCustomer(customerId)
      if (!uid) break
      await updateProfile(uid, { subscription_status: "active" })
      break
    }

    // ── Pagamento falhou ─────────────────────────────────────────────────────
    case "invoice.payment_failed": {
      const invoice    = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      const uid = await uidFromCustomer(customerId)
      if (!uid) break
      await updateProfile(uid, { subscription_status: "past_due" })
      break
    }

    // ── Assinatura cancelada / expirada ──────────────────────────────────────
    case "customer.subscription.deleted": {
      const sub        = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string
      const uid = await uidFromCustomer(customerId)
      if (!uid) break
      await updateProfile(uid, {
        subscription_tier:   "free",
        subscription_status: "canceled",
      })
      console.log(`✓ Revertido para free: ${uid}`)
      break
    }

    case "customer.subscription.updated": {
      const sub        = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string
      const uid = await uidFromCustomer(customerId)
      if (!uid) break
      await updateProfile(uid, {
        subscription_status: sub.status,
        subscription_tier:   sub.status === "active" || sub.status === "trialing" ? "pro" : "free",
      })
      break
    }

    default:
      console.log(`Evento não tratado: ${event.type}`)
  }

  res.json({ received: true })
})
