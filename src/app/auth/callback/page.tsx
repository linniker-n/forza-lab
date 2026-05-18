"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/AuthProvider"

export default function AuthCallbackPage() {
  const router = useRouter()
  const { configured, completeEmailSignIn } = useAuth()
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [needsEmail, setNeedsEmail] = useState(false)

  useEffect(() => {
    if (!configured) {
      const handle = window.setTimeout(() => {
        setError("Firebase não configurado.")
      }, 0)
      return () => window.clearTimeout(handle)
    }

    let active = true

    completeEmailSignIn()
      .then(() => {
        if (active) router.replace("/tune")
      })
      .catch((err) => {
        if (!active) return
        setNeedsEmail(true)
        setError(err instanceof Error ? err.message : "Não foi possível concluir o login por email.")
      })

    return () => {
      active = false
    }
  }, [completeEmailSignIn, configured, router])

  async function submitEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    try {
      await completeEmailSignIn(email)
      router.replace("/tune")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível concluir o login por email.")
    }
  }

  return (
    <div className="dot-grid" style={{ minHeight: "100dvh" }}>
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-20">
        <div className="r-card bracket p-8 space-y-4">
          <p className="section-label">Autenticação</p>
          <h1 className="page-title">{error ? "Revise o login" : "Validando acesso"}</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
            {error ?? "Estamos finalizando sua sessão e redirecionando para o gerador."}
          </p>

          {needsEmail && (
            <form className="space-y-3" onSubmit={submitEmail}>
              <input
                className="r-input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Confirme seu email"
                required
              />
              <button type="submit" className="r-btn r-btn-primary w-full">
                Concluir login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
