"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { CarCard } from "@/components/cars/CarCard"
import { CARS } from "@/data/cars"
import { useSubscription } from "@/lib/subscription/context"
import { UpgradeModal } from "@/components/paywall/UpgradeModal"
import { FREE_LIMITS } from "@/lib/subscription/limits"
import type { Car, CarClass, TuneType } from "@/types"

const TUNE_TYPES: { v: TuneType; l: string }[] = [
  { v: "street", l: "Rua" },
  { v: "drag", l: "Drag" },
  { v: "drift", l: "Drift" },
  { v: "rally", l: "Rally" },
  { v: "cross_country", l: "Cross country" },
  { v: "top_speed", l: "Top speed" },
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
  if (score >= 9) return "Alta"
  if (score >= 7.5) return "Media"
  return "Baixa"
}

export default function MetaPage() {
  const [tuneType, setTuneType] = useState<TuneType>("street")
  const [carClass, setCarClass] = useState<CarClass | "all">("all")
  const [showUpgrade, setShowUpgrade] = useState(false)
  const { isPro } = useSubscription()
  const visibleLimit = isPro ? 24 : FREE_LIMITS.rankingVisible

  const ranked = useMemo(() => {
    return CARS
      .filter((car) => carClass === "all" || car.base_class === carClass)
      .map((car) => ({ car, score: scoreFor(car, tuneType) }))
      .sort((a, b) => b.score - a.score || b.car.base_pi - a.car.base_pi)
      .slice(0, 24)
  }, [carClass, tuneType])

  return (
    <RequireAuth>
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} reason="ranking_limit" />
      <div className="dot-grid" style={{ minHeight: "100dvh" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
            <div className="anim-up">
              <p className="section-label">Meta tracker local</p>
              <h1 className="page-title">Ranking por contexto</h1>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8, maxWidth: 620, lineHeight: 1.6 }}>
                Ranking tecnico calculado pela base local do app, desempenho do carro e tipo de prova.
              </p>
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
              {ranked.slice(0, Math.min(visibleLimit, 12)).map(({ car }, index) => (
                <CarCard key={car.id} car={car} index={index} highlightKey={tuneType} />
              ))}
            </div>

            <aside className="space-y-2">
              <div className="flex items-center justify-between">
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                  Top {isPro ? 24 : 3} tecnico
                </p>
                {!isPro && (
                  <button type="button" onClick={() => setShowUpgrade(true)} style={{ fontSize: 10, fontWeight: 700, color: "var(--fh6-teal)", background: "none", border: "none", cursor: "pointer" }}>
                    Ver top 24 →
                  </button>
                )}
              </div>

              {ranked.map(({ car, score }, index) => {
                const isLocked = !isPro && index >= FREE_LIMITS.rankingVisible
                return (
                  <div key={car.id} style={{ position: "relative" }}>
                    <Link
                      href={isLocked ? "#" : `/tune?car=${car.id}&type=${tuneType}`}
                      className="r-card flex items-center justify-between gap-3 p-3 anim-up"
                      onClick={isLocked ? (e) => { e.preventDefault(); setShowUpgrade(true) } : undefined}
                      style={{
                        animationDelay: `${index * 22}ms`, textDecoration: "none",
                        filter: isLocked ? "blur(4px)" : "none",
                        pointerEvents: isLocked ? "none" : "auto",
                        userSelect: isLocked ? "none" : "auto",
                      }}
                    >
                      <div className="min-w-0">
                        <p style={{ fontSize: 12, fontWeight: 800, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {index + 1}. {car.brand} {car.model}
                        </p>
                        <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                          {car.year} - confianca {confidence(score)}
                        </p>
                      </div>
                      <span className="mono-val" style={{ fontSize: 14, color: score >= 8 ? "#34d399" : score >= 6 ? "#fbbf24" : "var(--text-muted)" }}>
                        {score.toFixed(1)}
                      </span>
                    </Link>
                    {isLocked && (
                      <button
                        type="button"
                        onClick={() => setShowUpgrade(true)}
                        style={{
                          position: "absolute", inset: 0, width: "100%",
                          background: "rgba(0,0,0,0.45)", borderRadius: 8,
                          border: "none", cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          backdropFilter: "blur(2px)",
                        }}
                      >
                        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--fh6-teal)", letterSpacing: "0.08em" }}>PRO</span>
                      </button>
                    )}
                  </div>
                )
              })}
            </aside>
          </div>
        </div>
      </div>
    </RequireAuth>
  )
}
