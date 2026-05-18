"use client"

import Link from "next/link"
import { useAuth } from "./AuthProvider"

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth()

  if (loading) {
    return (
      <div className="dot-grid" style={{ minHeight: "100dvh" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 space-y-4">
          <div className="skeleton" style={{ height: 18, width: 120 }} />
          <div className="skeleton" style={{ height: 44, width: "65%" }} />
          <div className="skeleton" style={{ height: 13, width: "88%" }} />
          <div className="skeleton" style={{ height: 13, width: "72%" }} />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="dot-grid" style={{ minHeight: "100dvh" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
          <div className="r-card bracket p-8 space-y-4">
            <p className="section-label">Área restrita</p>
            <h1 className="page-title">Entre para continuar</h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.65 }}>
              Faça login para acessar esta área. Suas tunes e garagem ficam salvas na sua conta.
            </p>
            <Link href="/login" className="r-btn r-btn-primary">
              Entrar ou criar conta
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
