"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { CarCard } from "@/components/cars/CarCard"
import { CARS, FANDOM_SOURCE_URL } from "@/data/cars"
import type { Car, CarClass, TuneType } from "@/types"

const TUNE_TYPES: { v: TuneType; l: string }[] = [
  { v: "street", l: "Rua" },
  { v: "drag", l: "Drag" },
  { v: "drift", l: "Drift" },
  { v: "rally", l: "Rally" },
  { v: "cross_country", l: "Cross Country" },
  { v: "top_speed", l: "Top Speed" },
  { v: "grip", l: "Grip" },
]

const CLASSES: (CarClass | "all")[] = ["all", "D", "C", "B", "A", "S1", "S2", "R", "X"]

function scoreFor(car: Car, tuneType: TuneType) {
  if (tuneType === "grip") {
    const perf = car.performance
    return perf ? Number(((perf.handling * 0.45) + (perf.braking * 0.3) + (perf.acceleration * 0.25)).toFixed(1)) : car.meta_score.street
  }
  return car.meta_score[tuneType]
}

function confidence(score: number) {
  if (score >= 9) return "Alto"
  if (score >= 7.5) return "Médio"
  return "Baixo"
}

export default function MetaPage() {
  const [tuneType, setTuneType] = useState<TuneType>("street")
  const [carClass, setCarClass] = useState<CarClass | "all">("all")

  const ranked = useMemo(() => {
    return CARS
      .filter((car) => carClass === "all" || car.base_class === carClass)
      .map((car) => ({ car, score: scoreFor(car, tuneType) }))
      .sort((a, b) => b.score - a.score || b.car.base_pi - a.car.base_pi)
      .slice(0, 24)
  }, [carClass, tuneType])

  return (
    <div className="dot-grid" style={{ minHeight: "100dvh" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
          <div className="anim-up">
            <p className="section-label">Meta tracker local</p>
            <h1 className="page-title">Ranking por contexto</h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8, maxWidth: 620, lineHeight: 1.6 }}>
              Ranking derivado dos atributos oficiais da tabela do Forza Wiki. Use como ponto de partida técnico até existirem tempos comunitários reais.
            </p>
            <a href={FANDOM_SOURCE_URL} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "var(--blue-bright)" }}>
              Ver fonte no Forza Wiki
            </a>
          </div>

          <div className="r-card p-4 space-y-4 anim-up" style={{ animationDelay: "80ms" }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
                Tipo de prova
              </p>
              <div className="flex flex-wrap gap-2">
                {TUNE_TYPES.map((type) => (
                  <button key={type.v} type="button" className={`filter-chip${tuneType === type.v ? " active" : ""}`} onClick={() => setTuneType(type.v)}>
                    {type.l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
                Classe
              </p>
              <div className="flex flex-wrap gap-1.5">
                {CLASSES.map((item) => (
                  <button key={item} type="button" className={`class-chip${carClass === item ? " active" : ""}`} onClick={() => setCarClass(item)}>
                    {item === "all" ? "Todas" : item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ranked.slice(0, 12).map(({ car }, index) => (
              <CarCard key={car.id} car={car} index={index} highlightKey={tuneType} />
            ))}
          </div>

          <aside className="space-y-2">
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>
              Top 24 técnico
            </p>
            {ranked.map(({ car, score }, index) => (
              <Link
                key={car.id}
                href={`/tune?car=${car.id}&type=${tuneType}`}
                className="r-card flex items-center justify-between gap-3 p-3 anim-up"
                style={{ animationDelay: `${index * 22}ms`, textDecoration: "none" }}
              >
                <div className="min-w-0">
                  <p style={{ fontSize: 12, fontWeight: 800, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {index + 1}. {car.brand} {car.model}
                  </p>
                  <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                    {car.year} · {car.fandom_car_type ?? "FH6"} · confiança {confidence(score)}
                  </p>
                </div>
                <span className="mono-val" style={{ fontSize: 14, color: score >= 8 ? "#34d399" : score >= 6 ? "#fbbf24" : "var(--text-muted)" }}>
                  {score.toFixed(1)}
                </span>
              </Link>
            ))}
          </aside>
        </div>
      </div>
    </div>
  )
}
