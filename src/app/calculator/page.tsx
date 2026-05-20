"use client"

import { useMemo, useState } from "react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { calculateAdvancedGearing } from "@/lib/tune-engine/gearing-calculator"
import type { AdvancedGearingInput, Drivetrain, Gearing, TuneIntent } from "@/types"

const INTENTS: { value: TuneIntent; label: string }[] = [
  { value: "balanced", label: "Balanceado" },
  { value: "control", label: "Controle" },
  { value: "speed", label: "Velocidade" },
  { value: "cornering", label: "Curvas" },
  { value: "acceleration", label: "Aceleracao" },
]

const DRIVETRAINS: Drivetrain[] = ["AWD", "RWD", "FWD"]
const GEAR_KEYS = ["gear_1", "gear_2", "gear_3", "gear_4", "gear_5", "gear_6", "gear_7", "gear_8", "gear_9", "gear_10"] as const

function numeric(value: string, fallback: number): number {
  const parsed = Number(value.replace(",", "."))
  return Number.isFinite(parsed) ? parsed : fallback
}

function optionalNumeric(value: string): number | undefined {
  if (!value.trim()) return undefined
  const parsed = Number(value.replace(",", "."))
  return Number.isFinite(parsed) ? parsed : undefined
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function baseGearing(finalDrive: number, firstGear: number): Gearing {
  return {
    final_drive: finalDrive,
    gear_1: firstGear,
    gear_2: 2.18,
    gear_3: 1.62,
    gear_4: 1.28,
    gear_5: 1.02,
    gear_6: 0.84,
  }
}

export default function CalculatorPage() {
  const [redlineRpm, setRedlineRpm] = useState("7500")
  const [targetSpeedKmh, setTargetSpeedKmh] = useState("320")
  const [numberOfGears, setNumberOfGears] = useState("6")
  const [currentFinalDrive, setCurrentFinalDrive] = useState("3.70")
  const [currentFirstGear, setCurrentFirstGear] = useState("2.95")
  const [firstGearSpeedKmh, setFirstGearSpeedKmh] = useState("")
  const [powerHp, setPowerHp] = useState("600")
  const [weightKg, setWeightKg] = useState("1450")
  const [drivetrain, setDrivetrain] = useState<Drivetrain>("AWD")
  const [intent, setIntent] = useState<TuneIntent>("balanced")

  const result = useMemo(() => {
    const finalDrive = clamp(optionalNumeric(currentFinalDrive) ?? 3.7, 2.2, 5.5)
    const firstGear = clamp(optionalNumeric(currentFirstGear) ?? 2.95, 2.2, 4.2)
    const input: AdvancedGearingInput = {
      redline_rpm: Math.round(clamp(numeric(redlineRpm, 7500), 4500, 11000)),
      target_speed_kmh: Math.round(clamp(numeric(targetSpeedKmh, 320), 120, 520)),
      number_of_gears: Math.round(clamp(numeric(numberOfGears, 6), 6, 10)),
      current_final_drive: optionalNumeric(currentFinalDrive),
      current_first_gear: optionalNumeric(currentFirstGear),
      first_gear_speed_kmh: optionalNumeric(firstGearSpeedKmh),
    }

    return calculateAdvancedGearing(input, {
      base: baseGearing(finalDrive, firstGear),
      intent,
      drivetrain,
      powerHp: clamp(numeric(powerHp, 600), 40, 1800),
      weightKg: clamp(numeric(weightKg, 1450), 300, 3500),
    })
  }, [
    currentFinalDrive,
    currentFirstGear,
    drivetrain,
    firstGearSpeedKmh,
    intent,
    numberOfGears,
    powerHp,
    redlineRpm,
    targetSpeedKmh,
    weightKg,
  ])

  return (
    <RequireAuth>
      <div className="dot-grid" style={{ minHeight: "100dvh" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
          <div className="anim-up">
            <p className="section-label">Calculadora</p>
            <h1 className="page-title">Cambio</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-4">
            <section className="r-card bracket p-5 space-y-5 anim-up" style={{ animationDelay: "40ms" }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="calc-label">Redline RPM</span>
                  <input className="r-input" value={redlineRpm} onChange={(event) => setRedlineRpm(event.target.value)} inputMode="numeric" />
                </label>
                <label className="space-y-1">
                  <span className="calc-label">Velocidade alvo km/h</span>
                  <input className="r-input" value={targetSpeedKmh} onChange={(event) => setTargetSpeedKmh(event.target.value)} inputMode="numeric" />
                </label>
                <label className="space-y-1">
                  <span className="calc-label">Marchas</span>
                  <input className="r-input" value={numberOfGears} onChange={(event) => setNumberOfGears(event.target.value)} inputMode="numeric" />
                </label>
                <label className="space-y-1">
                  <span className="calc-label">Final drive atual</span>
                  <input className="r-input" value={currentFinalDrive} onChange={(event) => setCurrentFinalDrive(event.target.value)} inputMode="decimal" />
                </label>
                <label className="space-y-1">
                  <span className="calc-label">Relacao da 1a atual</span>
                  <input className="r-input" value={currentFirstGear} onChange={(event) => setCurrentFirstGear(event.target.value)} inputMode="decimal" />
                </label>
                <label className="space-y-1">
                  <span className="calc-label">Velocidade maxima em 1a</span>
                  <input className="r-input" value={firstGearSpeedKmh} onChange={(event) => setFirstGearSpeedKmh(event.target.value)} inputMode="decimal" placeholder="Opcional" />
                </label>
                <label className="space-y-1">
                  <span className="calc-label">Potencia hp</span>
                  <input className="r-input" value={powerHp} onChange={(event) => setPowerHp(event.target.value)} inputMode="decimal" />
                </label>
                <label className="space-y-1">
                  <span className="calc-label">Peso kg</span>
                  <input className="r-input" value={weightKg} onChange={(event) => setWeightKg(event.target.value)} inputMode="decimal" />
                </label>
              </div>

              <div className="space-y-2">
                <p className="calc-label">Objetivo</p>
                <div className="flex flex-wrap gap-2">
                  {INTENTS.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      className={`filter-chip${intent === item.value ? " active" : ""}`}
                      onClick={() => setIntent(item.value)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="calc-label">Tracao</p>
                <div className="flex flex-wrap gap-2">
                  {DRIVETRAINS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`filter-chip${drivetrain === item ? " active" : ""}`}
                      onClick={() => setDrivetrain(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="r-card bracket p-5 space-y-4 anim-up" style={{ animationDelay: "80ms" }}>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="section-label">Resultado</p>
                  <h2 style={{ fontSize: 22, fontWeight: 850, color: "var(--text)", lineHeight: 1.1 }}>
                    Final {result.final_drive.toFixed(2)}
                  </h2>
                </div>
                <span className={`badge-class badge-${drivetrain.toLowerCase()}`}>{drivetrain}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {GEAR_KEYS.filter((key) => result[key] !== undefined).map((key, index) => (
                  <div
                    key={key}
                    className="rounded-lg p-3"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}
                  >
                    <p className="calc-label">{index + 1}a marcha</p>
                    <p className="mono-val" style={{ fontSize: 24, color: "var(--text)", marginTop: 2 }}>
                      {result[key]?.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </RequireAuth>
  )
}
