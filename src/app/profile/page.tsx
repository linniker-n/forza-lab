"use client"

import Image from "next/image"
import Link from "next/link"
import { useRef, useState } from "react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { useAuth } from "@/components/auth/AuthProvider"
import { getFirebaseAuth } from "@/lib/firebase/client"
import { loadUserProfile, resizeImageToBase64, saveUserProfile } from "@/lib/firebase/profile"
import { useSubscription } from "@/lib/subscription/context"

const PORTAL_URL = "https://us-central1-forza-tune-lab.cloudfunctions.net/customerPortal"

function ProfileInner() {
  const { user } = useAuth()
  const { isPro, status } = useSubscription()
  const fileRef = useRef<HTMLInputElement>(null)
  const [nickname, setNickname] = useState(() => user?.displayName ?? "")
  const [openingPortal, setOpeningPortal] = useState(false)
  const [portalError, setPortalError] = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoBase64, setPhotoBase64] = useState<string | undefined>(undefined)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load profile from Firestore once
  const [initialized, setInitialized] = useState(false)
  if (!initialized && user) {
    setInitialized(true)
    loadUserProfile(user.uid).then((p) => {
      if (p) {
        if (!nickname) setNickname(p.nickname)
        if (p.photoBase64) setPhotoPreview(p.photoBase64)
        setPhotoBase64(p.photoBase64)
      }
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }

  const initials = (nickname || user?.email || "?")[0]?.toUpperCase() ?? "?"

  async function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError("Imagem muito grande. Máx 5 MB."); return }
    try {
      const b64 = await resizeImageToBase64(file, 128)
      setPhotoPreview(b64)
      setPhotoBase64(b64)
      setSaved(false)
    } catch {
      setError("Não foi possível processar a imagem.")
    }
  }

  async function openPortal() {
    if (!user) return
    setOpeningPortal(true); setPortalError(null)
    try {
      const auth  = getFirebaseAuth()
      const token = await auth?.currentUser?.getIdToken(true)
      if (!token) throw new Error("Sessão expirada.")
      const res  = await fetch(PORTAL_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body:    JSON.stringify({ returnUrl: window.location.href }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      if (data.url) window.open(data.url, "_blank", "noopener,noreferrer")
    } catch (err) {
      setPortalError(err instanceof Error ? err.message : "Erro ao abrir portal.")
    } finally { setOpeningPortal(false) }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true); setError(null); setSaved(false)
    try {
      await saveUserProfile(user.uid, { nickname: nickname.trim(), photoBase64 })
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar perfil.")
    } finally { setSaving(false) }
  }

  return (
    <div className="dot-grid" style={{ minHeight: "100dvh" }}>
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-10 space-y-6 anim-up">

        <div>
          <p className="section-label">Conta</p>
          <h1 className="page-title">Editar Perfil</h1>
        </div>

        <form onSubmit={save} className="r-card bracket p-6 space-y-6">

          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative group"
              title="Trocar foto"
            >
              <div style={{
                width: 96, height: 96, borderRadius: "50%",
                overflow: "hidden", border: "2px solid var(--border-strong)",
                background: "var(--bg-elevated)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {photoPreview ? (
                  <img src={photoPreview} alt="Foto de perfil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 36, fontWeight: 800, color: "var(--blue-bright)" }}>{initials}</span>
                )}
              </div>
              <div style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
                justifyContent: "center", opacity: 0, transition: "opacity 0.15s",
              }} className="group-hover:opacity-100">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M3 15l4-4 2.5 2.5L14 8l3 4v3H3z" stroke="white" strokeWidth="1.3" strokeLinejoin="round"/>
                  <circle cx="6.5" cy="7.5" r="1.5" stroke="white" strokeWidth="1.3"/>
                  <rect x="1" y="4" width="18" height="13" rx="2" stroke="white" strokeWidth="1.3"/>
                </svg>
              </div>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={pickFile} />
            <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>
              Clique na foto para trocar · JPEG/PNG · Máx 5 MB
            </p>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-1.5">
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>
              Email
            </label>
            <div className="r-input" style={{ opacity: 0.6, cursor: "default", userSelect: "none" }}>
              {user?.email ?? "—"}
            </div>
          </div>

          {/* Nickname */}
          <div className="space-y-1.5">
            <label htmlFor="nickname" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>
              Apelido / Nick
            </label>
            <input
              id="nickname"
              className="r-input"
              value={nickname}
              onChange={(e) => { setNickname(e.target.value); setSaved(false) }}
              placeholder="Seu apelido na comunidade"
              maxLength={32}
            />
            <p style={{ fontSize: 10, color: "var(--text-muted)" }}>
              Exibido nas tunes compartilhadas na comunidade.
            </p>
          </div>

          {error && (
            <div className="rounded-lg p-3" style={{ background: "var(--red-dim)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 12, color: "#fca5a5" }}>
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="r-btn r-btn-primary flex-1"
              style={{ paddingTop: 11, paddingBottom: 11, opacity: saving ? 0.7 : 1 }}
            >
              {saving ? "Salvando..." : saved ? "Perfil salvo!" : "Salvar perfil"}
            </button>
            <Link href="/garage" className="r-btn r-btn-ghost" style={{ fontSize: 12, padding: "11px 16px" }}>
              Garagem
            </Link>
          </div>

          {saved && (
            <p style={{ fontSize: 12, color: "#34d399", textAlign: "center" }}>
              Perfil atualizado com sucesso.
            </p>
          )}
        </form>

        {/* Subscription management */}
        <div className="r-card p-5 space-y-4" style={{ border: isPro ? "1px solid rgba(44,206,204,0.4)" : "1px solid var(--border-strong)" }}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 4 }}>Plano atual</p>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 13, fontWeight: 800, color: isPro ? "var(--fh6-teal)" : "var(--text)" }}>
                  {isPro ? "Pro" : "Gratuito"}
                </span>
                {isPro && status === "active" && (
                  <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 10, background: "rgba(44,206,204,0.12)", color: "var(--fh6-teal)", border: "1px solid rgba(44,206,204,0.3)" }}>ATIVO</span>
                )}
                {isPro && status === "past_due" && (
                  <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 10, background: "rgba(245,158,11,0.12)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.3)" }}>PAGAMENTO PENDENTE</span>
                )}
                {isPro && status === "canceled" && (
                  <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 10, background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}>CANCELADO</span>
                )}
              </div>
            </div>
            {isPro ? (
              <button type="button" onClick={() => void openPortal()} disabled={openingPortal}
                className="r-btn r-btn-ghost" style={{ fontSize: 12, opacity: openingPortal ? 0.6 : 1 }}>
                {openingPortal ? "Abrindo..." : "Gerenciar assinatura ↗"}
              </button>
            ) : (
              <Link href="/pricing" className="r-btn r-btn-primary" style={{ fontSize: 12 }}>Fazer upgrade →</Link>
            )}
          </div>

          {isPro && (
            <div className="rounded-lg p-3" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.65 }}>
                Para <strong style={{ color: "#f87171" }}>cancelar</strong>, trocar de plano ou atualizar o método
                de pagamento, clique em <strong style={{ color: "var(--text)" }}>Gerenciar assinatura</strong>.
                Você será redirecionado ao portal seguro do Stripe em nova aba.
              </p>
              <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 6 }}>
                Ao cancelar, o acesso Pro permanece ativo até o fim do período já pago.
              </p>
            </div>
          )}

          {portalError && (
            <div className="rounded-lg p-3" style={{ background: "var(--red-dim)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 12, color: "#fca5a5" }}>
              {portalError}
            </div>
          )}
        </div>

        <div className="r-card p-4 flex gap-3" style={{ border: "1px solid var(--border-blue)" }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--blue-dim)", border: "1px solid var(--border-blue)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="var(--blue-bright)" strokeWidth="1.3"/>
              <path d="M6 4v3M6 8.5v.5" stroke="var(--blue-bright)" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
            Seu apelido e foto aparecem nas tunes que você compartilhar na{" "}
            <Link href="/community" style={{ color: "var(--blue-bright)", textDecoration: "none" }}>Comunidade</Link>.
            Tunes já compartilhadas não são atualizadas automaticamente.
          </p>
        </div>

      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileInner />
    </RequireAuth>
  )
}
