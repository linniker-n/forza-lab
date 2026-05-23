"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { getFirebaseAuth } from "@/lib/firebase/client"
import { useAuth } from "@/components/auth/AuthProvider"
import { useSubscription } from "@/lib/subscription/context"

const CHECKOUT_URL = "https://us-central1-forza-tune-lab.cloudfunctions.net/checkout"

const STRIPE_PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
const PRICE_MONTHLY = process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY ?? ""
const PRICE_YEARLY  = process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY  ?? ""

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="8" r="7" fill="rgba(44,206,204,0.15)" stroke="var(--fh6-teal)" strokeWidth="1.2"/>
      <path d="M5 8l2 2 4-4" stroke="var(--fh6-teal)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="8" r="7" fill="rgba(100,116,139,0.1)" stroke="var(--border-strong)" strokeWidth="1.2"/>
      <path d="M5.5 8h5" stroke="var(--text-subtle)" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

type Billing = "monthly" | "yearly"

export default function PricingPage() {
  const { user } = useAuth()
  const { tier, isPro } = useSubscription()
  const [billing, setBilling] = useState<Billing>("yearly")
  const [loading, setLoading] = useState<"monthly" | "yearly" | null>(null)
  const [successParam, setSuccessParam] = useState(false)
  const [canceledParam, setCanceledParam] = useState(false)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    if (p.get("success") === "1") setSuccessParam(true)
    if (p.get("canceled") === "1") setCanceledParam(true)
  }, [])

  async function checkout(plan: Billing) {
    if (!user) { window.location.href = "/login?redirect=/pricing"; return }
    setLoading(plan)
    try {
      const auth  = getFirebaseAuth()
      const token = await auth?.currentUser?.getIdToken(true)
      if (!token) throw new Error("Sessão expirada. Faça login novamente.")

      const priceId = plan === "monthly" ? PRICE_MONTHLY : PRICE_YEARLY
      const res = await fetch(CHECKOUT_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body:    JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/pricing?success=1`,
          cancelUrl:  `${window.location.origin}/pricing?canceled=1`,
        }),
      })

      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      if (data.url) window.location.href = data.url
    } catch (err: unknown) {
      console.error("Checkout error:", err)
      alert(`Erro: ${err instanceof Error ? err.message : String(err)}`)
    } finally { setLoading(null) }
  }

  const FREE_FEATURES = [
    { label: "3 tunes geradas por dia",            included: true },
    { label: "Garagem com 5 slots",                included: true },
    { label: "Diagnóstico básico",                 included: true },
    { label: "Ver comunidade",                     included: true },
    { label: "Calculadora de câmbio",              included: true },
    { label: "Ranking — Top 3 por categoria",      included: true },
    { label: "Tunes ilimitadas",                   included: false },
    { label: "Garagem ilimitada",                  included: false },
    { label: "Compartilhar na comunidade",         included: false },
    { label: "Badge Pro no perfil",                included: false },
    { label: "Suporte prioritário",                included: false },
  ]

  const PRO_FEATURES = [
    { label: "Tunes ilimitadas por dia",           included: true },
    { label: "Garagem ilimitada",                  included: true },
    { label: "Diagnóstico avançado",               included: true },
    { label: "Compartilhar na comunidade",         included: true },
    { label: "Badge Pro verificado no perfil",     included: true },
    { label: "Ranking completo — todas categorias",included: true },
    { label: "Acesso antecipado a novidades",      included: true },
    { label: "Suporte prioritário",                included: true },
    { label: "Sem anúncios",                       included: true },
    { label: "Sem limite diário",                  included: true },
  ]

  return (
    <div className="dot-grid" style={{ minHeight: "100dvh" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 space-y-12">

        {/* Feedback banners */}
        {successParam && (
          <div className="rounded-lg p-4 flex items-center gap-3" style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)" }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" stroke="#34d399" strokeWidth="1.5"/><path d="M5.5 9l2.5 2.5 4.5-4.5" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#34d399" }}>Assinatura Pro ativada! Bem-vindo ao clube.</p>
          </div>
        )}
        {canceledParam && (
          <div className="rounded-lg p-4" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", fontSize: 13, color: "#fbbf24" }}>
            Checkout cancelado. Sem problema — seu plano gratuito continua ativo.
          </div>
        )}

        {/* Header */}
        <div className="text-center space-y-4 anim-up">
          <p className="section-label">Planos</p>
          <h1 style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 900, letterSpacing: "-0.03em", color: "var(--text)", textTransform: "uppercase" }}>
            Escolha seu<br />
            <span style={{ color: "var(--fh6-teal)" }}>plano</span>
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)", maxWidth: 460, margin: "0 auto", lineHeight: 1.7 }}>
            Comece de graça. Faça upgrade quando precisar de mais.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex justify-center anim-up">
          <div className="flex p-1 rounded-lg gap-1" style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)" }}>
            {(["monthly", "yearly"] as Billing[]).map((b) => (
              <button key={b} type="button" onClick={() => setBilling(b)} style={{
                fontSize: 12, fontWeight: 700, padding: "7px 20px", borderRadius: 7,
                border: "none", cursor: "pointer", position: "relative",
                background: billing === b ? "var(--blue)" : "transparent",
                color: billing === b ? "#fff" : "var(--text-muted)",
                transition: "all 0.15s",
              }}>
                {b === "monthly" ? "Mensal" : "Anual"}
                {b === "yearly" && (
                  <span style={{
                    position: "absolute", top: -10, right: -6,
                    fontSize: 9, fontWeight: 800, padding: "2px 5px", borderRadius: 6,
                    background: "var(--fh6-teal)", color: "#000",
                  }}>-33%</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 anim-up">

          {/* Free */}
          <div className="r-card p-7 space-y-6">
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>Gratuito</p>
              <div className="flex items-baseline gap-2">
                <span style={{ fontSize: 42, fontWeight: 900, color: "var(--text)", fontFamily: "var(--font-geist-mono)" }}>R$ 0</span>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>/sempre</span>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>Para quem está começando.</p>
            </div>

            <div className="space-y-2.5">
              {FREE_FEATURES.map((f) => (
                <div key={f.label} className="flex items-center gap-2.5">
                  {f.included ? <CheckIcon /> : <XIcon />}
                  <span style={{ fontSize: 12, color: f.included ? "var(--text)" : "var(--text-muted)" }}>{f.label}</span>
                </div>
              ))}
            </div>

            <Link href="/tune" className="r-btn r-btn-ghost w-full" style={{ justifyContent: "center", paddingTop: 11, paddingBottom: 11, fontSize: 12 }}>
              {isPro ? "Plano atual: Pro" : "Continuar grátis"}
            </Link>
          </div>

          {/* Pro */}
          <div className="r-card p-7 space-y-6" style={{
            border: "1px solid rgba(44,206,204,0.4)",
            background: "linear-gradient(135deg, var(--bg-card) 0%, rgba(44,206,204,0.04) 100%)",
            boxShadow: "0 0 40px rgba(44,206,204,0.08)",
            position: "relative", overflow: "hidden",
          }}>
            {/* Popular badge */}
            <div style={{
              position: "absolute", top: 18, right: 18,
              padding: "3px 10px", borderRadius: 20,
              background: "var(--fh6-teal)", color: "#000",
              fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase",
            }}>Popular</div>

            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fh6-teal)", marginBottom: 6 }}>Pro</p>
              <div className="flex items-baseline gap-2">
                <span style={{ fontSize: 42, fontWeight: 900, color: "var(--text)", fontFamily: "var(--font-geist-mono)" }}>
                  {billing === "monthly" ? "R$ 9,90" : "R$ 6,60"}
                </span>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>/mês</span>
              </div>
              {billing === "yearly" && (
                <p style={{ fontSize: 12, color: "var(--fh6-teal)", marginTop: 4, fontWeight: 600 }}>
                  R$ 79,90/ano · economize R$ 38,90
                </p>
              )}
              {billing === "monthly" && (
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Cancele a qualquer momento.</p>
              )}
            </div>

            <div className="space-y-2.5">
              {PRO_FEATURES.map((f) => (
                <div key={f.label} className="flex items-center gap-2.5">
                  <CheckIcon />
                  <span style={{ fontSize: 12, color: "var(--text)" }}>{f.label}</span>
                </div>
              ))}
            </div>

            {isPro ? (
              <div className="r-btn w-full" style={{
                justifyContent: "center", paddingTop: 12, paddingBottom: 12,
                background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)",
                color: "#34d399", fontWeight: 700, fontSize: 13, cursor: "default",
              }}>
                Plano ativo ✓
              </div>
            ) : (
              <button
                type="button"
                disabled={!!loading}
                onClick={() => void checkout(billing)}
                className="r-btn w-full"
                style={{
                  justifyContent: "center", paddingTop: 12, paddingBottom: 12,
                  background: "var(--fh6-teal)", color: "#000", border: "none",
                  fontWeight: 800, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.06em",
                  boxShadow: "0 4px 24px rgba(44,206,204,0.35)",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(0,0,0,0.2)", borderTopColor: "#000" }} />
                    Aguarde...
                  </span>
                ) : `Assinar Pro — ${billing === "monthly" ? "R$ 9,90/mês" : "R$ 79,90/ano"}`}
              </button>
            )}
          </div>
        </div>

        {/* FAQ */}
        <div className="space-y-4 anim-up">
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.01em" }}>Perguntas frequentes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { q: "Posso cancelar quando quiser?", a: "Sim. Cancele pelo portal Stripe a qualquer momento. Você mantém o Pro até o fim do período pago." },
              { q: "O que acontece com minhas tunes se eu cancelar?", a: "Suas tunes salvas ficam na garagem. Só novos saves ficam limitados ao plano Free (5 slots)." },
              { q: "Como funciona o limite de 3 tunes/dia?", a: "Cada geração de tune ou diagnóstico conta. O contador reseta à meia-noite." },
              { q: "Pagamento seguro?", a: "Pagamentos processados pelo Stripe — padrão PCI DSS. Não armazenamos dados de cartão." },
            ].map(({ q, a }) => (
              <div key={q} className="r-card p-4 space-y-2">
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{q}</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>{a}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
