"use client"

import { useState } from "react"
import Link from "next/link"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { CARS } from "@/data/cars"
import { diagnose as runDiagnostic, PROBLEM_LABELS } from "@/lib/tune-engine/diagnostics"
import type { Car, DiagnosticProblem, DiagnosticResult, TuneType } from "@/types"

const PROBLEMS = Object.entries(PROBLEM_LABELS) as [DiagnosticProblem, string][]

const TUNE_TYPES: { v: TuneType | ""; l: string }[] = [
  { v: "", l: "Sem tipo" },
  { v: "street", l: "Rua" },
  { v: "drag", l: "Drag" },
  { v: "drift", l: "Drift" },
  { v: "rally", l: "Rally" },
  { v: "cross_country", l: "Cross Country" },
  { v: "top_speed", l: "Top Speed" },
  { v: "grip", l: "Grip" },
]

const ICONS: Record<DiagnosticProblem, string> = {
  understeer:        "↙",
  oversteer:         "↗",
  wheelspin:         "◎",
  slow_cornering:    "↻",
  slow_straight:     "▶",
  bouncing:          "↕",
  drift_loss:        "≈",
  brake_instability: "⊗",
}

const COLORS: Record<DiagnosticProblem, string> = {
  understeer:        "#60a5fa",
  oversteer:         "#fb923c",
  wheelspin:         "#fbbf24",
  slow_cornering:    "#a78bfa",
  slow_straight:     "#34d399",
  bouncing:          "#f472b6",
  drift_loss:        "#fb923c",
  brake_instability: "#f87171",
}

