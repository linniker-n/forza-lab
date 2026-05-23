"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { getPlanPrices, type PlanPrices } from "@/lib/pricing/currency"
import { useLanguage } from "@/lib/i18n/context"
import { useTranslations } from "@/lib/i18n/translations"

interface Props {
  open: boolean
  onClose(): void
  reason: "tune_limit" | "garage_limit" | "ranking_limit"
}

export function UpgradeModal({ open, onClose, reason }: Props) {
  const [prices] = useState<PlanPrices>(() => getPlanPrices())
  const { lang } = useLanguage()
  const t = useTranslations(lang)
  const c = t.modal[reason]

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  if (!open) return null

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        className="r-card bracket"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 420, width: "100%", padding: 32,
          border: "1px solid var(--border-blue)",
          background: "var(--bg-card)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(44,206,204,0.15)",
        }}
      >
        {/* Icon */}
        <div style={{
          width: 52, height: 52, borderRadius: 12, marginBottom: 20,
          background: "var(--blue-dim)", border: "1px solid var(--border-blue)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22,
        }}>
          {c.icon}
        </div>

        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "3px 10px", borderRadius: 20,
          background: "linear-gradient(135deg, rgba(44,206,204,0.18), rgba(212,39,138,0.18))",
          border: "1px solid rgba(44,206,204,0.3)",
          fontSize: 10, fontWeight: 800, letterSpacing: "0.1em",
          color: "var(--fh6-teal)", textTransform: "uppercase",
          marginBottom: 12,
        }}>
          {t.modal.badge}
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", marginBottom: 10, letterSpacing: "-0.02em" }}>
          {c.title}
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.65, marginBottom: 24 }}>
          {c.body}
        </p>

        {/* Features */}
        <div className="space-y-2" style={{ marginBottom: 24 }}>
          {t.modal.features.map((f) => (
            <div key={f} className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" fill="rgba(44,206,204,0.15)" stroke="var(--fh6-teal)" strokeWidth="1.2"/>
                <path d="M4.5 7l1.8 1.8L9.5 5" stroke="var(--fh6-teal)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: 12, color: "var(--text)" }}>{f}</span>
            </div>
          ))}
        </div>

        {/* Price */}
        <div style={{
          padding: "12px 16px", borderRadius: 8, marginBottom: 20,
          background: "rgba(44,206,204,0.06)", border: "1px solid rgba(44,206,204,0.15)",
          display: "flex", alignItems: "baseline", gap: 4,
        }}>
          <span style={{ fontSize: 28, fontWeight: 900, color: "var(--fh6-teal)", fontFamily: "var(--font-geist-mono)" }}>
            {prices.monthly.display}
          </span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.modal.perMonth}</span>
        </div>

        <div className="flex gap-2">
          <Link
            href="/pricing"
            className="r-btn flex-1"
            style={{
              justifyContent: "center", paddingTop: 12, paddingBottom: 12,
              background: "var(--fh6-teal)", color: "#000", border: "none",
              fontWeight: 800, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.06em",
              boxShadow: "0 4px 20px rgba(44,206,204,0.3)",
            }}
            onClick={onClose}
          >
            {c.cta}
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="r-btn r-btn-ghost"
            style={{ fontSize: 12, padding: "12px 16px" }}
          >
            {t.modal.dismiss}
          </button>
        </div>
      </div>
    </div>
  )
}
