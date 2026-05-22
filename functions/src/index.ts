import * as admin from "firebase-admin"
import * as functions from "firebase-functions"
import Stripe from "stripe"

admin.initializeApp()
const db = admin.firestore()

// ─────────────────────────────────────────────────────────────────────────────
// Stripe client — chaves via Firebase Functions config
// Deploy: firebase functions:config:set stripe.secret="sk_live_..." stripe.webhook_secret="whsec_..."
// Local:  copie .runtimeconfig.json com as chaves de teste
// ─────────────────────────────────────────────────────────────────────────────
function getStripe(): Stripe {
  const secret = functions.config().stripe?.secret ?? process.env.STRIPE_SECRET_KEY ?? ""
  return new Stripe(secret, { apiVersion: "2024-12-18.acacia" })
}

const PRICE_IDS = {
  pro_monthly: functions.config().stripe?.price_monthly ?? process.env.STRIPE_PRICE_MONTHLY ?? "",
  pro_yearly:  functions.config().stripe?.price_yearly  ?? process.env.STRIPE_PRICE_YEARLY  ?? "",
}

// ─────────────────────────────────────────────────────────────────────────────
// createCheckoutSession — chamado pelo frontend via Firebase SDK
// Input: { priceId: string, successUrl: string, cancelUrl: string }
// ─────────────────────────────────────────────────────────────────────────────
export const createCheckoutSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login necessário.")

  const uid   = context.auth.uid
  const email = context.auth.token.email ?? ""
  const stripe = getStripe()

  const priceId = data.priceId as string
  if (!priceId) throw new functions.https.HttpsError("invalid-argument", "priceId ausente.")

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
    success_url: data.successUrl ?? "https://forzalab.app/pricing?success=1",
    cancel_url:  data.cancelUrl  ?? "https://forzalab.app/pricing?canceled=1",
    client_reference_id: uid,
    metadata: { firebase_uid: uid },
    subscription_data: { metadata: { firebase_uid: uid } },
  })

  return { sessionId: session.id, url: session.url }
})

// ─────────────────────────────────────────────────────────────────────────────
// stripeWebhook — chamado pelo Stripe quando eventos ocorrem
// Configura no Stripe Dashboard: Endpoint URL = https://<region>-<project>.cloudfunctions.net/stripeWebhook
// ─────────────────────────────────────────────────────────────────────────────
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const stripe        = getStripe()
  const webhookSecret = functions.config().stripe?.webhook_secret ?? process.env.STRIPE_WEBHOOK_SECRET ?? ""
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
