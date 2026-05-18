"use client"

import { Suspense, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth/AuthProvider"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { CARS, getCarImageUrl } from "@/data/cars"
import type { Car, CarClass, ControlType, DrivingStyle, GeneratedTune, TuneType } from "@/types"

type Difficulty = "easy" | "balanced" | "aggressive"

const TUNE_TYPES: { v: TuneType; l: string; desc: string; cls: string }[] = [
  { v: "street",        l: "Rua / Estrada",  desc: "Asfalto, sprints, urbano",   cls: "tag-street" },
  { v: "drag",          l: "Arrancada",       desc: "Drag, 0-100, meia milha",    cls: "tag-drag" },
  { v: "drift",         l: "Drift",           desc: "Zonas, tandem, pontuação",   cls: "tag-drift" },
  { v: "rally",         l: "Rally",           desc: "Terra, estradas mistas",     cls: "tag-rally" },
  { v: "cross_country", l: "Cross Country",   desc: "Lama, saltos, terreno pesado", cls: "tag-cross_country" },
  { v: "top_speed",     l: "Top Speed",       desc: "Speed traps, autoestradas",  cls: "tag-top_speed" },
  { v: "grip",          l: "Grip / Circuito", desc: "Tempo de volta, técnico",    cls: "tag-grip" },
]
const CLASSES: CarClass[] = ["D","C","B","A","S1","S2","R","X"]
const DIFFICULTY: { v: Difficulty; l: string; desc: string }[] = [
  { v: "easy",       l: "Fácil",       desc: "Estável, perdoa erros" },
  { v: "balanced",   l: "Equilibrado", desc: "Para a maioria" },
  { v: "aggressive", l: "Agressivo",   desc: "Máxima performance" },
]
const STYLES: { v: DrivingStyle; l: string }[] = [
  { v: "casual",      l: "Casual" },
  { v: "competitive", l: "Competitivo" },
  { v: "meta",        l: "Meta" },
]
const CONTROLS: { v: ControlType; l: string }[] = [
  { v: "controller", l: "Controle" },
  { v: "keyboard",   l: "Teclado" },
  { v: "wheel",      l: "Volante" },
]
const DRIVETRAINS = [
  { v: "original", l: "Manter original" },
  { v: "AWD",      l: "AWD" },
  { v: "RWD",      l: "RWD" },
  { v: "FWD",      l: "FWD" },
]
const TUNE_LABELS: Record<TuneType, string> = {
  street: "Rua", drag: "Drag", drift: "Drift",
  rally: "Rally", cross_country: "Cross Country", top_speed: "Top Speed", grip: "Grip",
}

/* ── Score color ── */
function scoreColor(s: number) {
  if (s >= 8) return "#34d399"
  if (s >= 6) return "#fbbf24"
  return "#64748b"
}

/* ── Small car thumbnail in picker ── */
function CarThumb({ car, selected, onSelect }: { car: Car; selected: boolean; onSelect(): void }) {
  const [err, setErr] = useState(false)
  const url = getCarImageUrl(car)
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex items-center gap-3 rounded-lg transition-all text-left"
      style={{
        padding: "10px 12px",
        background: selected ? "var(--blue-dim)" : "var(--bg-card)",
        border: `1px solid ${selected ? "var(--border-blue)" : "var(--border-strong)"}`,
        cursor: "pointer",
      }}
    >
      <div
        className="relative rounded overflow-hidden shrink-0"
        style={{ width: 64, height: 40, background: "var(--bg-elevated)" }}
      >
        {url && !err ? (
          <Image src={url} alt={`${car.brand} ${car.model}`} fill sizes="64px"
            className="car-render" style={{ objectFit: "contain", padding: 4 }}
            onError={() => setErr(true)} />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center mono-val"
            style={{ fontSize: 9, opacity: 0.3 }}>{car.brand.slice(0,3).toUpperCase()}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", lineHeight: 1.2 }}>
          {car.brand} {car.model}
        </p>
        <p style={{ fontSize: 10, color: "var(--text-muted)" }}>
          {car.year} · {car.drivetrain} · <span className={`badge-class badge-${car.base_class}`}>{car.base_class}</span>
        </p>
      </div>
      {selected && (
        <div className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
          style={{ background: "var(--blue)" }}>
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
    </button>
  )
}

/* ── Telem row ── */
function TR({ l, v, mono = true }: { l: string; v: string; mono?: boolean }) {
  return (
    <div className="telem-row">
      <span className="telem-label">{l}</span>
      <span className={mono ? "telem-value" : ""} style={mono ? undefined : { fontSize: 11, color: "var(--text)", textTransform: "capitalize" }}>{v}</span>
    </div>
  )
}

/* ── Tune result ── */
function TuneResult({ tune, onReset }: { tune: GeneratedTune; onReset(): void }) {
  const url = getCarImageUrl(tune.car)
  const [err, setErr] = useState(false)
  const [saved, setSaved] = useState(false)
  const { user } = useAuth()

  function saveTune() {
    const storageKey = `forza-tune-lab:saved-tunes:${user?.id ?? "local"}`
    let savedTunes: unknown = []
    try {
      const raw = window.localStorage.getItem(storageKey)
      savedTunes = raw ? JSON.parse(raw) : []
    } catch {
      savedTunes = []
    }
    const entry = {
      id: `${tune.car.id}_${tune.tune_type}_${Date.now()}`,
      saved_at: new Date().toISOString(),
      tune,
    }
    window.localStorage.setItem(storageKey, JSON.stringify([entry, ...(Array.isArray(savedTunes) ? savedTunes : [])].slice(0, 60)))
    setSaved(true)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6 anim-up">

      {/* Hero card */}
      <div className="r-card bracket overflow-hidden">
        {/* Image strip */}
        <div className="relative overflow-hidden" style={{ height: 200, background: "linear-gradient(135deg, #080f20 0%, #0c1530 100%)" }}>
          {url && !err && (
            <Image src={url} alt={`${tune.car.brand} ${tune.car.model}`} fill sizes="896px"
              className="hero-car-render" style={{ objectFit: "contain", padding: 28 }}
              onError={() => setErr(true)} />
          )}
          <div className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
            style={{ background: "linear-gradient(to top, var(--bg-card), transparent)" }} />
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <p style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {tune.car.brand} · {tune.car.year}
              </p>
              <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.03em", color: "var(--text)" }}>
                {tune.car.model}
              </h1>
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className={`badge-class badge-${tune.drivetrain === "AWD" ? "awd" : tune.drivetrain === "RWD" ? "rwd" : "fwd"}`}>{tune.drivetrain}</span>
                <span className={`badge-class badge-${tune.target_class}`}>Classe {tune.target_class}</span>
                <span className="badge-class" style={{ color: "var(--blue-bright)", background: "var(--blue-dim)", borderColor: "var(--border-blue)" }}>
                  {TUNE_LABELS[tune.tune_type]}
                </span>
                <span className="badge-class" style={{ color: "var(--text-muted)", background: "transparent", borderColor: "var(--border-strong)" }}>
                  ~{tune.pi_estimate} PI
                </span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button type="button" onClick={saveTune} className="r-btn r-btn-outline" style={{ fontSize: 11 }}>
                {saved ? "Tune salva" : "Salvar tune"}
              </button>
              <Link href="/garage" className="r-btn r-btn-ghost" style={{ fontSize: 11 }}>
                Garagem
              </Link>
              <button type="button" onClick={onReset} className="r-btn r-btn-ghost" style={{ fontSize: 11 }}>
                Nova tune
              </button>
            </div>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 12, lineHeight: 1.6 }}>{tune.summary}</p>
        </div>
      </div>

      {/* Warnings */}
      {tune.warnings.length > 0 && (
        <div className="space-y-2">
          {tune.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg p-3"
              style={{
                background: w.type === "warning" ? "rgba(245,158,11,0.08)" : "var(--blue-dim)",
                border: `1px solid ${w.type === "warning" ? "rgba(245,158,11,0.2)" : "rgba(37,99,235,0.2)"}`,
              }}>
              <span
                className="mono-val"
                style={{
                  fontSize: 11,
                  flexShrink: 0,
                  color: w.type === "warning" ? "#fbbf24" : "var(--blue-bright)",
                  marginTop: 2,
                }}
              >
                {w.type === "warning" ? "!" : "i"}
              </span>
              <p style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.6 }}>{w.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Parts */}
        <div className="r-card p-5 space-y-4">
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>Peças</p>
          {Object.entries(tune.parts).map(([cat, items]) =>
            (items as string[]).length > 0 ? (
              <div key={cat}>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-subtle)", marginBottom: 6 }}>
                  {cat === "engine" ? "Motor" : cat === "platform" ? "Plataforma" : cat === "drivetrain" ? "Transmissão" : cat === "tires" ? "Pneus" : "Aero"}
                </p>
                <ul className="space-y-1">
                  {(items as string[]).map((item, j) => (
                    <li key={j} className="flex items-center gap-2" style={{ fontSize: 12, color: "var(--text)" }}>
                      <span className="w-1 h-1 rounded-full shrink-0" style={{ background: "var(--blue)" }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null
          )}
        </div>

        {/* Telemetry */}
        <div className="space-y-4">
          <div className="r-card p-5">
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Pneus & Alinhamento</p>
            <TR l="Pneu diant." v={`${tune.tuning.tires.front} PSI`} />
            <TR l="Pneu tras."  v={`${tune.tuning.tires.rear} PSI`} />
            <TR l="Cambagem D"  v={`${tune.tuning.alignment.camber_front}°`} />
            <TR l="Cambagem T"  v={`${tune.tuning.alignment.camber_rear}°`} />
            <TR l="Toe diant."  v={String(tune.tuning.alignment.toe_front)} />
            <TR l="Toe tras."   v={String(tune.tuning.alignment.toe_rear)} />
            <TR l="Caster"      v={String(tune.tuning.alignment.caster)} />
          </div>
          <div className="r-card p-5">
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Barras & Molas</p>
            <TR l="Barra D"  v={String(tune.tuning.antiroll_bars.front)} />
            <TR l="Barra T"  v={String(tune.tuning.antiroll_bars.rear)} />
            <TR l="Mola D"   v={`${tune.tuning.springs.front}`} />
            <TR l="Mola T"   v={`${tune.tuning.springs.rear}`} />
            <TR l="Altura D" v={tune.tuning.springs.ride_height_front} mono={false} />
            <TR l="Altura T" v={tune.tuning.springs.ride_height_rear} mono={false} />
          </div>
        </div>
      </div>

      {/* Damping + Brakes + Diff */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="r-card p-5">
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Amortecimento</p>
          <TR l="Rebound D" v={String(tune.tuning.damping.rebound_front)} />
          <TR l="Rebound T" v={String(tune.tuning.damping.rebound_rear)} />
          <TR l="Bump D"    v={String(tune.tuning.damping.bump_front)} />
          <TR l="Bump T"    v={String(tune.tuning.damping.bump_rear)} />
        </div>
        <div className="r-card p-5">
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Freios & Aero</p>
          <TR l="Balanço"  v={`${tune.tuning.brakes.balance}%`} />
          <TR l="Pressão"  v={`${tune.tuning.brakes.pressure}%`} />
          <TR l="Aero D"   v={tune.tuning.aero.front}  mono={false} />
          <TR l="Aero T"   v={tune.tuning.aero.rear}   mono={false} />
        </div>
        <div className="r-card p-5">
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Diferencial</p>
          {tune.tuning.differential.front_accel !== undefined && <TR l="Front Acel."   v={`${tune.tuning.differential.front_accel}%`} />}
          {tune.tuning.differential.front_decel !== undefined && <TR l="Front Desacel." v={`${tune.tuning.differential.front_decel}%`} />}
          <TR l="Rear Acel."   v={`${tune.tuning.differential.rear_accel}%`} />
          <TR l="Rear Desacel." v={`${tune.tuning.differential.rear_decel}%`} />
          {tune.tuning.differential.center_balance !== undefined && <TR l="Centro (% T)" v={`${tune.tuning.differential.center_balance}%`} />}
        </div>
      </div>

      {/* Gearing */}
      <div className="r-card p-5">
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 }}>Câmbio</p>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {[
            { l: "Final", v: tune.tuning.gearing.final_drive },
            ...([1,2,3,4,5,6,7] as const).map((g) => ({
              l: `${g}ª`,
              v: tune.tuning.gearing[`gear_${g}` as keyof typeof tune.tuning.gearing] as number | undefined,
            })).filter((x) => x.v !== undefined),
          ].map(({ l, v }) => (
            <div key={l} className="flex flex-col items-center gap-1 p-2 rounded"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
              <span style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 600 }}>{l}</span>
              <span className="mono-val" style={{ fontSize: 13 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths / Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="r-card p-5" style={{ border: "1px solid rgba(52,211,153,0.15)" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#34d399", marginBottom: 10 }}>Pontos Fortes</p>
          <ul className="space-y-2">
            {tune.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2" style={{ fontSize: 12, color: "var(--text)" }}>
                <span style={{ color: "#34d399", marginTop: 1, flexShrink: 0 }}>+</span>{s}
              </li>
            ))}
          </ul>
        </div>
        <div className="r-card p-5" style={{ border: "1px solid rgba(251,191,36,0.15)" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#fbbf24", marginBottom: 10 }}>Pontos Fracos</p>
          <ul className="space-y-2">
            {tune.weaknesses.map((w, i) => (
              <li key={i} className="flex items-start gap-2" style={{ fontSize: 12, color: "var(--text)" }}>
                <span style={{ color: "#fbbf24", marginTop: 1, flexShrink: 0 }}>−</span>{w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* How to drive */}
      <div className="r-card p-5 flex gap-4" style={{ border: "1px solid var(--border-blue)" }}>
        <div className="w-8 h-8 flex items-center justify-center rounded-lg shrink-0 mt-0.5"
          style={{ background: "var(--blue-dim)", border: "1px solid var(--border-blue)" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="5.5" stroke="var(--blue-bright)" strokeWidth="1.5"/>
            <path d="M8 5.5v3l2 2" stroke="var(--blue-bright)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--blue-bright)", marginBottom: 6 }}>Como Pilotar</p>
          <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.65 }}>{tune.how_to_drive}</p>
        </div>
      </div>

      <div className="text-center pt-4" style={{ borderTop: "1px solid var(--border)" }}>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>Algo não funcionou como esperado?</p>
        <Link href="/diagnostics" style={{ fontSize: 12, color: "var(--blue-bright)" }}>
          Diagnosticar problema na tune →
        </Link>
      </div>
    </div>
  )
}

/* ── Main Wizard ── */
function WizardInner() {
  const sp = useSearchParams()
  const queryCar = CARS.find((c) => c.id === sp.get("car")) ?? null
  const queryType = TUNE_TYPES.find((type) => type.v === sp.get("type"))?.v ?? null
  const [step, setStep]       = useState(() => queryCar ? (queryType ? 3 : 2) : 1)
  const [search, setSearch]   = useState("")
  const [car, setCar]         = useState<Car | null>(() => queryCar)
  const [tuneType, setTT]     = useState<TuneType | null>(() => queryType)
  const [cls, setCls]         = useState<CarClass>("A")
  const [diff, setDiff]       = useState<Difficulty>("balanced")
  const [style, setStyle]     = useState<DrivingStyle>("competitive")
  const [ctrl, setCtrl]       = useState<ControlType>("controller")
  const [dt, setDt]           = useState("original")
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState<GeneratedTune | null>(null)
  const [error, setError]     = useState<string | null>(null)

  const filtered = search.length >= 2
    ? CARS.filter((c) => `${c.brand} ${c.model} ${c.year}`.toLowerCase().includes(search.toLowerCase())).slice(0, 14)
    : CARS.slice(0, 14)

  async function generate() {
    if (!car || !tuneType) return
    setLoading(true); setError(null)
    try {
      const res = await fetch("/api/tune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ car_id: car.id, target_class: cls, tune_type: tuneType, style, control: ctrl, preferred_drivetrain: dt, difficulty: diff }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data.tune); setStep(4)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao gerar tune")
    } finally { setLoading(false) }
  }

  if (step === 4 && result) return <TuneResult tune={result} onReset={() => { setStep(1); setCar(null); setTT(null); setResult(null); setSearch("") }} />

  const steps = [
    { n: 1, l: "Carro" },
    { n: 2, l: "Tipo" },
    { n: 3, l: "Config." },
  ]

  return (
    <div className="dot-grid" style={{ minHeight: "100dvh" }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Title */}
        <div className="anim-up">
          <p className="section-label">Gerador</p>
          <h1 className="page-title">Criar Tune</h1>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-1 anim-up" style={{ animationDelay: "60ms" }}>
          {steps.map(({ n, l }, i) => (
            <div key={n} className="flex items-center gap-1">
              <div className="flex items-center gap-2">
                <div className={`step-dot ${step > n ? "done" : step === n ? "active" : "inactive"}`}>
                  {step > n ? (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : n}
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: step === n ? "var(--text)" : "var(--text-muted)",
                  display: "none",
                }} className="sm:block">{l}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`step-line ${step > n ? "done" : "inactive"}`} />
              )}
            </div>
          ))}
        </div>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div className="space-y-4 anim-up" style={{ animationDelay: "100ms" }}>
            <input type="text" className="r-input" placeholder="Buscar por marca, modelo ou ano..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto" style={{ maxHeight: 460 }}>
              {filtered.map((c) => (
                <CarThumb key={c.id} car={c} selected={car?.id === c.id} onSelect={() => setCar(c)} />
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button type="button" disabled={!car} onClick={() => setStep(2)} className="r-btn r-btn-primary"
                style={{ paddingLeft: 28, paddingRight: 28, paddingTop: 10, paddingBottom: 10, opacity: car ? 1 : 0.4 }}>
                Próximo — Tipo de Tune
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div className="space-y-4 anim-up" style={{ animationDelay: "100ms" }}>
            {car && (
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)" }}>
                <div className="relative w-20 h-12 rounded overflow-hidden shrink-0" style={{ background: "var(--bg-elevated)" }}>
                  {getCarImageUrl(car) && (
                    <Image src={getCarImageUrl(car)} alt="" fill sizes="80px"
                      className="car-render" style={{ objectFit: "contain" }} />
                  )}
                </div>
                <div className="flex-1">
                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{car.brand} · {car.year}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{car.model}</p>
                </div>
                <button type="button" onClick={() => setStep(1)} className="r-btn r-btn-ghost" style={{ fontSize: 11, padding: "5px 10px" }}>
                  Trocar
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TUNE_TYPES.map((tt) => {
                const score = car?.meta_score[tt.v === "grip" ? "street" : tt.v] ?? 5
                return (
                  <button key={tt.v} type="button" onClick={() => setTT(tt.v)}
                    className="r-card text-left p-4 space-y-1 transition-all"
                    style={{
                      border: tuneType === tt.v ? "1px solid var(--border-blue)" : undefined,
                      background: tuneType === tt.v ? "var(--blue-dim)" : undefined,
                      cursor: "pointer",
                    }}>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-tag ${tt.cls}`}>{tt.l}</span>
                      <span className="mono-val" style={{ fontSize: 11, color: scoreColor(score) }}>{score}/10</span>
                    </div>
                    <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{tt.desc}</p>
                  </button>
                )
              })}
            </div>
            <div className="flex justify-between pt-2">
              <button type="button" onClick={() => setStep(1)} className="r-btn r-btn-ghost">Voltar</button>
              <button type="button" disabled={!tuneType} onClick={() => setStep(3)} className="r-btn r-btn-primary"
                style={{ paddingLeft: 28, paddingRight: 28, opacity: tuneType ? 1 : 0.4 }}>
                Próximo — Configurar
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <div className="space-y-6 anim-up" style={{ animationDelay: "100ms" }}>

            {/* Class */}
            <div className="space-y-2">
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>Classe alvo</p>
              <div className="flex gap-2 flex-wrap">
                {CLASSES.map((c) => (
                  <button key={c} type="button" onClick={() => setCls(c)}
                    className={`class-chip${cls === c ? " active" : ""}`} style={{ minWidth: 44 }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>Comportamento</p>
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTY.map((d) => (
                  <button key={d.v} type="button" onClick={() => setDiff(d.v)}
                    className="r-card text-left p-3 transition-all"
                    style={{
                      border: diff === d.v ? "1px solid var(--border-blue)" : undefined,
                      background: diff === d.v ? "var(--blue-dim)" : undefined,
                      cursor: "pointer",
                    }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{d.l}</p>
                    <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{d.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Style / Control / Drivetrain */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {([
                { label: "Estilo",   opts: STYLES,      val: style, set: setStyle as (v: string) => void },
                { label: "Controle", opts: CONTROLS,    val: ctrl,  set: setCtrl  as (v: string) => void },
                { label: "Tração",   opts: DRIVETRAINS, val: dt,    set: setDt },
              ] as const).map(({ label, opts, val, set }) => (
                <div key={label} className="space-y-2">
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>{label}</p>
                  <div className="space-y-1">
                    {opts.map((o) => (
                      <button key={o.v} type="button" onClick={() => set(o.v)}
                        className="w-full r-btn text-left transition-all"
                        style={{
                          justifyContent: "flex-start",
                          fontSize: 12,
                          background: val === o.v ? "var(--blue-dim)" : "var(--bg-card)",
                          border: `1px solid ${val === o.v ? "var(--border-blue)" : "var(--border-strong)"}`,
                          color: val === o.v ? "var(--text)" : "var(--text-muted)",
                          padding: "8px 12px",
                        }}>
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="rounded-lg p-3" style={{ background: "var(--red-dim)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 12, color: "#fca5a5" }}>
                {error}
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button type="button" onClick={() => setStep(2)} className="r-btn r-btn-ghost">Voltar</button>
              <button type="button" onClick={generate} disabled={loading} className="r-btn r-btn-primary"
                style={{ paddingLeft: 32, paddingRight: 32, paddingTop: 10, paddingBottom: 10, opacity: loading ? 0.7 : 1 }}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 rounded-full animate-spin"
                      style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                    Gerando...
                  </span>
                ) : "Gerar Tune"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TunePage() {
  return (
    <RequireAuth>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[60dvh]">
          <div className="w-6 h-6 border-2 rounded-full animate-spin"
            style={{ borderColor: "rgba(37,99,235,0.3)", borderTopColor: "var(--blue)" }} />
        </div>
      }>
        <WizardInner />
      </Suspense>
    </RequireAuth>
  )
}
