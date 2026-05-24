"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { getFirebaseAuth } from "@/lib/firebase/client"
import { useAuth } from "@/components/auth/AuthProvider"
import { useSubscription } from "@/lib/subscription/context"
import { getPlanPrices, type PlanPrices } from "@/lib/pricing/currency"
import { useLanguage } from "@/lib/i18n/context"
import { useTranslations } from "@/lib/i18n/translations"

const CHECKOUT_URL = "https://us-central1-forza-tune-lab.cloudfunctions.net/checkout"

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
  const { isPro } = useSubscription()
  const { lang } = useLanguage()
  const t = useTranslations(lang)
  const [prices]        = useState<PlanPrices>(() => getPlanPrices())
  const [billing, setBilling] = useState<Billing>("yearly")
  const [loading, setLoading] = useState<"monthly" | "yearly" | null>(null)
  const [successParam, setSuccessParam] = useState(false)
  const [canceledParam, setCanceledParam] = useState(false)

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const p = new URLSearchParams(window.location.search)
      if (p.get("success") === "1") setSuccessParam(true)
      if (p.get("canceled") === "1") setCanceledParam(true)
    }, 0)
    return () => window.clearTimeout(handle)
  }, [])

  async function checkout(plan: Billing) {
    if (!user) { window.location.href = "/login?redirect=/pricing"; return }
    setLoading(plan)
    try {
      const auth  = getFirebaseAuth()
      const token = await auth?.currentUser?.getIdToken(true)
      if (!token) throw new Error(t.pricing.sessionExpired)

      const priceId = plan === "monthly" ? prices.monthly.priceId : prices.yearly.priceId
      if (!priceId) throw new Error(t.pricing.planNotConfigured)

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
      if (data.url) window.open(data.url, "_blank", "noopener,noreferrer")
    } catch (err: unknown) {
      console.error("Checkout error:", err)
      alert(`Error: ${err instanceof Error ? err.message : String(err)}`)
    } finally { setLoading(null) }
  }

  const currentPrice = billing === "monthly" ? prices.monthly.display : prices.yearly.perMonthDisplay
  const currentButtonLabel = billing === "monthly" ? prices.monthly.buttonLabel : prices.yearly.buttonLabel

  return (
    <div className="dot-grid" style={{ minHeight: "100dvh" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 space-y-12">

        {/* Feedback banners */}
        {successParam && (
          <div className="rounded-lg p-4 flex items-center gap-3" style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)" }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" stroke="#34d399" strokeWidth="1.5"/><path d="M5.5 9l2.5 2.5 4.5-4.5" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#34d399" }}>{t.pricing.successMsg}</p>
          </div>
        )}
        {canceledParam && (
          <div className="rounded-lg p-4" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", fontSize: 13, color: "#fbbf24" }}>
            {t.pricing.canceledMsg}
          </div>
        )}

        {/* Header */}
        <div className="text-center space-y-4 anim-up">
          <p className="section-label">{t.pricing.sectionLabel}</p>
          <h1 style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 900, letterSpacing: "-0.03em", color: "var(--text)", textTransform: "uppercase" }}>
            {t.pricing.pageTitle}<br />
            <span style={{ color: "var(--fh6-teal)" }}>{t.pricing.pageTitleAccent}</span>
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)", maxWidth: 460, margin: "0 auto", lineHeight: 1.7 }}>
            {t.pricing.pageSubtitle}
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
                {b === "monthly" ? t.pricing.monthly : t.pricing.yearly}
                {b === "yearly" && (
                  <span style={{
                    position: "absolute", top: -10, right: -6,
                    fontSize: 9, fontWeight: 800, padding: "2px 5px", borderRadius: 6,
                    background: "var(--fh6-teal)", color: "#000",
                  }}>{prices.yearly.discountLabel}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 anim-up">

          {/* Free */}
          <div className="r-card p-7 flex flex-col" style={{ gap: 24 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>{t.pricing.freeTitle}</p>
              <div className="flex items-baseline gap-2">
                <span style={{ fontSize: 42, fontWeight: 900, color: "var(--text)", fontFamily: "var(--font-geist-mono)" }}>{prices.freeDisplay}</span>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{t.pricing.freeForever}</span>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>{t.pricing.freeTagline}</p>
            </div>

            <div className="space-y-2.5">
              {t.pricing.freeFeatures.map((f) => (
                <div key={f.label} className="flex items-center gap-2.5">
                  {f.included ? <CheckIcon /> : <XIcon />}
                  <span style={{ fontSize: 12, color: f.included ? "var(--text)" : "var(--text-muted)" }}>{f.label}</span>
                </div>
              ))}
            </div>

            <Link href="/tune" className="r-btn r-btn-ghost w-full" style={{ justifyContent: "center", paddingTop: 11, paddingBottom: 11, fontSize: 12, marginTop: "auto" }}>
              {isPro ? t.pricing.currentPlanPro : t.pricing.continueFreeCta}
            </Link>
          </div>

          {/* Pro */}
          <div className="r-card p-7 flex flex-col" style={{
            gap: 24,
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
            }}>{t.pricing.popular}</div>

            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fh6-teal)", marginBottom: 6 }}>{t.pricing.proTitle}</p>
              <div className="flex items-baseline gap-2">
                <span style={{ fontSize: 42, fontWeight: 900, color: "var(--text)", fontFamily: "var(--font-geist-mono)" }}>
                  {currentPrice}
                </span>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{t.pricing.perMonth}</span>
              </div>
              {billing === "yearly" && (
                <p style={{ fontSize: 12, color: "var(--fh6-teal)", marginTop: 4, fontWeight: 600 }}>
                  {prices.yearly.savings}
                </p>
              )}
              {billing === "monthly" && (
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{t.pricing.cancelAnytime}</p>
              )}
            </div>

            <div className="space-y-2.5">
              {t.pricing.proFeatures.map((f) => (
                <div key={f.label} className="flex items-center gap-2.5">
                  <CheckIcon />
                  <span style={{ fontSize: 12, color: "var(--text)" }}>{f.label}</span>
                </div>
              ))}
            </div>

            {isPro ? (
              <div className="r-btn w-full" style={{
                justifyContent: "center", paddingTop: 12, paddingBottom: 12, marginTop: "auto",
                background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)",
                color: "#34d399", fontWeight: 700, fontSize: 13, cursor: "default",
              }}>
                {t.pricing.activePlan}
              </div>
            ) : (
              <button
                type="button"
                disabled={!!loading}
                onClick={() => void checkout(billing)}
                className="r-btn w-full"
                style={{
                  justifyContent: "center", paddingTop: 12, paddingBottom: 12, marginTop: "auto",
                  background: "var(--fh6-teal)", color: "#000", border: "none",
                  fontWeight: 800, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.06em",
                  boxShadow: "0 4px 24px rgba(44,206,204,0.35)",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(0,0,0,0.2)", borderTopColor: "#000" }} />
                    {t.pricing.waiting}
                  </span>
                ) : `${t.pricing.subscribeCta} ${currentButtonLabel}`}
              </button>
            )}
          </div>
        </div>

        {/* FAQ */}
        <div className="space-y-4 anim-up">
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.01em" }}>{t.pricing.faqTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {t.pricing.faq.map(({ q, a }) => (
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
