import { getCarById } from "@/data/cars"
import { generateTune } from "@/lib/tune-engine/generator"
import type { CarClass, ControlType, DifficultyLevel, Drivetrain, DrivingStyle, TuneRequest, TuneType } from "@/types"
import { NextResponse } from "next/server"

const CLASSES: CarClass[] = ["D", "C", "B", "A", "S1", "S2", "R", "X"]
const TUNE_TYPES: TuneType[] = ["street", "drag", "drift", "rally", "cross_country", "top_speed", "grip"]
const STYLES: DrivingStyle[] = ["casual", "competitive", "meta"]
const CONTROLS: ControlType[] = ["keyboard", "controller", "wheel"]
const DRIVETRAINS: (Drivetrain | "original")[] = ["original", "FWD", "RWD", "AWD"]
const DIFFICULTIES: DifficultyLevel[] = ["easy", "balanced", "aggressive"]

export async function POST(request: Request) {
  try {
    const body: TuneRequest = await request.json()

    if (!body.car_id || !body.target_class || !body.tune_type) {
      return NextResponse.json({ error: "Campos obrigatórios: car_id, target_class, tune_type" }, { status: 400 })
    }

    if (
      !CLASSES.includes(body.target_class) ||
      !TUNE_TYPES.includes(body.tune_type) ||
      !STYLES.includes(body.style) ||
      !CONTROLS.includes(body.control) ||
      !DRIVETRAINS.includes(body.preferred_drivetrain) ||
      !DIFFICULTIES.includes(body.difficulty)
    ) {
      return NextResponse.json({ error: "Parâmetros inválidos para gerar tune" }, { status: 400 })
    }

    const car = getCarById(body.car_id)
    if (!car) {
      return NextResponse.json({ error: "Carro não encontrado" }, { status: 404 })
    }

    const tune = generateTune(body, car)
    return NextResponse.json({ tune })
  } catch {
    return NextResponse.json({ error: "Erro interno ao gerar tune" }, { status: 500 })
  }
}
