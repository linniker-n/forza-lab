"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { getCarImageUrl } from "@/data/cars"
import { getFirebaseDb } from "@/lib/firebase/client"
import { diagnose as runDiagnostic, PROBLEM_LABELS } from "@/lib/tune-engine/diagnostics"
import type { DiagnosticProblem, DiagnosticResult, GeneratedTune } from "@/types"
import { collection, deleteDoc, doc, getDocs, orderBy, query } from "firebase/firestore"

interface SavedTune {
  id: string
  saved_at: string
  tune: GeneratedTune
}

function storageKey(userId?: string) {
  return `forza-tune-lab:saved-tunes:${userId ?? "local"}`
}

function readSavedTunes(userId?: string): SavedTune[] {
  try {
    const raw = window.localStorage.getItem(storageKey(userId))
    const data = raw ? JSON.parse(raw) : []
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function firestoreDate(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString()
  }
  return new Date().toISOString()
}

function mapFirestoreTune(id: string, data: Record<string, unknown>): SavedTune | null {
  if (!data.tune) return null
  return {
    id,
    saved_at: firestoreDate(data.createdAt),
    tune: data.tune as GeneratedTune,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de diagnóstico contextualizado
// ─────────────────────────────────────────────────────────────────────────────

function getParameterCurrentValue(param: string, tune: GeneratedTune): string | null {
  const t = tune.tuning
  const map: Record<string, string | null> = {
    "Barra estabilizadora dianteira": String(t.antiroll_bars.front),
    "Barra dianteira":                String(t.antiroll_bars.front),
    "Barra estabilizadora traseira":  String(t.antiroll_bars.rear),
    "Diferencial traseiro (aceleração)": t.differential.rear_accel !== undefined ? `${t.differential.rear_accel}%` : null,
    "Diferencial traseiro (desaceleração)": t.differential.rear_decel !== undefined ? `${t.differential.rear_decel}%` : null,
    "Diferencial dianteiro (aceleração)": t.differential.front_accel !== undefined ? `${t.differential.front_accel}%` : null,
    "Diferencial dianteiro":          t.differential.front_accel !== undefined ? `${t.differential.front_accel}%` : null,
    "Diferencial central (AWD)":      t.differential.center_balance !== undefined ? `${t.differential.center_balance}%` : null,
    "Pressão dos pneus dianteiros":   `${t.tires.front} PSI`,
    "Pressão dos pneus traseiros":    `${t.tires.rear} PSI`,
    "Pressão dos pneus":              `${t.tires.front} / ${t.tires.rear} PSI`,
    "Molas traseiras":                String(t.springs.rear),
    "Rebound (rebote)":               `${t.damping.rebound_front} / ${t.damping.rebound_rear}`,
    "Rebound dianteiro":              String(t.damping.rebound_front),
    "Bump (compressão)":              `${t.damping.bump_front} / ${t.damping.bump_rear}`,
    "Balanceamento de freios":        `${t.brakes.balance}%`,
    "Pressão de freio":               `${t.brakes.pressure}%`,
    "Cambagem dianteira":             `${t.alignment.camber_front}°`,
    "Toe dianteiro":                  `${t.alignment.toe_front}°`,
    "Aero dianteiro":                 t.aero.front,
    "Aero traseiro":                  t.aero.rear,
  }
  return map[param] ?? null
}

function parseNumericDelta(adj: string): number | null {
  const clean = adj.replace("−", "-").replace("–", "-")
  const m = clean.match(/([+-]?\s*\d+(?:[.,]\d+)?)/)
  if (!m) return null
  const val = parseFloat(m[1].replace(",", ".").replace(" ", ""))
  if (isNaN(val)) return null
  return val
}

function computeTargetValue(currentStr: string, adj: string): string | null {
  const currentNum = parseFloat(currentStr.replace(/[%°]|PSI/g, "").trim())
  if (isNaN(currentNum)) return null
  const delta = parseNumericDelta(adj)
  if (delta === null) return null
  const target = Math.round((currentNum + delta) * 10) / 10
  const unit = currentStr.includes("%") ? "%" : currentStr.includes("°") ? "°" : currentStr.includes("PSI") ? " PSI" : ""
  return `${target}${unit}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Painel de diagnóstico por tune
// ─────────────────────────────────────────────────────────────────────────────

const PROBLEMS = Object.entries(PROBLEM_LABELS) as [DiagnosticProblem, string][]

const PROB_ICONS: Record<DiagnosticProblem, string> = {
  understeer:        "↙",
  oversteer:         "↗",
  wheelspin:         "◎",
  slow_cornering:    "↻",
  slow_straight:     "▶",
  bouncing:          "↕",
  drift_loss:        "≈",
  brake_instability: "⊗",
}

const PROB_COLORS: Record<DiagnosticProblem, string> = {
  understeer:        "#60a5fa",
  oversteer:         "#fb923c",
  wheelspin:         "#fbbf24",
  slow_cornering:    "#a78bfa",
  slow_straight:     "#34d399",
  bouncing:          "#f472b6",
  drift_loss:        "#fb923c",
  brake_instability: "#f87171",
}

function DiagnosticPanel({ tune, onClose }: { tune: GeneratedTune; onClose(): void }) {
  const [problem,  setProblem]  = useState<DiagnosticProblem | null>(null)
  const [result,   setResult]   = useState<DiagnosticResult | null>(null)

  function selectProblem(p: DiagnosticProblem) {
    setProblem(p)
    setResult(runDiagnostic(p, { car: tune.car, tuneType: tune.tune_type }))
  }

  const titleStyle = {
    fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
    textTransform: "uppercase" as const, color: "var(--text-muted)", marginBottom: 8,
  }

  return (
    <div
      className="r-card anim-up space-y-5"
      style={{ padding: "20px 20px 24px", borderColor: "var(--border-blue)", animationDelay: "0ms" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="section-label">Diagnóstico</p>
          <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginTop: 2 }}>
            {tune.car.brand} {tune.car.model} &middot; {tune.tune_type.replace("_", " ")}
          </p>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            Selecione o sintoma que está sentindo para receber correções específicas desta tune.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar diagnóstico"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 30, height: 30, borderRadius: 6, flexShrink: 0,
            border: "1px solid var(--border-strong)", background: "transparent",
            color: "var(--text-muted)", cursor: "pointer",
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {!result ? (
        /* ── Seleção de problema ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PROBLEMS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => selectProblem(key)}
              className="prob-card"
              style={{ borderColor: PROB_COLORS[key] + "33", gap: 10 }}
            >
              <span style={{ fontSize: 18, color: PROB_COLORS[key], flexShrink: 0, width: 24, textAlign: "center" }}>
                {PROB_ICONS[key]}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", textAlign: "left" }}>
                {label}
              </span>
            </button>
          ))}
        </div>
      ) : (
        /* ── Resultado do diagnóstico ── */
        <div className="space-y-4">
          {/* Voltar */}
          <button
            type="button"
            onClick={() => { setProblem(null); setResult(null) }}
            style={{ fontSize: 12, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: 0 }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 1L3 6l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Voltar aos sintomas
          </button>

          {/* Problema selecionado */}
          <div className="flex items-center gap-3 rounded-lg p-3" style={{ background: PROB_COLORS[problem!] + "14", border: `1px solid ${PROB_COLORS[problem!]}33` }}>
            <span style={{ fontSize: 20, color: PROB_COLORS[problem!] }}>{PROB_ICONS[problem!]}</span>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: PROB_COLORS[problem!] }}>{PROBLEM_LABELS[problem!]}</p>
            </div>
          </div>

          {/* Diagnóstico */}
          <div className="rounded-lg p-4 space-y-2" style={{ background: "var(--blue-dim)", border: "1px solid var(--border-blue)" }}>
            <p style={titleStyle}>Diagnóstico</p>
            <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.65 }}>{result.diagnosis}</p>
          </div>

          {/* Notas contextuais do carro */}
          {(result.context_notes ?? []).length > 0 && (
            <div className="rounded-lg p-3 space-y-1" style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)" }}>
              {result.context_notes!.map((note, i) => (
                <p key={i} style={{ fontSize: 12, color: "#fbbf24", lineHeight: 1.55 }}>
                  {note}
                </p>
              ))}
            </div>
          )}

          {/* Correções */}
          <div className="space-y-3">
            <p style={titleStyle}>{result.fixes.length} correções recomendadas</p>
            {result.fixes.map((fix, i) => {
              const current = getParameterCurrentValue(fix.parameter, tune)
              const adj     = fix.adjustment
              // Try to compute a specific target value
              const singleCurrent = current && !current.includes("/") ? current : null
              const target  = singleCurrent ? computeTargetValue(singleCurrent, adj) : null

              return (
                <div
                  key={i}
                  className="r-card"
                  style={{ padding: "14px 16px" }}
                >
                  {/* Parameter + adjustment */}
                  <div className="flex items-start justify-between gap-3 flex-wrap" style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", lineHeight: 1.3 }}>
                      {fix.parameter}
                    </p>
                    <span
                      style={{
                        fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 4,
                        background: "rgba(245,158,11,0.12)", color: "#fbbf24",
                        border: "1px solid rgba(245,158,11,0.25)", whiteSpace: "nowrap", flexShrink: 0,
                      }}
                    >
                      {adj}
                    </span>
                  </div>

                  {/* Current → target values */}
                  {current && (
                    <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Atual:</span>
                      <code style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-geist-mono)" }}>
                        {current}
                      </code>
                      {target && target !== current && (
                        <>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                            <path d="M2 6h8M7 2l3 4-3 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <code style={{ fontSize: 12, fontWeight: 700, color: "var(--blue-bright)", fontFamily: "var(--font-geist-mono)" }}>
                            {target}
                          </code>
                        </>
                      )}
                    </div>
                  )}

                  {/* Explanation */}
                  <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.65 }}>
                    {fix.reason}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Link para diagnostics page */}
          <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>
            Quer diagnóstico avançado?{" "}
            <Link href={`/diagnostics`} style={{ color: "var(--blue-bright)", textDecoration: "none" }}>
              Abrir diagnóstico completo →
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Página principal da Garagem
// ─────────────────────────────────────────────────────────────────────────────

export default function GaragePage() {
  const [saved,        setSaved]       = useState<SavedTune[]>([])
  const [syncNote,     setSyncNote]    = useState<string | null>(null)
  const [diagOpenId,   setDiagOpenId]  = useState<string | null>(null)
  const { user } = useAuth()
  const userId = user?.uid

  useEffect(() => {
    let active = true
    const db = getFirebaseDb()
    const localTunes = readSavedTunes(userId)

    // Exibe tunes locais IMEDIATAMENTE — sem esperar Firestore
    setSaved(localTunes)

    if (!db || !userId) {
      return () => { active = false }
    }

    // Firestore carrega em background e atualiza quando pronto
    const tunesRef = collection(db, "users", userId, "savedTunes")
    getDocs(query(tunesRef, orderBy("createdAt", "desc")))
      .then((snapshot) => {
        if (!active) return
        const remoteTunes = snapshot.docs
          .map((item) => mapFirestoreTune(item.id, item.data()))
          .filter((item): item is SavedTune => Boolean(item))

        const remoteIds = new Set(remoteTunes.map((t) => t.id))
        const localOnly = localTunes.filter((lt) => !remoteIds.has(lt.id))
        const merged = [...remoteTunes, ...localOnly].sort(
          (a, b) => new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime()
        )
        setSyncNote(null)
        setSaved(merged)
      })
      .catch(() => {
        if (!active) return
        setSyncNote("Garagem Firebase indisponível. Exibindo tunes salvas neste navegador.")
      })

    return () => { active = false }
  }, [userId])

  async function removeTune(id: string) {
    const db = getFirebaseDb()
    if (db && user) {
      try {
        await deleteDoc(doc(db, "users", user.uid, "savedTunes", id))
      } catch {
        setSyncNote("Não foi possível remover no Firebase agora.")
      }
    }
    const next = saved.filter((item) => item.id !== id)
    window.localStorage.setItem(storageKey(user?.uid), JSON.stringify(next))
    setSaved(next)
    if (diagOpenId === id) setDiagOpenId(null)
  }

  async function clearGarage() {
    const db = getFirebaseDb()
    if (db && user) {
      try {
        const snapshot = await getDocs(collection(db, "users", user.uid, "savedTunes"))
        await Promise.all(snapshot.docs.map((item) => deleteDoc(item.ref)))
      } catch {
        setSyncNote("Não foi possível limpar no Firebase agora.")
      }
    }
    window.localStorage.removeItem(storageKey(user?.uid))
    setSaved([])
    setDiagOpenId(null)
  }

  const TUNE_LABELS: Record<string, string> = {
    street: "Rua", drag: "Drag", drift: "Drift",
    rally: "Rally", cross_country: "Cross Country", top_speed: "Top Speed", grip: "Grip",
  }

  return (
    <RequireAuth>
      <div className="dot-grid" style={{ minHeight: "100dvh" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap anim-up">
          <div>
            <p className="section-label">Garagem</p>
            <h1 className="page-title">Tunes salvas</h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>
              As tunes sincronizam no Firebase e mantêm cópia local neste navegador.
            </p>
          </div>
          <div className="flex gap-2">
            {saved.length > 0 && (
              <button type="button" className="r-btn r-btn-ghost" onClick={() => void clearGarage()}>
                Limpar garagem
              </button>
            )}
            <Link href="/tune" className="r-btn r-btn-primary">Criar tune</Link>
          </div>
        </div>

        {syncNote && (
          <p className="rounded-lg p-3 anim-up" style={{ fontSize: 12, color: "#fbbf24", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
            {syncNote}
          </p>
        )}

        {saved.length === 0 ? (
          <div className="r-card bracket p-8 text-center space-y-4 anim-up" style={{ animationDelay: "80ms" }}>
            <p style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>Nenhuma tune salva ainda</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 460, margin: "0 auto", lineHeight: 1.6 }}>
              Gere uma tune e use o botão de salvar no resultado. A garagem vai guardar as configurações para consulta rápida.
            </p>
            <Link href="/tune" className="r-btn r-btn-primary">Gerar primeira tune</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {saved.map((item, index) => {
              const { tune } = item
              const imageUrl = getCarImageUrl(tune.car)
              const diagOpen = diagOpenId === item.id

              return (
                <div key={item.id} className="space-y-2">
                  {/* ── Car card ── */}
                  <article
                    className="r-card bracket p-4 anim-up"
                    style={{
                      animationDelay: `${index * 45}ms`,
                      borderColor: diagOpen ? "var(--border-blue)" : undefined,
                    }}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr_auto] gap-4 items-start">
                      {/* Image */}
                      <div className="relative rounded-lg overflow-hidden" style={{ height: 78, background: "var(--bg-elevated)" }}>
                        {imageUrl && (
                          <Image src={imageUrl} alt={`${tune.car.brand} ${tune.car.model}`} fill sizes="140px" style={{ objectFit: "contain", padding: 8 }} />
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0">
                        <div className="flex gap-2 flex-wrap" style={{ marginBottom: 7 }}>
                          <span className={`badge-class badge-${tune.target_class}`}>{tune.target_class}</span>
                          <span className={`badge-class badge-${tune.drivetrain === "AWD" ? "awd" : tune.drivetrain === "RWD" ? "rwd" : "fwd"}`}>{tune.drivetrain}</span>
                          <span className="badge-class" style={{ color: "var(--blue-bright)", background: "var(--blue-dim)", borderColor: "var(--border-blue)" }}>
                            {TUNE_LABELS[tune.tune_type] ?? tune.tune_type}
                          </span>
                        </div>
                        <h2 style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>
                          {tune.car.brand} {tune.car.model}
                        </h2>
                        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
                          Salva em {new Date(item.saved_at).toLocaleString("pt-BR")} · PI estimado {tune.pi_estimate}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-row sm:flex-col gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setDiagOpenId(diagOpen ? null : item.id)}
                          className="r-btn"
                          style={{
                            fontSize: 11, padding: "6px 12px",
                            background: diagOpen ? "var(--blue-dim)" : "transparent",
                            color: diagOpen ? "var(--blue-bright)" : "var(--text-muted)",
                            border: `1px solid ${diagOpen ? "var(--border-blue)" : "var(--border-strong)"}`,
                          }}
                        >
                          🔧 Diagnosticar
                        </button>
                        <Link
                          href={`/tune?car=${tune.car.id}&type=${tune.tune_type}`}
                          className="r-btn r-btn-outline"
                          style={{ fontSize: 11 }}
                        >
                          Regerar
                        </Link>
                        <button
                          type="button"
                          className="r-btn r-btn-ghost"
                          style={{ fontSize: 11 }}
                          onClick={() => void removeTune(item.id)}
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  </article>

                  {/* ── Diagnostic panel (expands below the card) ── */}
                  {diagOpen && (
                    <DiagnosticPanel
                      tune={tune}
                      onClose={() => setDiagOpenId(null)}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      </div>
    </RequireAuth>
  )
}
