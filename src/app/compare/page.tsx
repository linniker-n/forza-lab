"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { CARS } from "@/data/cars"
import type { Car, TuneType } from "@/types"

const TUNE_TYPES: { v: TuneType; l: string }[] = [
  { v: "street", l: "Rua" },
  { v: "drag", l: "Drag" },
  { v: "drift", l: "Drift" },
  { v: "rally", l: "Rally" },
  { v: "cross_country", l: "Cross Country" },
  { v: "top_speed", l: "Top Speed" },
  { v: "grip", l: "Grip" },
]

function carLabel(car: Car) {
  return `${car.brand} ${car.model} ${car.year}`
}

function scoreFor(car: Car, tuneType: TuneType) {
  if (tuneType === "grip" && car.performance) {
    return Number(((car.performance.handling * 0.45) + (car.performance.braking * 0.3) + (car.performance.acceleration * 0.25)).toFixed(1))
  }
  return tuneType === "grip" ? car.meta_score.street : car.meta_score[tuneType]
}

function Picker({
  label,
  selected,
  onSelect,
}: {
  label: string
  selected: Car | null
  onSelect(car: Car): void
}) {
  const [query, setQuery] = useState("")
  const matches = query.length >= 2
    ? CARS.filter((car) => carLabel(car).toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : CARS.slice(0, 8)

  return (
    <div className="r-card p-4 space-y-3">
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>{label}</p>
      <input className="r-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar carro..." />
      {selected && (
        <div className="rounded-lg p-3" style={{ background: "var(--blue-dim)", border: "1px solid var(--border-blue)" }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{selected.brand} {selected.model}</p>
          <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{selected.year} · {selected.drivetrain} · {selected.base_class} {selected.base_pi}</p>
        </div>
      )}
      <div className="space-y-1.5" style={{ maxHeight: 280, overflow: "auto" }}>
        {matches.map((car) => (
          <button
            key={car.id}
            type="button"
            className="prob-card"
            onClick={() => onSelect(car)}
          >
            <span style={{ fontSize: 12, color: "var(--text)", flex: 1 }}>{car.brand} {car.model}</span>
            <span className={`badge-class badge-${car.base_class}`}>{car.base_class}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function MetricRow({ label, left, right }: { label: string; left: number | string; right: number | string }) {
  const leftNumber = typeof left === "number" ? left : Number.NaN
  const rightNumber = typeof right === "number" ? right : Number.NaN
  const leftWins = Number.isFinite(leftNumber) && Number.isFinite(rightNumber) && leftNumber > rightNumber
  const rightWins = Number.isFinite(leftNumber) && Number.isFinite(rightNumber) && rightNumber > leftNumber

  return (
    <div className="grid grid-cols-[1fr_100px_100px] gap-3 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
      <span className="mono-val" style={{ fontSize: 12, color: leftWins ? "#34d399" : "var(--text)" }}>{left}</span>
      <span className="mono-val" style={{ fontSize: 12, color: rightWins ? "#34d399" : "var(--text)" }}>{right}</span>
    </div>
  )
}

export default function ComparePage() {
  const [left, setLeft] = useState<Car | null>(() => CARS.find((car) => car.id === "lamborghini_revuelto_2024") ?? CARS[0] ?? null)
  const [right, setRight] = useState<Car | null>(() => CARS.find((car) => car.id === "koenigsegg_jesko_2020") ?? CARS[1] ?? null)
  const [tuneType, setTuneType] = useState<TuneType>("street")

  const winner = useMemo(() => {
    if (!left || !right) return null
    const leftScore = scoreFor(left, tuneType)
    const rightScore = scoreFor(right, tuneType)
    if (leftScore === rightScore) return null
    return leftScore > rightScore ? left : right
  }, [left, right, tuneType])

  return (
    <div className="dot-grid" style={{ minHeight: "100dvh" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="anim-up">
          <p className="section-label">Comparador</p>
          <h1 className="page-title">AWD vs RWD, grip vs reta</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 7, maxWidth: 620, lineHeight: 1.6 }}>
            Compare dois carros pelo contexto da tune antes de gerar o setup.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap anim-up" style={{ animationDelay: "60ms" }}>
          {TUNE_TYPES.map((type) => (
            <button key={type.v} type="button" className={`filter-chip${tuneType === type.v ? " active" : ""}`} onClick={() => setTuneType(type.v)}>
              {type.l}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Picker label="Carro A" selected={left} onSelect={setLeft} />
          <Picker label="Carro B" selected={right} onSelect={setRight} />
        </div>

        {left && right && (
          <div className="r-card bracket p-5 space-y-5 anim-up">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Leitura rápida</p>
                <p style={{ fontSize: 18, color: "var(--text)", fontWeight: 900, marginTop: 4 }}>
                  {winner ? `${winner.brand} ${winner.model} leva vantagem em ${TUNE_TYPES.find((type) => type.v === tuneType)?.l}` : "Empate técnico no contexto escolhido"}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/tune?car=${left.id}&type=${tuneType}`} className="r-btn r-btn-outline">Tunar A</Link>
                <Link href={`/tune?car=${right.id}&type=${tuneType}`} className="r-btn r-btn-primary">Tunar B</Link>
              </div>
            </div>

            <div className="grid grid-cols-[1fr_100px_100px] gap-3 pb-2" style={{ borderBottom: "1px solid var(--border-strong)" }}>
              <span />
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>{left.brand}</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>{right.brand}</span>
            </div>

            <div>
              <MetricRow label="Score da tune" left={scoreFor(left, tuneType).toFixed(1)} right={scoreFor(right, tuneType).toFixed(1)} />
              <MetricRow label="PI base" left={left.base_pi} right={right.base_pi} />
              <MetricRow label="Potência" left={left.power_hp} right={right.power_hp} />
              <MetricRow label="Torque" left={left.torque_nm} right={right.torque_nm} />
              <MetricRow label="Peso" left={left.weight_kg} right={right.weight_kg} />
              <MetricRow label="Speed" left={left.performance?.speed ?? "-"} right={right.performance?.speed ?? "-"} />
              <MetricRow label="Handling" left={left.performance?.handling ?? "-"} right={right.performance?.handling ?? "-"} />
              <MetricRow label="Launch" left={left.performance?.launch ?? "-"} right={right.performance?.launch ?? "-"} />
              <MetricRow label="Offroad" left={left.performance?.offroad ?? "-"} right={right.performance?.offroad ?? "-"} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
