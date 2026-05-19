"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/components/auth/AuthProvider"

/** Detecta browsers embutidos (WhatsApp, Instagram, Facebook, Snapchat, Line...) */
function detectInAppBrowser(): { detected: boolean; name: string } {
  if (typeof navigator === "undefined") return { detected: false, name: "" }
  const ua = navigator.userAgent
  if (/FBAN|FBAV/.test(ua))     return { detected: true, name: "Facebook" }
  if (/Instagram/.test(ua))     return { detected: true, name: "Instagram" }
  if (/WhatsApp/.test(ua))      return { detected: true, name: "WhatsApp" }
  if (/Snapchat/.test(ua))      return { detected: true, name: "Snapchat" }
  if (/Line\//.test(ua))        return { detected: true, name: "Line" }
  if (/MicroMessenger|WeChat/.test(ua)) return { detected: true, name: "WeChat" }
  // iOS WebViews sem Safari/Chrome no UA
  if (/iPhone|iPad|iPod/.test(ua) && !/Safari/.test(ua) && !/CriOS|FxiOS/.test(ua))
    return { detected: true, name: "app" }
  return { detected: false, name: "" }
}

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.706 17.64 9.2z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z"/>
  </svg>
)

export default function LoginPage() {
  const { loading, user, signInWithEmail, signInWithGoogle, signOut } = useAuth()
  const [email,      setEmail]      = useState("")
  const [status,     setStatus]     = useState<string | null>(null)
  const [error,      setError]      = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [copied,     setCopied]     = useState(false)
  const [pageUrl,    setPageUrl]    = useState("")
  const inApp = useMemo(() => detectInAppBrowser(), [])

  useEffect(() => {
    setPageUrl(window.location.href)
  }, [])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard não disponível, apenas mostra o URL
    }
  }

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true); setError(null); setStatus(null)
    try {
      await signInWithEmail(email)
      setStatus("Link de acesso enviado. Verifique sua caixa de entrada.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar o link.")
    } finally { setSubmitting(false) }
  }

  async function submitGoogle() {
    setSubmitting(true); setError(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível iniciar o login com Google.")
      setSubmitting(false)
    }
  }

  return (
    <div className="dot-grid" style={{ minHeight: "100dvh" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 items-start">

        {/* ── Left — hero copy ── */}
        <section className="anim-up space-y-6 lg:pt-4">
          <div className="space-y-3">
            <p className="section-label">Sua conta</p>
            <h1 className="page-title">Entre para salvar suas tunes</h1>
            <p style={{ fontSize: 14, color: "var(--text-muted)", maxWidth: 460, lineHeight: 1.7 }}>
              Suas tunes ficam salvas na sua conta e sincronizadas em qualquer dispositivo.
              Acesse garagem, comparador e ranking personalizado.
            </p>
          </div>

          <ul className="space-y-3">
            {[
              "Garagem com todas as suas tunes geradas",
              "Comparador entre carros e configurações",
              "Ranking técnico por classe e tipo de prova",
              "Acesso em qualquer dispositivo",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3" style={{ fontSize: 13, color: "var(--text-muted)" }}>
                <span
                  className="flex items-center justify-center rounded-full shrink-0"
                  style={{ width: 20, height: 20, background: "var(--blue-dim)", border: "1px solid var(--border-blue)" }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 2" stroke="var(--blue-bright)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* ── Right — form card ── */}
        <section className="r-card bracket p-6 space-y-5 anim-up" style={{ animationDelay: "80ms" }}>

          {/* ── Banner: browser interno detectado ── */}
          {inApp.detected && (
            <div className="rounded-lg p-4 space-y-3" style={{
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.30)",
            }}>
              <div className="flex items-start gap-3">
                <span style={{ fontSize: 18, lineHeight: 1, marginTop: 1 }}>⚠️</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24" }}>
                    Browser do {inApp.name} não suporta login
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.6 }}>
                    Para fazer login, abra este link no <strong style={{ color: "var(--text)" }}>Safari</strong> ou <strong style={{ color: "var(--text)" }}>Chrome</strong>.
                    Browsers de apps bloqueiam o login por segurança.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => void copyLink()}
                  className="r-btn"
                  style={{
                    fontSize: 11, fontWeight: 700, padding: "7px 14px",
                    background: "#fbbf24", color: "#000", border: "none",
                  }}
                >
                  {copied ? "✓ Link copiado!" : "Copiar link"}
                </button>
                <a
                  href={pageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="r-btn r-btn-ghost"
                  style={{ fontSize: 11, fontWeight: 700, padding: "7px 14px" }}
                >
                  Tentar abrir no navegador
                </a>
              </div>
              <p style={{ fontSize: 10, color: "var(--text-subtle)", fontFamily: "var(--font-geist-mono)", wordBreak: "break-all" }}>
                {pageUrl}
              </p>
            </div>
          )}

          {user ? (
            /* ── Sessão ativa ── */
            <div className="space-y-5">
              <div>
                <p className="section-label" style={{ marginBottom: 8 }}>Sessão ativa</p>
                <p style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>{user.email}</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Você já está autenticado.</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Link href="/tune"   className="r-btn r-btn-primary">Criar tune</Link>
                <Link href="/garage" className="r-btn r-btn-ghost">Minha garagem</Link>
                <button type="button" className="r-btn r-btn-ghost" onClick={() => void signOut()}>
                  Sair
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>Entrar na conta</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Use Google ou email para continuar.</p>
              </div>

              {/* Google button — padrão Google Brand */}
              <button
                type="button"
                disabled={loading || submitting}
                onClick={() => void submitGoogle()}
                className="w-full flex items-center justify-center gap-3 rounded-lg transition-all"
                style={{
                  padding: "11px 16px",
                  background: "#fff",
                  border: "1px solid #dadce0",
                  color: "#3c4043",
                  fontSize: 14,
                  fontWeight: 500,
                  fontFamily: "var(--font-geist-sans), sans-serif",
                  cursor: loading || submitting ? "not-allowed" : "pointer",
                  opacity: loading || submitting ? 0.7 : 1,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                }}
                onMouseEnter={(e) => { if (!submitting) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)" }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.12)" }}
              >
                <GoogleLogo />
                Continuar com Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: "var(--border-strong)" }} />
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>ou</span>
                <div className="flex-1 h-px" style={{ background: "var(--border-strong)" }} />
              </div>

              {/* Email form */}
              <form className="space-y-3" onSubmit={submitEmail}>
                <div className="space-y-1.5">
                  <label htmlFor="email" style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="r-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@email.com"
                    required
                  />
                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Você receberá um link de acesso — sem precisar de senha.
                  </p>
                </div>
                <button
                  type="submit"
                  className="r-btn r-btn-outline w-full"
                  disabled={loading || submitting}
                  style={{ paddingTop: 11, paddingBottom: 11, opacity: loading || submitting ? 0.6 : 1 }}
                >
                  {submitting ? "Enviando..." : "Enviar link de acesso"}
                </button>
              </form>

              {status && (
                <p className="rounded-lg p-3" style={{ fontSize: 12, color: "#86efac", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", lineHeight: 1.55 }}>
                  {status}
                </p>
              )}
              {error && (
                <p className="rounded-lg p-3" style={{ fontSize: 12, color: "#fca5a5", background: "var(--red-dim)", border: "1px solid rgba(239,68,68,0.2)", lineHeight: 1.55 }}>
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
