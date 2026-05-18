"use client"

import Link from "next/link"
import { useAuth } from "./AuthProvider"

export function AuthStatus() {
  const { configured, loading, user, signOut } = useAuth()

  if (loading) {
    return <span className="auth-pill">Sessão</span>
  }

  if (!configured) {
    return (
      <Link href="/login" className="auth-pill auth-pill-warn">
        Auth setup
      </Link>
    )
  }

  if (!user) {
    return (
      <Link href="/login" className="auth-pill">
        Entrar
      </Link>
    )
  }

  return (
    <div className="auth-status">
      <span className="auth-email">{user.email}</span>
      <button type="button" className="auth-pill" onClick={() => void signOut()}>
        Sair
      </button>
    </div>
  )
}
