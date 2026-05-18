"use client"

import Link from "next/link"
import { useAuth } from "./AuthProvider"

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { configured, loading, user } = useAuth()

  if (loading) {
    return (
      <div className="dot-grid" style={{ minHeight: "100dvh" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
          <div className="r-card p-8 space-y-4">
            <div className="skeleton" style={{ height: 20, width: 160 }} />
            <div className="skeleton" style={{ height: 42, width: "70%" }} />
            <div className="skeleton" style={{ height: 14, width: "92%" }} />
          </div>
        </div>
      </div>
    )
  }

  if (!configured) {
    return (
      <div className="dot-grid" style={{ minHeight: "100dvh" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
          <div className="r-card bracket p-8 space-y-4">
            <p className="section-label">Autenticação pendente</p>
            <h1 className="page-title">Configure o Firebase</h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.65 }}>
              Para liberar esta área, defina as variáveis `NEXT_PUBLIC_FIREBASE_*` no ambiente local e no Cloudflare Pages.
            </p>
            <Link href="/login" className="r-btn r-btn-primary">Ver tela de login</Link>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="dot-grid" style={{ minHeight: "100dvh" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
          <div className="r-card bracket p-8 space-y-4">
            <p className="section-label">Área de usuário</p>
            <h1 className="page-title">Entre para continuar</h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.65 }}>
              Login por email ou Google protege tunes salvas, garagem e ferramentas avançadas.
            </p>
            <Link href="/login" className="r-btn r-btn-primary">Entrar ou criar conta</Link>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
