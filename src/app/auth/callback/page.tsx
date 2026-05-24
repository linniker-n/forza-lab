"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/AuthProvider"

type State = "checking" | "needs-email" | "completing" | "error" | "success"

export default function AuthCallbackPage() {
  const router  = useRouter()
  const { configured, completeEmailSignIn } = useAuth()
  const [state,       setState]       = useState<State>("checking")
  const [email,       setEmail]       = useState("")
  const [errorMsg,    setErrorMsg]    = useState<string | null>(null)
  const [submitting,  setSubmitting]  = useState(false)

  useEffect(() => {
    if (!configured) {
      const handle = window.setTimeout(() => {
        setState("error")
        setErrorMsg("Firebase não está configurado nesta instalação.")
      }, 0)
      return () => window.clearTimeout(handle)
    }

    let active = true

    completeEmailSignIn()
      .then(() => {
        if (!active) return
        setState("success")
        // Pequeno delay para o usuário ver o estado de sucesso
        setTimeout(() => router.replace("/tune"), 1500)
      })
      .catch((err: unknown) => {
        if (!active) return
        const msg = err instanceof Error ? err.message : String(err)

        // Detecta o caso de browser diferente (precisamos do email)
        if (msg.includes("browser diferente") || msg.includes("Informe novamente")) {
          setState("needs-email")
          setErrorMsg(msg)
        } else {
          setState("error")
          setErrorMsg(msg)
        }
      })

    return () => { active = false }
  }, [completeEmailSignIn, configured, router])

  async function submitEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email.trim()) return
    setSubmitting(true)
    setState("completing")
    setErrorMsg(null)

    try {
      await completeEmailSignIn(email.trim())
      setState("success")
      setTimeout(() => router.replace("/tune"), 1500)
    } catch (err: unknown) {
      setState("error")
      setErrorMsg(err instanceof Error ? err.message : "Não foi possível concluir o login.")
      setSubmitting(false)
    }
  }

  return (
    <div className="dot-grid" style={{ minHeight: "100dvh", display: "flex", alignItems: "center" }}>
      <div className="max-w-md mx-auto px-4 sm:px-6 py-12 w-full">

        {/* ── Checking / Completing ── */}
        {(state === "checking" || state === "completing") && (
          <div className="r-card bracket p-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-10 h-10 border-2 rounded-full animate-spin"
                style={{ borderColor: "var(--border-strong)", borderTopColor: "var(--blue)" }} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
              {state === "completing" ? "Entrando..." : "Validando link..."}
            </p>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Aguarde um momento.
            </p>
          </div>
        )}

        {/* ── Success ── */}
        {state === "success" && (
          <div className="r-card bracket p-8 text-center space-y-4"
            style={{ borderColor: "rgba(52,211,153,0.4)" }}>
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.4)" }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10l4 4 8-8" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#34d399" }}>Login realizado!</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Redirecionando...</p>
          </div>
        )}

        {/* ── Needs email (different browser) ── */}
        {state === "needs-email" && (
          <div className="r-card bracket p-8 space-y-5">
            <div>
              <p className="section-label" style={{ marginBottom: 6 }}>Confirmar email</p>
              <h1 style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", lineHeight: 1.2 }}>
                Confirme seu email para entrar
              </h1>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.6 }}>
                Você abriu este link em um browser diferente do que foi usado para enviar o email.
                Digite o mesmo email para concluir o login.
              </p>
            </div>

            {/* Info box */}
            <div className="rounded-lg p-3 flex gap-3"
              style={{ background: "var(--blue-dim)", border: "1px solid var(--border-blue)" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="8" cy="8" r="6" stroke="var(--blue-bright)" strokeWidth="1.4"/>
                <path d="M8 5v4M8 10.5v.5" stroke="var(--blue-bright)" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <p style={{ fontSize: 12, color: "var(--blue-bright)", lineHeight: 1.55 }}>
                Isso acontece quando o link é aberto em um app de email (Gmail, Outlook, etc.)
                que usa seu próprio browser interno. É normal — só confirme o email abaixo.
              </p>
            </div>

            <form className="space-y-3" onSubmit={submitEmail}>
              <input
                className="r-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu email"
                required
                autoFocus
              />
              <button
                type="submit"
                className="r-btn r-btn-primary w-full"
                disabled={submitting}
                style={{ paddingTop: 11, paddingBottom: 11, opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? "Entrando..." : "Concluir login"}
              </button>
            </form>

            <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)" }}>
              Link errado ou expirado?{" "}
              <Link href="/login" style={{ color: "var(--blue-bright)", textDecoration: "none" }}>
                Solicitar novo link →
              </Link>
            </p>
          </div>
        )}

        {/* ── Error ── */}
        {state === "error" && (
          <div className="r-card bracket p-8 space-y-5">
            <div>
              <p className="section-label" style={{ marginBottom: 6 }}>Erro de autenticação</p>
              <h1 style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", lineHeight: 1.2 }}>
                Não foi possível entrar
              </h1>
            </div>

            <div className="rounded-lg p-3"
              style={{ background: "var(--red-dim)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p style={{ fontSize: 13, color: "#fca5a5", lineHeight: 1.55 }}>
                {errorMsg ?? "Erro desconhecido."}
              </p>
            </div>

            {/* Guia de soluções */}
            <div className="space-y-2">
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                O que fazer
              </p>
              <ul className="space-y-2">
                {[
                  "Verifique se o link não expirou (válido por 24h)",
                  "Cada link só pode ser usado uma vez",
                  "Abra o link no mesmo browser onde pediu o acesso",
                  "Se usar Gmail app, copie o link e abra no Chrome/Safari",
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-2"
                    style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    <span style={{ color: "var(--blue)", marginTop: 1, flexShrink: 0 }}>→</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <Link href="/login" className="r-btn r-btn-primary w-full"
              style={{ justifyContent: "center", paddingTop: 11, paddingBottom: 11 }}>
              Solicitar novo link
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
