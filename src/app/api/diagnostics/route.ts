import { getCarById } from "@/data/cars"
import { diagnose } from "@/lib/tune-engine/diagnostics"
import type { DiagnosticProblem, TuneType } from "@/types"
import { NextResponse } from "next/server"

const PROBLEMS: DiagnosticProblem[] = [
  "understeer",
  "oversteer",
  "wheelspin",
  "slow_cornering",
  "slow_straight",
  "bouncing",
  "drift_loss",
  "brake_instability",
]

const TUNE_TYPES: TuneType[] = ["street", "drag", "drift", "rally", "cross_country", "top_speed", "grip"]

export async function POST(request: Request) {
  try {
    const { problem, car_id, tune_type }: { problem: DiagnosticProblem; car_id?: string; tune_type?: TuneType } = await request.json()

    if (!PROBLEMS.includes(problem)) {
      return NextResponse.json({ error: "Problema inválido" }, { status: 400 })
    }

    const result = diagnose(problem, {
      car: car_id ? getCarById(car_id) : undefined,
      tuneType: tune_type && TUNE_TYPES.includes(tune_type) ? tune_type : undefined,
    })
    return NextResponse.json({ result })
  } catch {
    return NextResponse.json({ error: "Erro interno no diagnóstico" }, { status: 500 })
  }
}
