"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { useSubscription } from "@/lib/subscription/context"

const NAV_LINKS = [
  { href: "/tune",        label: "Criar tune" },
  { href: "/community",   label: "Comunidade" },
  { href: "/diagnostics", label: "Diagnostico" },
  { href: "/calculator",  label: "Calculadora" },
  { href: "/cars",        label: "Carros" },
  { href: "/meta",        label: "Meta" },
  { href: "/compare",     label: "Comparar" },
  { href: "/garage",      label: "Garagem" },
]

export function MobileMenu() {
  const [open, setOpen] = useState(false)
  const { user, signOut } = useAuth()
  const { isPro } = useSubscription()
  const pathname = usePathname()

  useEffect(() => {
    const handle = window.setTimeout(() => setOpen(false), 0)
    return () => window.clearTimeout(handle)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open}
        className="xl:hidden"
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 5,
          width: 36,
          height: 36,
          borderRadius: 6,
          border: "1px solid var(--border-strong)",
          background: "transparent",
          cursor: "pointer",
          flexShrink: 0,
          padding: 0,
        }}
      >
        <span style={{
          display: "block", width: 16, height: 1.5,
          background: "var(--text-muted)",
          borderRadius: 2,
          transform: open ? "translateY(6.5px) rotate(45deg)" : "none",
          transition: "transform 0.2s ease",
        }} />
        <span style={{
          display: "block", width: 16, height: 1.5,
          background: "var(--text-muted)",
          borderRadius: 2,
          opacity: open ? 0 : 1,
          transition: "opacity 0.15s ease",
        }} />
        <span style={{
          display: "block", width: 16, height: 1.5,
          background: "var(--text-muted)",
          borderRadius: 2,
          transform: open ? "translateY(-6.5px) rotate(-45deg)" : "none",
          transition: "transform 0.2s ease",
        }} />
      </button>

      <div
        onClick={() => setOpen(false)}
        className="xl:hidden"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 40,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(3px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.2s ease",
        }}
      />

      <nav
        aria-label="Menu mobile"
        className="xl:hidden"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          width: "min(86vw, 340px)",
          background: "var(--bg-card)",
          borderLeft: "1px solid var(--border-strong)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          borderBottom: "1px solid var(--border)",
        }}>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text)" }}>
            Forza Lab
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 32, height: 32, borderRadius: 6,
              border: "1px solid var(--border-strong)", background: "transparent",
              color: "var(--text-muted)", cursor: "pointer",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div style={{ padding: "12px 0", flex: 1 }}>
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "14px 20px",
                  fontSize: 14,
                  fontWeight: active ? 800 : 600,
                  color: active ? "var(--blue)" : "var(--text)",
                  textDecoration: "none",
                  background: active ? "var(--blue-dim)" : "transparent",
                  borderLeft: `3px solid ${active ? "var(--blue)" : "transparent"}`,
                }}
              >
                {label}
              </Link>
            )
          })}
        </div>

        <div style={{
          padding: "16px 20px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}>
          {user ? (
            <>
              <div className="flex items-center justify-between">
                <p className="profile-email" style={{ margin: 0 }}>
                  {user.displayName ? `${user.displayName}` : user.email}
                </p>
                {isPro && (
                  <span style={{ fontSize: 9, fontWeight: 800, color: "var(--fh6-teal)", letterSpacing: "0.1em", padding: "2px 7px", borderRadius: 10, border: "1px solid rgba(44,206,204,0.3)", background: "rgba(44,206,204,0.08)" }}>
                    PRO
                  </span>
                )}
              </div>
              <Link href="/profile" className="r-btn r-btn-ghost w-full" style={{ fontSize: 12, padding: "9px 14px", justifyContent: "center" }}>
                Editar perfil
              </Link>
              {!isPro && (
                <Link href="/pricing" className="r-btn w-full" style={{ fontSize: 12, padding: "9px 14px", justifyContent: "center", background: "rgba(44,206,204,0.1)", border: "1px solid rgba(44,206,204,0.3)", color: "var(--fh6-teal)", fontWeight: 700 }}>
                  Upgrade para Pro ↗
                </Link>
              )}
              <Link href="/settings" className="r-btn r-btn-ghost w-full" style={{ fontSize: 12, padding: "9px 14px", justifyContent: "center" }}>
                Configuracoes
              </Link>
              <Link href="/support" className="r-btn r-btn-ghost w-full" style={{ fontSize: 12, padding: "9px 14px", justifyContent: "center" }}>
                Suporte
              </Link>
              <button
                type="button"
                className="r-btn r-btn-ghost w-full"
                style={{ fontSize: 12, padding: "9px 14px", justifyContent: "center" }}
                onClick={() => void signOut()}
              >
                Sair da conta
              </button>
            </>
          ) : (
            <Link href="/login" className="r-btn r-btn-primary" style={{ fontSize: 13, padding: "11px", justifyContent: "center" }}>
              Entrar
            </Link>
          )}
        </div>
      </nav>
    </>
  )
}
