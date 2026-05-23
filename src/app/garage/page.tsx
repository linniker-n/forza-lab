"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { shareTune } from "@/lib/firebase/community"
import { loadUserProfile } from "@/lib/firebase/profile"
import { useSubscription } from "@/lib/subscription/context"
import { UpgradeModal } from "@/components/paywall/UpgradeModal"
import { FREE_LIMITS } from "@/lib/subscription/limits"
import { getCarImageUrl } from "@/data/cars"
import { getFirebaseDb } from "@/lib/firebase/client"
import { diagnose as runDiagnostic, PROBLEM_LABELS } from "@/lib/tune-engine/diagnostics"
import { getFH6IntentLabel } from "@/lib/tune-engine/fh6-intents"
import { useSettings } from "@/lib/settings/context"
import type { AppSettings } from "@/lib/settings/context"
import { formatPressure, formatSpring } from "@/lib/settings/units"
import type { DiagnosticProblem, DiagnosticResult, GeneratedTune } from "@/types"
import { collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc } from "firebase/firestore"

interface SavedTune {
  id: string
  saved_at: string
  tune: GeneratedTune
}

function storageKey(userId?: string) {
  return `forza-lab:saved-tunes:${userId ?? "local"}`
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
// Helpers de diagnóstico contextualizado — unit-aware
// ─────────────────────────────────────────────────────────────────────────────

type BaseUnit = "psi" | "lbfin" | "percent" | "degrees" | "ratio" | "text"

interface ParamValue {
  display: string        // valor formatado nas unidades do usuário
  raw: number | null     // valor bruto na unidade base (para calcular delta)
  unit: BaseUnit
}

function getParamValue(
  param: string,
  tune: GeneratedTune,
  s: AppSettings,
): ParamValue | null {
  const t = tune.tuning

  const mk = (raw: number, unit: BaseUnit, display: string): ParamValue =>
    ({ raw, unit, display })

  switch (param) {
    // Pressão dos pneus
    case "Pressão dos pneus dianteiros":
      return mk(t.tires.front,  "psi", formatPressure(t.tires.front,  s.pressureUnit))
    case "Pressão dos pneus traseiros":
      return mk(t.tires.rear,   "psi", formatPressure(t.tires.rear,   s.pressureUnit))
    case "Pressão dos pneus":
      return { raw: null, unit: "psi", display: `${formatPressure(t.tires.front, s.pressureUnit)} / ${formatPressure(t.tires.rear, s.pressureUnit)}` }

    // Molas
    case "Molas traseiras":
      return mk(t.springs.rear,  "lbfin", formatSpring(t.springs.rear,  s.springUnit))
    case "Molas dianteiras":
      return mk(t.springs.front, "lbfin", formatSpring(t.springs.front, s.springUnit))

    // Amortecedores
    case "Rebound (rebote)":
      return { raw: null, unit: "ratio", display: `${t.damping.rebound_front} / ${t.damping.rebound_rear}` }
    case "Rebound dianteiro":
      return mk(t.damping.rebound_front, "ratio", String(t.damping.rebound_front))
    case "Bump (compressão)":
      return { raw: null, unit: "ratio", display: `${t.damping.bump_front} / ${t.damping.bump_rear}` }

    // Barras estabilizadoras
    case "Barra estabilizadora dianteira":
    case "Barra dianteira":
      return mk(t.antiroll_bars.front, "ratio", String(t.antiroll_bars.front))
    case "Barra estabilizadora traseira":
      return mk(t.antiroll_bars.rear, "ratio", String(t.antiroll_bars.rear))

    // Diferencial
    case "Diferencial traseiro (aceleração)":
      return t.differential.rear_accel  !== undefined ? mk(t.differential.rear_accel,    "percent", `${t.differential.rear_accel}%`) : null
    case "Diferencial traseiro (desaceleração)":
      return t.differential.rear_decel  !== undefined ? mk(t.differential.rear_decel,    "percent", `${t.differential.rear_decel}%`) : null
    case "Diferencial dianteiro (aceleração)":
    case "Diferencial dianteiro":
      return t.differential.front_accel !== undefined ? mk(t.differential.front_accel,   "percent", `${t.differential.front_accel}%`) : null
    case "Diferencial central (AWD)":
      return t.differential.center_balance !== undefined ? mk(t.differential.center_balance, "percent", `${t.differential.center_balance}%`) : null

    // Freios
    case "Balanceamento de freios":
      return mk(t.brakes.balance,  "percent", `${t.brakes.balance}%`)
    case "Pressão de freio":
      return mk(t.brakes.pressure, "percent", `${t.brakes.pressure}%`)

    // Alinhamento
    case "Cambagem dianteira":
      return mk(t.alignment.camber_front, "degrees", `${t.alignment.camber_front}°`)
    case "Toe dianteiro":
      return mk(t.alignment.toe_front, "degrees", `${t.alignment.toe_front}°`)

    // Aero (texto descritivo, sem valor numérico)
    case "Aero dianteiro": return { raw: null, unit: "text", display: t.aero.front }
    case "Aero traseiro":  return { raw: null, unit: "text", display: t.aero.rear  }

    default: return null
  }
}

function parseNumericDelta(adj: string): number | null {
  const clean = adj.replace("−", "-").replace("–", "-")
  const m = clean.match(/([+-]?\s*\d+(?:[.,]\d+)?)/)
  if (!m) return null
  const val = parseFloat(m[1].replace(",", ".").replace(" ", ""))
  return isNaN(val) ? null : val
}

function computeTarget(pv: ParamValue, adj: string, s: AppSettings): string | null {
  if (pv.raw === null) return null
  const delta = parseNumericDelta(adj)
  if (delta === null) return null
  const targetRaw = Math.round((pv.raw + delta) * 10) / 10

  switch (pv.unit) {
    case "psi":     return formatPressure(targetRaw, s.pressureUnit)
    case "lbfin":   return formatSpring(targetRaw, s.springUnit)
    case "percent": return `${Math.max(0, Math.min(100, targetRaw))}%`
    case "degrees": return `${targetRaw}°`
    default:        return String(targetRaw)
  }
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
  const { settings } = useSettings()

  function selectProblem(p: DiagnosticProblem) {
    setProblem(p)
    setResult(runDiagnostic(p, { car: tune.car, tuneType: tune.tune_type, intent: tune.fh6_intent ?? "balanced" }))
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
              const pv     = getParamValue(fix.parameter, tune, settings)
              const adj    = fix.adjustment
              const target = pv ? computeTarget(pv, adj, settings) : null
              const current = pv?.display ?? null

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
// Edit Tune Panel
// ─────────────────────────────────────────────────────────────────────────────
const RIDE_OPTS = ["low","medium-low","medium","medium-high","high","max"] as const
const AERO_OPTS = ["min","low","medium","medium-high","high","max"] as const

type TuningSetupMut = import("@/types").TuningSetup

function Field({ label, value, onChange, step = 0.1, min, max }: {
  label: string; value: number; onChange(v: number): void
  step?: number; min?: number; max?: number
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
      <input
        type="number"
        className="r-input"
        style={{ padding: "4px 8px", fontSize: 12, height: 32 }}
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}

function SelectField({ label, value, opts, onChange }: {
  label: string; value: string; opts: readonly string[]
  onChange(v: string): void
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
      <select className="r-input" style={{ padding: "4px 8px", fontSize: 12, height: 32 }}
        value={value} onChange={(e) => onChange(e.target.value)}>
        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fh6-teal)", marginTop: 12, marginBottom: 6 }}>{children}</p>
}

function EditTunePanel({ tune, onSave, onClose, onShare }: {
  tune: import("@/types").GeneratedTune
  onSave(t: TuningSetupMut): void
  onClose(): void
  onShare(t: TuningSetupMut): void
}) {
  const [t, setT] = useState<TuningSetupMut>(JSON.parse(JSON.stringify(tune.tuning)))

  function up<K extends keyof TuningSetupMut>(section: K, patch: Partial<TuningSetupMut[K]>) {
    setT((prev) => ({ ...prev, [section]: { ...prev[section] as object, ...patch } }))
  }

  return (
    <div className="r-card p-5 space-y-1 anim-up" style={{ border: "1px solid var(--border-blue)", background: "var(--bg-elevated)" }}>
      <div className="flex items-center justify-between mb-3">
        <p style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>Editar tunagem</p>
        <button type="button" onClick={onClose} style={{ fontSize: 11, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>✕ Fechar</button>
      </div>

      <SectionTitle>Pneus (PSI)</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Dianteiro" value={t.tires.front} onChange={(v) => up("tires", { front: v })} min={14} max={50} />
        <Field label="Traseiro"  value={t.tires.rear}  onChange={(v) => up("tires", { rear: v })}  min={14} max={50} />
      </div>

      <SectionTitle>Alinhamento</SectionTitle>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Camb. D"  value={t.alignment.camber_front} onChange={(v) => up("alignment", { camber_front: v })} min={-5} max={0} />
        <Field label="Camb. T"  value={t.alignment.camber_rear}  onChange={(v) => up("alignment", { camber_rear: v })}  min={-5} max={0} />
        <Field label="Caster"   value={t.alignment.caster}        onChange={(v) => up("alignment", { caster: v })}        min={0}  max={7} />
        <Field label="Conv. D"  value={t.alignment.toe_front}    onChange={(v) => up("alignment", { toe_front: v })}    min={-3} max={3} step={0.1} />
        <Field label="Conv. T"  value={t.alignment.toe_rear}     onChange={(v) => up("alignment", { toe_rear: v })}     min={-3} max={3} step={0.1} />
      </div>

      <SectionTitle>Barras Estabilizadoras</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Dianteira" value={t.antiroll_bars.front} onChange={(v) => up("antiroll_bars", { front: v })} min={1} max={65} step={0.1} />
        <Field label="Traseira"  value={t.antiroll_bars.rear}  onChange={(v) => up("antiroll_bars", { rear: v })}  min={1} max={65} step={0.1} />
      </div>

      <SectionTitle>Molas (lbf/in)</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Dianteira" value={t.springs.front} onChange={(v) => up("springs", { front: v })} min={80} max={1925} step={25} />
        <Field label="Traseira"  value={t.springs.rear}  onChange={(v) => up("springs", { rear: v })}  min={80} max={1925} step={25} />
        <SelectField label="Alt. D" value={t.springs.ride_height_front} opts={RIDE_OPTS} onChange={(v) => up("springs", { ride_height_front: v as typeof RIDE_OPTS[number] })} />
        <SelectField label="Alt. T" value={t.springs.ride_height_rear}  opts={RIDE_OPTS} onChange={(v) => up("springs", { ride_height_rear: v as typeof RIDE_OPTS[number] })} />
      </div>

      <SectionTitle>Amortecedores</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Ret. D"  value={t.damping.rebound_front} onChange={(v) => up("damping", { rebound_front: v })} min={1} max={20} step={0.1} />
        <Field label="Ret. T"  value={t.damping.rebound_rear}  onChange={(v) => up("damping", { rebound_rear: v })}  min={1} max={20} step={0.1} />
        <Field label="Comp. D" value={t.damping.bump_front}    onChange={(v) => up("damping", { bump_front: v })}    min={1} max={20} step={0.1} />
        <Field label="Comp. T" value={t.damping.bump_rear}     onChange={(v) => up("damping", { bump_rear: v })}     min={1} max={20} step={0.1} />
      </div>

      <SectionTitle>Aerodinâmica</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        <SelectField label="Downforce D" value={t.aero.front} opts={AERO_OPTS} onChange={(v) => up("aero", { front: v as typeof AERO_OPTS[number] })} />
        <SelectField label="Downforce T" value={t.aero.rear}  opts={AERO_OPTS} onChange={(v) => up("aero", { rear: v as typeof AERO_OPTS[number] })} />
      </div>

      <SectionTitle>Freios</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Equilíbrio %" value={t.brakes.balance}  onChange={(v) => up("brakes", { balance: v })}  min={0}  max={100} step={1} />
        <Field label="Pressão %"    value={t.brakes.pressure} onChange={(v) => up("brakes", { pressure: v })} min={0} max={150} step={1} />
      </div>

      <SectionTitle>Diferencial</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        {t.differential.front_accel !== undefined && (
          <Field label="Front Ac. %" value={t.differential.front_accel} onChange={(v) => up("differential", { front_accel: v })} min={0} max={100} step={1} />
        )}
        {t.differential.front_decel !== undefined && (
          <Field label="Front De. %" value={t.differential.front_decel} onChange={(v) => up("differential", { front_decel: v })} min={0} max={100} step={1} />
        )}
        <Field label="Rear Ac. %"  value={t.differential.rear_accel}  onChange={(v) => up("differential", { rear_accel: v })}  min={0} max={100} step={1} />
        <Field label="Rear De. %"  value={t.differential.rear_decel}  onChange={(v) => up("differential", { rear_decel: v })}  min={0} max={100} step={1} />
        {t.differential.center_balance !== undefined && (
          <Field label="Centro %" value={t.differential.center_balance} onChange={(v) => up("differential", { center_balance: v })} min={0} max={100} step={1} />
        )}
      </div>

      <SectionTitle>Câmbio</SectionTitle>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Final Drive" value={t.gearing.final_drive} onChange={(v) => up("gearing", { final_drive: v })} min={2.2} max={5.5} step={0.01} />
        {([1,2,3,4,5,6,7,8,9,10] as const).map((g) => {
          const k = `gear_${g}` as keyof typeof t.gearing
          const v = t.gearing[k] as number | undefined
          return v !== undefined ? (
            <Field key={g} label={`${g}ª`} value={v}
              onChange={(nv) => up("gearing", { [k]: nv })} min={0.5} max={5} step={0.01} />
          ) : null
        })}
      </div>

      <div className="flex gap-2 pt-4">
        <button type="button" onClick={() => onSave(t)} className="r-btn r-btn-primary flex-1" style={{ fontSize: 12, paddingTop: 10, paddingBottom: 10 }}>
          Salvar alterações
        </button>
        <button type="button" onClick={() => onShare(t)} className="r-btn r-btn-outline" style={{ fontSize: 12, paddingTop: 10, paddingBottom: 10 }}>
          Compartilhar
        </button>
        <button type="button" onClick={onClose} className="r-btn r-btn-ghost" style={{ fontSize: 12 }}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export default function GaragePage() {
  const [saved,        setSaved]       = useState<SavedTune[]>([])
  const [syncNote,     setSyncNote]    = useState<string | null>(null)
  const [diagOpenId,   setDiagOpenId]  = useState<string | null>(null)
  const [editOpenId,   setEditOpenId]  = useState<string | null>(null)
  const [sharingId,    setSharingId]   = useState<string | null>(null)
  const [sharedId,     setSharedId]    = useState<string | null>(null)
  const [showUpgrade,  setShowUpgrade] = useState(false)
  const { user } = useAuth()
  const { isPro } = useSubscription()
  const garageLimit = isPro ? Infinity : FREE_LIMITS.garageSlots
  const isGarageFull = !isPro && saved.length >= FREE_LIMITS.garageSlots
  const userId = user?.uid

  useEffect(() => {
    let active = true
    const db = getFirebaseDb()
    const localTunes = readSavedTunes(userId)

    // Exibe tunes locais IMEDIATAMENTE — sem esperar Firestore
    const localHandle = window.setTimeout(() => {
      if (active) setSaved(localTunes)
    }, 0)

    if (!db || !userId) {
      return () => {
        active = false
        window.clearTimeout(localHandle)
      }
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

    return () => {
      active = false
      window.clearTimeout(localHandle)
    }
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

  async function saveEditedTune(id: string, newTuning: import("@/types").TuningSetup) {
    const db = getFirebaseDb()
    const updated = saved.map((s) => s.id !== id ? s : { ...s, tune: { ...s.tune, tuning: newTuning } })
    setSaved(updated)
    window.localStorage.setItem(storageKey(user?.uid), JSON.stringify(updated))
    if (db && user) {
      try {
        await updateDoc(doc(db, "users", user.uid, "savedTunes", id), { "tune.tuning": newTuning })
      } catch { /* best-effort */ }
    }
    setEditOpenId(null)
    setSyncNote("Tunagem atualizada com suas alterações.")
    setTimeout(() => setSyncNote(null), 3000)
  }

  async function shareEditedTune(id: string, newTuning: import("@/types").TuningSetup) {
    if (!user) return
    const item = saved.find((s) => s.id === id)
    if (!item) return
    setSharingId(id)
    try {
      const authorName = user.displayName || user.email?.split("@")[0] || "Anônimo"
      let photoBase64: string | undefined
      try { const p = await loadUserProfile(user.uid); photoBase64 = p?.photoBase64 } catch {}
      const tuneToshare = { ...item.tune, tuning: newTuning }
      await shareTune(tuneToshare, user.uid, authorName, photoBase64)
      setSharedId(id)
      setEditOpenId(null)
    } catch { setSyncNote("Erro ao compartilhar.") }
    finally { setSharingId(null) }
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
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} reason="garage_limit" />
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

        {/* Slot usage bar — free users */}
        {!isPro && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg anim-up"
            style={{ background: "var(--bg-card)", border: `1px solid ${isGarageFull ? "rgba(239,68,68,0.3)" : "var(--border-strong)"}` }}>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)" }}>
                  Slots da garagem: <span style={{ color: isGarageFull ? "#f87171" : "var(--text)", fontWeight: 700 }}>{Math.min(saved.length, FREE_LIMITS.garageSlots)}/{FREE_LIMITS.garageSlots}</span>
                </p>
                <button type="button" onClick={() => setShowUpgrade(true)} style={{ fontSize: 10, fontWeight: 700, color: "var(--fh6-teal)", background: "none", border: "none", cursor: "pointer" }}>
                  Pro ilimitado →
                </button>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: "var(--border-strong)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 2, transition: "width 0.3s",
                  width: `${Math.min((saved.length / FREE_LIMITS.garageSlots) * 100, 100)}%`,
                  background: isGarageFull ? "#ef4444" : "var(--fh6-teal)",
                }} />
              </div>
            </div>
          </div>
        )}

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
                          <span className="badge-class" style={{ color: "#34d399", background: "rgba(52,211,153,0.08)", borderColor: "rgba(52,211,153,0.22)" }}>
                            FH6 {getFH6IntentLabel(tune.fh6_intent ?? "balanced")}
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
                          onClick={() => { setDiagOpenId(diagOpen ? null : item.id); setEditOpenId(null) }}
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
                        <button
                          type="button"
                          onClick={() => { setEditOpenId(editOpenId === item.id ? null : item.id); setDiagOpenId(null) }}
                          className="r-btn"
                          style={{
                            fontSize: 11, padding: "6px 12px",
                            background: editOpenId === item.id ? "rgba(44,206,204,0.12)" : "transparent",
                            color: editOpenId === item.id ? "var(--fh6-teal)" : "var(--text-muted)",
                            border: `1px solid ${editOpenId === item.id ? "rgba(44,206,204,0.4)" : "var(--border-strong)"}`,
                          }}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => void shareEditedTune(item.id, tune.tuning)}
                          disabled={sharingId === item.id}
                          className="r-btn r-btn-ghost"
                          style={{ fontSize: 11, color: sharedId === item.id ? "#34d399" : undefined, opacity: sharingId === item.id ? 0.6 : 1 }}
                        >
                          {sharedId === item.id ? "✓ Compartilhado" : sharingId === item.id ? "..." : "Compartilhar"}
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

                  {/* ── Diagnostic panel ── */}
                  {diagOpen && (
                    <DiagnosticPanel
                      tune={tune}
                      onClose={() => setDiagOpenId(null)}
                    />
                  )}

                  {/* ── Edit tune panel ── */}
                  {editOpenId === item.id && (
                    <EditTunePanel
                      tune={tune}
                      onClose={() => setEditOpenId(null)}
                      onSave={(newTuning) => void saveEditedTune(item.id, newTuning)}
                      onShare={(newTuning) => void shareEditedTune(item.id, newTuning)}
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
