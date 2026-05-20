"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { ThemeToggle } from "./ThemeToggle"

const NAV_LINKS = [
  { href: "/tune",        label: "Criar Tune",   icon: "⚡" },
  { href: "/cars",        label: "Carros",        icon: "🚗" },
  { href: "/garage",      label: "Garagem",       icon: "🏠" },
  { href: "/diagnostics", label: "Diagnóstico",   icon: "🔧" },
  { href: "/meta",        label: "Meta / Ranking",icon: "🏆" },
  { href: "/compare",     label: "Comparar",      icon: "⚖️" },
  { href: "/settings",    label: "Configurações",  icon: "⚙️" },
]

export function MobileMenu() {
  const [open, setOpen] = useState(false)
  const { user, signOut } = useAuth()
  const pathname = usePathname()

  // Fecha o menu quando a rota muda
  useEffect(() => {
    const handle = window.setTimeout(() => setOpen(false), 0)
    return () => window.clearTimeout(handle)
  }, [pathname])

  // Bloqueia scroll do body quando aberto
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  return (
    <>
      {/* Botão hamburguer — apenas mobile */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open}
        className="lg:hidden"
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

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className="lg:hidden"
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

      {/* Painel slide-in da direita */}
      <nav
        aria-label="Menu mobile"
        className="lg:hidden"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          width: "min(85vw, 320px)",
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
        {/* Header do painel */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          borderBottom: "1px solid var(--border)",
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>
            Menu
          </span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
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
        </div>

        {/* Links de navegação */}
        <div style={{ padding: "12px 0", flex: 1 }}>
          {NAV_LINKS.map(({ href, label, icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/")
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 20px",
                  fontSize: 14,
                  fontWeight: active ? 700 : 500,
                  color: active ? "var(--blue)" : "var(--text)",
                  textDecoration: "none",
                  background: active ? "var(--blue-dim)" : "transparent",
                  borderLeft: `3px solid ${active ? "var(--blue)" : "transparent"}`,
                  transition: "background 0.15s ease",
                }}
              >
                <span style={{ fontSize: 16, width: 22, textAlign: "center" }}>{icon}</span>
                {label}
              </Link>
            )
          })}
        </div>

        {/* Auth section no fundo */}
        <div style={{
          padding: "16px 20px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}>
          {user ? (
            <>
              <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.email}
              </p>
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
              Entrar / Criar conta
            </Link>
          )}
        </div>
      </nav>
    </>
  )
}