export default function DiagnosticsPage() {
  const [selected, setSelected] = useState<DiagnosticProblem | null>(null)
  const [result,   setResult]   = useState<DiagnosticResult | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [carSearch, setCarSearch] = useState("")
  const [car, setCar] = useState<Car | null>(null)
  const [tuneType, setTuneType] = useState<TuneType | "">("")

  const carMatches = carSearch.length >= 2
    ? CARS.filter((item) => `${item.brand} ${item.model} ${item.year}`.toLowerCase().includes(carSearch.toLowerCase())).slice(0, 6)
    : []

  async function diagnose() {
    if (!selected) return
    setLoading(true)
    try {
      setResult(runDiagnostic(selected, {
        car: car ?? undefined,
        tuneType: tuneType || undefined,
      }))
    } finally { setLoading(false) }
  }

  return (
    <RequireAuth>
      <div className="dot-grid" style={{ minHeight: "100dvh" }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* ── Header ── */}
        <div className="anim-up">
          <p className="section-label">Diagnóstico</p>
          <h1 className="page-title">Corrigir Tune</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>
            Selecione o sintoma que está sentindo e receba correções técnicas precisas.
          </p>
        </div>

        {!result ? (
          <>
            <div className="r-card p-4 space-y-4 anim-up" style={{ animationDelay: "40ms" }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                    Contexto opcional
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                    O diagnóstico fica mais preciso quando sabe o carro e o tipo de tune.
                  </p>
                </div>
                {car && (
                  <button type="button" className="r-btn r-btn-ghost" style={{ fontSize: 11, padding: "5px 9px" }} onClick={() => setCar(null)}>
                    Trocar carro
                  </button>
                )}
              </div>

              {!car ? (
                <div className="space-y-2">
                  <input
                    className="r-input"
                    value={carSearch}
                    onChange={(event) => setCarSearch(event.target.value)}
                    placeholder="Buscar carro para contextualizar..."
                  />
                  {carMatches.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {carMatches.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="prob-card"
                          onClick={() => { setCar(item); setCarSearch("") }}
                        >
                          <span style={{ fontSize: 12, color: "var(--text)" }}>{item.brand} {item.model}</span>
                          <span className={`badge-class badge-${item.base_class}`}>{item.base_class}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{car.brand} {car.model}</p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{car.year} · {car.drivetrain} · {car.weight_kg} kg · {car.power_hp} hp</p>
                  </div>
                  <span className={`badge-class badge-${car.base_class}`}>{car.base_class}</span>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                {TUNE_TYPES.map((type) => (
                  <button
                    key={type.v || "none"}
                    type="button"
                    className={`filter-chip${tuneType === type.v ? " active" : ""}`}
                    onClick={() => setTuneType(type.v)}
                  >
                    {type.l}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Problem grid ── */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-2 anim-up"
              style={{ animationDelay: "60ms" }}
            >
              {PROBLEMS.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelected(key)}
                  className={`prob-card${selected === key ? " active" : ""}`}
                >
                  <span
                    className="flex items-center justify-center rounded shrink-0"
                    style={{
                      width: 34, height: 34,
                      fontSize: 17,
                      fontFamily: "monospace",
                      background: selected === key
                        ? `rgba(${COLORS[key].replace(/#|([0-9a-f]{2})/gi, (_m, p) => p ? parseInt(p, 16) + "," : "")},0.15)`
                        : "var(--bg-elevated)",
                      color: selected === key ? COLORS[key] : "var(--text-muted)",
                      border: `1px solid ${selected === key ? COLORS[key] + "44" : "var(--border-strong)"}`,
                    }}
                  >
                    {ICONS[key]}
                  </span>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: selected === key ? "var(--text)" : "var(--text-muted)",
                    lineHeight: 1.4,
                    flex: 1,
                  }}>
                    {label}
                  </span>
                  {selected === key && (
                    <span
                      className="shrink-0 flex items-center justify-center rounded-full"
                      style={{ width: 18, height: 18, background: "var(--blue)" }}
                    >
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                        <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Submit ── */}
            <button
              type="button"
              onClick={diagnose}
              disabled={!selected || loading}
              className="r-btn r-btn-primary w-full anim-up"
              style={{
                paddingTop: 12, paddingBottom: 12,
                opacity: selected && !loading ? 1 : 0.45,
                animationDelay: "120ms",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="w-4 h-4 border-2 rounded-full animate-spin"
                    style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }}
                  />
                  Analisando...
                </span>
              ) : "Diagnosticar"}
            </button>
          </>
        ) : (
          /* ── Result ── */
          <div className="space-y-5 anim-up">

            {/* Diagnosis card */}
            <div
              className="r-card flex gap-4 p-5"
              style={{ border: "1px solid rgba(251,191,36,0.2)" }}
            >
              <span
                className="flex items-center justify-center rounded shrink-0 mt-0.5"
                style={{
                  width: 36, height: 36, fontSize: 18, fontFamily: "monospace",
                  background: "rgba(251,191,36,0.1)",
                  color: "#fbbf24",
                  border: "1px solid rgba(251,191,36,0.25)",
                }}
              >
                {ICONS[result.problem]}
              </span>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#fbbf24", marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Diagnóstico
                </p>
                <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.65 }}>{result.diagnosis}</p>
                {result.context_notes && result.context_notes.length > 0 && (
                  <div className="space-y-1" style={{ marginTop: 10 }}>
                    {result.context_notes.map((note) => (
                      <p key={note} style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>{note}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Fixes */}
            <div className="space-y-2">
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                Correções recomendadas
              </p>
              {result.fixes.map((fix, i) => (
                <div
                  key={i}
                  className="r-card bracket flex gap-4 p-4 anim-up"
                  style={{ animationDelay: `${i * 55}ms` }}
                >
                  {/* Number */}
                  <div
                    className="flex items-center justify-center rounded-full shrink-0 mt-0.5"
                    style={{
                      width: 26, height: 26, fontSize: 11, fontWeight: 800,
                      background: "var(--blue-dim)",
                      color: "var(--blue-bright)",
                      border: "1px solid var(--border-blue)",
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                        {fix.parameter}
                      </span>
                      <span
                        className="mono-val"
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: "var(--blue-dim)",
                          border: "1px solid var(--border-blue)",
                          color: "var(--blue-bright)",
                        }}
                      >
                        {fix.adjustment}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.55 }}>
                      {fix.reason}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setSelected(null); setResult(null) }}
                className="r-btn r-btn-ghost flex-1"
                style={{ paddingTop: 10, paddingBottom: 10 }}
              >
                Novo diagnóstico
              </button>
              <Link
                href="/tune"
                className="r-btn r-btn-primary flex-1"
                style={{ paddingTop: 10, paddingBottom: 10 }}
              >
                Gerar nova tune
              </Link>
            </div>
          </div>
        )}
      </div>
      </div>
    </RequireAuth>
  )
}
