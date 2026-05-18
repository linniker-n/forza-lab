"use client"

import Link from "next/link"
import { useState } from "react"
import { useAuth } from "@/components/auth/AuthProvider"

export default function LoginPage() {
  const { configured, loading, user, signInWithEmail, signInWithGoogle, signOut } = useAuth()
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function submitEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setStatus(null)

    try {
      await signInWithEmail(email)
      setStatus("Enviamos um link de acesso para seu email.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar o link.")
    } finally {
      setSubmitting(false)
    }
  }

  async function submitGoogle() {
    setSubmitting(true)
    setError(null)

    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível iniciar login com Google.")
      setSubmitting(false)
    }
  }

  return (
    <div className="dot-grid" style={{ minHeight: "100dvh" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 items-start">
        <section className="anim-up space-y-6">
          <div>
            <p className="section-label">Conta Forza Tune Lab</p>
            <h1 className="page-title">Login para pilotos e tuners</h1>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 10, maxWidth: 560, lineHeight: 1.65 }}>
              Use email ou Google para acessar garagem, tunes salvas, comparador e próximas funções comunitárias.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              ["Email", "Magic link sem senha"],
              ["Google", "OAuth via Firebase"],
              ["Garagem", "Dados por usuário"],
            ].map(([title, desc]) => (
              <div key={title} className="r-card p-4">
                <p style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{title}</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="r-card bracket p-5 space-y-5 anim-up" style={{ animationDelay: "80ms" }}>
          {!configured ? (
            <div className="space-y-4">
              <p className="section-label">Configuração necessária</p>
              <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>
                O login está implementado, mas precisa das variáveis do Firebase para funcionar.
              </p>
              <div className="rounded-lg p-3 mono-val" style={{ fontSize: 11, color: "var(--text-muted)", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                NEXT_PUBLIC_FIREBASE_API_KEY<br />
                NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN<br />
                NEXT_PUBLIC_FIREBASE_PROJECT_ID<br />
                NEXT_PUBLIC_FIREBASE_APP_ID
              </div>
              <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.55 }}>
                Depois de configurar o projeto no Firebase, ative Google e Email link em Authentication.
              </p>
            </div>
          ) : user ? (
            <div className="space-y-4">
              <p className="section-label">Sessão ativa</p>
              <div>
                <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>{user.email}</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Você já está autenticado.</p>
              </div>
              <div className="flex gap-2">
                <Link href="/tune" className="r-btn r-btn-primary">Criar tune</Link>
                <button type="button" className="r-btn r-btn-ghost" onClick={() => void signOut()}>
                  Sair
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                className="r-btn r-btn-primary w-full"
                style={{ paddingTop: 12, paddingBottom: 12 }}
                disabled={loading || submitting}
                onClick={() => void submitGoogle()}
              >
                Entrar com Google
              </button>

              <div className="section-divider" />

              <form className="space-y-3" onSubmit={submitEmail}>
                <div className="space-y-2">
                  <label htmlFor="email" style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="r-input"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="voce@email.com"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="r-btn r-btn-outline w-full"
                  disabled={loading || submitting}
                  style={{ paddingTop: 11, paddingBottom: 11 }}
                >
                  Enviar link por email
                </button>
              </form>

              {status && (
                <p className="rounded-lg p-3" style={{ fontSize: 12, color: "#86efac", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                  {status}
                </p>
              )}
              {error && (
                <p className="rounded-lg p-3" style={{ fontSize: 12, color: "#fca5a5", background: "var(--red-dim)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  {error}
                </p>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
