"use client"

import Link from "next/link"
import { useState } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { getFirebaseDb } from "@/lib/firebase/client"

/*
  Envio de email: usa Formspree (https://formspree.io - gratuito, 50 msgs/mês).
  Configure:
    1. Crie conta em formspree.io com suporte.forzalab@gmail.com
    2. Crie um novo formulário
    3. Adicione ao .env.local: NEXT_PUBLIC_FORMSPREE_ID=xabcdefg
  Sem o env var, o ticket ainda é salvo no Firestore e o usuário vê confirmação.
*/

type Category = "bug" | "sugestao" | "pergunta" | "outro"

const CATEGORIES: { v: Category; l: string; desc: string }[] = [
  { v: "bug",      l: "Bug / Erro",   desc: "Algo não está funcionando como esperado" },
  { v: "sugestao", l: "Sugestão",     desc: "Ideia de nova funcionalidade ou melhoria" },
  { v: "pergunta", l: "Pergunta",     desc: "Dúvida sobre o app ou sobre tunagem" },
  { v: "outro",    l: "Outro",        desc: "Qualquer outro tipo de contato" },
]

const FORMSPREE_ID = process.env.NEXT_PUBLIC_FORMSPREE_ID ?? ""

export default function SupportPage() {
  const { user } = useAuth()
  const [category, setCategory] = useState<Category>("bug")
  const [message, setMessage] = useState("")
  const [name, setName] = useState(user?.displayName ?? user?.email?.split("@")[0] ?? "")
  const [email, setEmail] = useState(user?.email ?? "")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setSending(true); setError(null)

    try {
      // 1. Save to Firestore (always)
      const db = getFirebaseDb()
      if (db) {
        await addDoc(collection(db, "supportTickets"), {
          userId:   user?.uid ?? null,
          userName: name.trim() || null,
          userEmail: email.trim() || null,
          category,
          message:  message.trim(),
          status:   "open",
          createdAt: serverTimestamp(),
        })
      }

      // 2. Send email via Formspree (if configured)
      if (FORMSPREE_ID) {
        const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({
            name: name.trim() || "Anônimo",
            email: email.trim() || "sem-email",
            category: CATEGORIES.find((c) => c.v === category)?.l ?? category,
            message: message.trim(),
            _subject: `[Forza Lab] ${CATEGORIES.find((c) => c.v === category)?.l ?? "Suporte"} de ${name || email}`,
          }),
        })
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          const errMsg = (json as { error?: string }).error ?? "Erro ao enviar email."
          console.warn("Formspree error:", errMsg)
        }
      }

      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar. Tente novamente.")
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="dot-grid" style={{ minHeight: "100dvh", display: "flex", alignItems: "center" }}>
        <div className="max-w-md mx-auto px-4 sm:px-6 py-12 w-full">
          <div className="r-card bracket p-8 text-center space-y-4" style={{ borderColor: "rgba(52,211,153,0.4)" }}>
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.4)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12l4.5 4.5L19 7" stroke="#34d399" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div>
              <p style={{ fontSize: 18, fontWeight: 900, color: "#34d399" }}>Mensagem enviada!</p>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.6 }}>
                Recebemos seu contato e responderemos em breve no email informado.
              </p>
            </div>
            <div className="flex gap-2 justify-center flex-wrap pt-2">
              <button type="button" onClick={() => { setSent(false); setMessage("") }} className="r-btn r-btn-ghost" style={{ fontSize: 12 }}>
                Novo contato
              </button>
              <Link href="/" className="r-btn r-btn-primary" style={{ fontSize: 12 }}>
                Voltar ao início
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dot-grid" style={{ minHeight: "100dvh" }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-8 anim-up">

        <div>
          <p className="section-label">Forza Lab</p>
          <h1 className="page-title">Suporte & Feedback</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.6 }}>
            Encontrou um bug, tem uma sugestão ou quer tirar uma dúvida? Preencha o formulário abaixo.
          </p>
        </div>

        <form onSubmit={submit} className="r-card bracket p-6 space-y-6">

          {/* Category */}
          <div className="space-y-2">
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>Categoria</p>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.v}
                  type="button"
                  onClick={() => setCategory(c.v)}
                  className="r-card text-left p-3 transition-all"
                  style={{
                    border: category === c.v ? "1px solid var(--border-blue)" : "1px solid var(--border-strong)",
                    background: category === c.v ? "var(--blue-dim)" : "var(--bg-card)",
                    cursor: "pointer",
                  }}
                >
                  <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{c.l}</p>
                  <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2, lineHeight: 1.4 }}>{c.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Name + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="sup-name" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                Nome / Nick
              </label>
              <input
                id="sup-name"
                className="r-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome ou apelido"
                maxLength={64}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="sup-email" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                Email para resposta
              </label>
              <input
                id="sup-email"
                className="r-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </div>
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <label htmlFor="sup-msg" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>
              Mensagem
            </label>
            <textarea
              id="sup-msg"
              className="r-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Descreva detalhadamente o bug, sugestão ou dúvida..."
              rows={6}
              required
              style={{ resize: "vertical", minHeight: 120 }}
            />
            <p style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "right" }}>
              {message.length} / 2000 caracteres
            </p>
          </div>

          {error && (
            <div className="rounded-lg p-3" style={{ background: "var(--red-dim)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 12, color: "#fca5a5" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={sending || !message.trim()}
            className="r-btn r-btn-primary w-full"
            style={{ paddingTop: 12, paddingBottom: 12, opacity: sending || !message.trim() ? 0.6 : 1 }}
          >
            {sending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 rounded-full animate-spin"
                  style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                Enviando...
              </span>
            ) : "Enviar mensagem"}
          </button>
        </form>

        {/* Info box */}
        <div className="r-card p-4 flex gap-3" style={{ border: "1px solid var(--border-blue)" }}>
          <div style={{ width: 28, height: 28, flexShrink: 0, borderRadius: 6, background: "var(--blue-dim)", border: "1px solid var(--border-blue)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 3a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3z" stroke="var(--blue-bright)" strokeWidth="1.2"/>
              <path d="M1 3.5l5 3.5 5-3.5" stroke="var(--blue-bright)" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
            Mensagens são enviadas para{" "}
            <span style={{ color: "var(--blue-bright)", fontWeight: 600 }}>suporte.forzalab@gmail.com</span>.
            Respondemos em até 48h. Para bugs, inclua o carro e tipo de tune usado.
          </p>
        </div>

      </div>
    </div>
  )
}
