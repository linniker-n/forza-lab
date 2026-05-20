import type {
  Car,
  ControlType,
  DifficultyLevel,
  Drivetrain,
  DrivingStyle,
  TuneIntent,
  TuneType,
  TuneWarning,
  TuningSetup,
} from "@/types"
import type { CarProfile } from "./analyze"

const AERO_LEVELS: TuningSetup["aero"]["front"][] = [
  "min",
  "low",
  "medium",
  "medium-high",
  "high",
  "max",
]

export const FH6_INTENT_LABELS: Record<TuneIntent, string> = {
  balanced: "Balanceado",
  control: "Controle",
  speed: "Velocidade",
  cornering: "Curvas",
  acceleration: "Aceleracao",
}

export const FH6_INTENT_DESCRIPTIONS: Record<TuneIntent, string> = {
  balanced: "Base segura para Horizon: reta, curva e estabilidade sem depender de uma pista especifica.",
  control: "Mais previsivel, menos nervoso e mais facil de salvar quando o carro passa do limite.",
  speed: "Menos arrasto, cambio mais longo e foco em velocidade final para estradas abertas.",
  cornering: "Mais grip lateral, resposta de frente e downforce para mapas tecnicos e curvas.",
  acceleration: "Foco em largada, retomada e saida de curva com mais tracao.",
}

interface IntentContext {
  car: Car
  profile: CarProfile
  tuneType: TuneType
  drivetrain: Drivetrain
  intent: TuneIntent
  style: DrivingStyle
  control: ControlType
  difficulty: DifficultyLevel
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function r1(value: number): number {
  return Math.round(value * 10) / 10
}

function r2(value: number): number {
  return Math.round(value * 100) / 100
}

function shiftAero(value: TuningSetup["aero"]["front"], delta: number): TuningSetup["aero"]["front"] {
  const index = AERO_LEVELS.indexOf(value)
  return AERO_LEVELS[clamp(index + delta, 0, AERO_LEVELS.length - 1)]
}

function multiplyAxleValues(values: { front: number; rear: number }, front: number, rear: number) {
  values.front = r1(values.front * front)
  values.rear = r1(values.rear * rear)
}

function multiplyDamping(damping: TuningSetup["damping"], front: number, rear: number) {
  damping.rebound_front = r1(damping.rebound_front * front)
  damping.bump_front = r1(damping.bump_front * front)
  damping.rebound_rear = r1(damping.rebound_rear * rear)
  damping.bump_rear = r1(damping.bump_rear * rear)
}

function cloneTune(tune: TuningSetup): TuningSetup {
  return {
    tires: { ...tune.tires },
    gearing: { ...tune.gearing },
    alignment: { ...tune.alignment },
    antiroll_bars: { ...tune.antiroll_bars },
    springs: { ...tune.springs },
    damping: { ...tune.damping },
    aero: { ...tune.aero },
    brakes: { ...tune.brakes },
    differential: { ...tune.differential },
  }
}

function stabilizeForInput(tune: TuningSetup, context: IntentContext) {
  if (context.control !== "keyboard" && context.style !== "casual") return

  tune.tires.rear = r1(tune.tires.rear - 0.3)
  tune.antiroll_bars.rear = r1(tune.antiroll_bars.rear * 0.94)
  tune.alignment.toe_rear = r1(clamp(tune.alignment.toe_rear + 0.1, -0.2, 0.4))
  tune.brakes.pressure = clamp(tune.brakes.pressure - 3, 60, 150)

  if (tune.differential.rear_accel !== undefined) {
    tune.differential.rear_accel = clamp(tune.differential.rear_accel - 5, 15, 100)
  }
  if (tune.differential.center_balance !== undefined) {
    tune.differential.center_balance = clamp(tune.differential.center_balance - 3, 45, 80)
  }
}

function sharpenForMeta(tune: TuningSetup, context: IntentContext) {
  if (context.style !== "meta" || context.intent === "control") return

  tune.antiroll_bars.rear = r1(clamp(tune.antiroll_bars.rear * 1.06, 3, 65))
  tune.alignment.caster = r1(clamp(tune.alignment.caster + 0.2, 4.5, 7.0))

  if (tune.differential.rear_accel !== undefined) {
    tune.differential.rear_accel = clamp(tune.differential.rear_accel + 4, 15, 100)
  }
}

function applyBalancedIntent(tune: TuningSetup, context: IntentContext) {
  if (context.profile.isHeavy) {
    tune.aero.rear = shiftAero(tune.aero.rear, 1)
    tune.brakes.pressure = clamp(tune.brakes.pressure + 4, 60, 150)
  }

  if (context.profile.isPowerful && tune.differential.rear_accel !== undefined) {
    tune.differential.rear_accel = clamp(tune.differential.rear_accel - 3, 15, 100)
  }
}

function applyControlIntent(tune: TuningSetup, context: IntentContext) {
  multiplyAxleValues(tune.tires, 0.96, 0.93)
  multiplyAxleValues(tune.antiroll_bars, 0.86, 0.78)
  multiplyAxleValues(tune.springs, 0.9, 0.86)
  multiplyDamping(tune.damping, 0.9, 0.86)

  tune.aero.rear = shiftAero(tune.aero.rear, 2)
  tune.alignment.toe_rear = r1(clamp(tune.alignment.toe_rear + 0.2, -0.2, 0.4))
  tune.alignment.camber_rear = r1(clamp(tune.alignment.camber_rear + 0.3, -5, 0))
  tune.brakes.pressure = clamp(tune.brakes.pressure - 8, 60, 150)

  if (tune.differential.front_accel !== undefined) {
    tune.differential.front_accel = clamp(tune.differential.front_accel - 8, 5, 100)
  }
  if (tune.differential.rear_accel !== undefined) {
    tune.differential.rear_accel = clamp(tune.differential.rear_accel - 20, 15, 100)
  }
  if (tune.differential.rear_decel !== undefined) {
    tune.differential.rear_decel = clamp(tune.differential.rear_decel - 10, 5, 100)
  }
  if (tune.differential.center_balance !== undefined) {
    tune.differential.center_balance = clamp(tune.differential.center_balance - 8, 45, 80)
  }

  if (context.profile.isPowerful && tune.differential.rear_accel !== undefined) {
    tune.differential.rear_accel = clamp(tune.differential.rear_accel - 8, 15, 100)
  }
  if (context.profile.isHeavy) {
    tune.aero.rear = shiftAero(tune.aero.rear, 1)
  }
}

function applySpeedIntent(tune: TuningSetup, context: IntentContext) {
  tune.tires.front = r1(tune.tires.front + 1.0)
  tune.tires.rear = r1(tune.tires.rear + 1.2)
  tune.gearing.final_drive = r2(clamp(tune.gearing.final_drive * 0.82, 2.2, 5.5))
  tune.alignment.camber_front = r1(clamp(tune.alignment.camber_front + 0.6, -5, 0))
  tune.alignment.camber_rear = r1(clamp(tune.alignment.camber_rear + 0.5, -5, 0))
  tune.alignment.toe_front = 0
  tune.alignment.toe_rear = r1(clamp(tune.alignment.toe_rear, 0, 0.2))
  tune.aero.front = shiftAero(tune.aero.front, -3)
  tune.aero.rear = shiftAero(tune.aero.rear, context.profile.isPowerful ? -1 : -3)
  tune.brakes.pressure = clamp(tune.brakes.pressure + 5, 60, 150)

  multiplyAxleValues(tune.springs, 1.08, 1.08)
  multiplyDamping(tune.damping, 1.08, 1.08)

  if (tune.differential.rear_accel !== undefined) {
    tune.differential.rear_accel = clamp(tune.differential.rear_accel - 8, 15, 100)
  }
  if (tune.differential.center_balance !== undefined) {
    tune.differential.center_balance = clamp(tune.differential.center_balance - 5, 45, 80)
  }
}

function applyCorneringIntent(tune: TuningSetup, context: IntentContext) {
  multiplyAxleValues(tune.tires, 0.95, 0.96)
  tune.gearing.final_drive = r2(clamp(tune.gearing.final_drive * 1.1, 2.2, 5.5))
  tune.alignment.camber_front = r1(clamp(tune.alignment.camber_front - 0.55, -5, 0))
  tune.alignment.camber_rear = r1(clamp(tune.alignment.camber_rear - 0.35, -5, 0))
  tune.alignment.toe_front = r1(clamp(tune.alignment.toe_front - 0.2, -0.4, 0.4))
  tune.alignment.toe_rear = r1(clamp(tune.alignment.toe_rear + 0.1, -0.2, 0.4))
  tune.alignment.caster = r1(clamp(tune.alignment.caster + 0.5, 4.5, 7.0))
  tune.aero.front = shiftAero(tune.aero.front, 2)
  tune.aero.rear = shiftAero(tune.aero.rear, 2)
  tune.antiroll_bars.front = r1(clamp(tune.antiroll_bars.front * 0.9, 3, 65))
  tune.antiroll_bars.rear = r1(clamp(tune.antiroll_bars.rear * 1.18, 3, 65))
  multiplyAxleValues(tune.springs, 1.06, context.profile.isHeavy ? 1.04 : 1.08)
  multiplyDamping(tune.damping, 1.08, 1.1)

  if (tune.differential.front_accel !== undefined) {
    tune.differential.front_accel = clamp(tune.differential.front_accel - 3, 5, 100)
  }
  if (tune.differential.rear_decel !== undefined) {
    tune.differential.rear_decel = clamp(tune.differential.rear_decel + 8, 5, 100)
  }
  if (tune.differential.center_balance !== undefined) {
    tune.differential.center_balance = clamp(tune.differential.center_balance + 5, 45, 85)
  }
}

function applyAccelerationIntent(tune: TuningSetup, context: IntentContext) {
  tune.tires.front = r1(tune.tires.front + 0.4)
  tune.tires.rear = r1(tune.tires.rear - 1.5)
  tune.gearing.final_drive = r2(clamp(tune.gearing.final_drive * (context.profile.isPowerful ? 1.06 : 1.14), 2.2, 5.5))
  tune.springs.front = r1(tune.springs.front * 1.02)
  tune.springs.rear = r1(tune.springs.rear * 0.86)
  tune.damping.rebound_rear = r1(tune.damping.rebound_rear * 0.88)
  tune.damping.bump_rear = r1(tune.damping.bump_rear * 0.82)
  tune.antiroll_bars.rear = r1(clamp(tune.antiroll_bars.rear * 0.86, 3, 65))
  tune.brakes.pressure = clamp(tune.brakes.pressure - 3, 60, 150)

  if (tune.differential.rear_accel !== undefined) {
    const boost = context.profile.isPowerful ? 6 : 12
    tune.differential.rear_accel = clamp(tune.differential.rear_accel + boost, 15, 100)
  }
  if (tune.differential.center_balance !== undefined) {
    tune.differential.center_balance = clamp(tune.differential.center_balance + 8, 45, 85)
  }
}

export function applyFH6Intent(tune: TuningSetup, context: IntentContext): TuningSetup {
  const adjusted = cloneTune(tune)

  switch (context.intent) {
    case "control":
      applyControlIntent(adjusted, context)
      break
    case "speed":
      applySpeedIntent(adjusted, context)
      break
    case "cornering":
      applyCorneringIntent(adjusted, context)
      break
    case "acceleration":
      applyAccelerationIntent(adjusted, context)
      break
    default:
      applyBalancedIntent(adjusted, context)
      break
  }

  stabilizeForInput(adjusted, context)
  sharpenForMeta(adjusted, context)

  if (context.difficulty === "easy" && context.intent !== "control") {
    adjusted.aero.rear = shiftAero(adjusted.aero.rear, 1)
  }

  return adjusted
}

export function getFH6IntentSummary(intent: TuneIntent): string {
  return FH6_INTENT_DESCRIPTIONS[intent]
}

export function getFH6IntentLabel(intent: TuneIntent): string {
  return FH6_INTENT_LABELS[intent]
}

export function getFH6IntentStrengths(intent: TuneIntent): string[] {
  switch (intent) {
    case "control":
      return ["Setup mais previsivel para mapa aberto", "Mais margem para corrigir erro no controle"]
    case "speed":
      return ["Menos arrasto para retas longas", "Cambio final mais longo para aproveitar ultima marcha"]
    case "cornering":
      return ["Mais frente em curva media e lenta", "Aero e alinhamento voltados a grip lateral"]
    case "acceleration":
      return ["Mais tracao na largada e retomada", "Diferencial e pneus ajustados para saida de curva"]
    default:
      return ["Base neutra para FH6 sem depender de pista especifica"]
  }
}

export function getFH6IntentTuningNotes(intent: TuneIntent): string[] {
  switch (intent) {
    case "control":
      return [
        "Diferencial menos travado para reduzir sustos na saida.",
        "Barras, molas e damping mais macios para dar margem de correcao.",
        "Mais estabilidade traseira com toe-in e aero traseiro.",
      ]
    case "speed":
      return [
        "Final drive mais longo para velocidade final.",
        "Aero e cambagem reduzidos para diminuir arrasto.",
        "Suspensao mais firme para estabilidade em alta.",
      ]
    case "cornering":
      return [
        "Final drive mais curto para retomada entre curvas.",
        "Mais cambagem, caster e aero para grip lateral.",
        "Traseira mais rotativa com barra traseira mais forte.",
      ]
    case "acceleration":
      return [
        "Final drive mais curto para largada e retomada.",
        "Traseira mais macia e pneu traseiro com mais contato.",
        "Diferencial mais travado para colocar torque no chao.",
      ]
    default:
      return [
        "Mantem compromisso entre controle, curva e velocidade.",
        "Ajusta apenas peso, potencia e estabilidade sem exagerar o carro.",
      ]
  }
}

function perf(car: Car, key: keyof NonNullable<Car["performance"]>, fallback: number): number {
  return car.performance?.[key] ?? fallback
}

function powerToWeightScore(car: Car): number {
  return clamp((car.power_hp / Math.max(car.weight_kg, 1)) * 18, 1, 10)
}

function lightnessScore(car: Car): number {
  return clamp(11 - car.weight_kg / 220, 1, 10)
}

export function scoreCarForFH6Intent(car: Car, intent: TuneIntent): number {
  const speed = perf(car, "speed", car.power_hp > 650 ? 8 : car.power_hp > 400 ? 6.5 : 5)
  const handling = perf(car, "handling", car.car_type.includes("hypercar") || car.car_type.includes("supercar") ? 8 : 5.5)
  const acceleration = perf(car, "acceleration", powerToWeightScore(car))
  const launch = perf(car, "launch", car.drivetrain === "AWD" ? 8 : 5.5)
  const braking = perf(car, "braking", handling)
  const offroad = perf(car, "offroad", car.car_type.includes("offroad") ? 8 : 4.5)
  const drivetrainBonus = car.drivetrain === "AWD" ? 0.7 : car.drivetrain === "RWD" ? 0.2 : -0.3
  const light = lightnessScore(car)
  const ptw = powerToWeightScore(car)

  const score =
    intent === "speed"
      ? speed * 0.42 + ptw * 0.32 + acceleration * 0.18 + light * 0.08
      : intent === "cornering"
        ? handling * 0.42 + braking * 0.24 + light * 0.2 + speed * 0.08 + drivetrainBonus
        : intent === "control"
          ? handling * 0.3 + braking * 0.25 + launch * 0.18 + light * 0.12 + (10 - Math.min(ptw, 10)) * 0.08 + drivetrainBonus
          : intent === "acceleration"
            ? acceleration * 0.34 + launch * 0.34 + ptw * 0.2 + drivetrainBonus + (car.torque_nm / Math.max(car.weight_kg, 1)) * 0.3
            : (speed + handling + acceleration + launch + braking + Math.max(offroad - 2, 1)) / 6

  return r1(clamp(score, 1, 10))
}

export function getFH6IntentCarStrengths(car: Car, intent: TuneIntent): string[] {
  const score = scoreCarForFH6Intent(car, intent)
  const label = FH6_INTENT_LABELS[intent]
  const strengths = [`Compatibilidade ${label}: ${score}/10`]

  if (intent === "control" && car.drivetrain === "AWD") strengths.push("AWD ajuda a manter previsibilidade em mapa aberto")
  if (intent === "speed" && car.power_hp >= 600) strengths.push("Potencia alta favorece velocidade final")
  if (intent === "cornering" && car.weight_kg < 1450) strengths.push("Peso baixo ajuda resposta e troca de direcao")
  if (intent === "acceleration" && car.drivetrain === "AWD") strengths.push("AWD favorece largada e retomada")
  if (intent === "balanced" && car.recommended_use.length >= 3) strengths.push("Carro naturalmente versatil para varias provas")

  return strengths
}

export function getFH6IntentCarWeaknesses(car: Car, intent: TuneIntent): string[] {
  const weaknesses: string[] = []
  const score = scoreCarForFH6Intent(car, intent)

  if (score < 5.5) weaknesses.push(`Baixa compatibilidade natural com perfil ${FH6_INTENT_LABELS[intent]}`)
  if (intent === "speed" && car.power_hp < 350) weaknesses.push("Potencia base baixa limita velocidade em reta")
  if (intent === "cornering" && car.weight_kg > 1800) weaknesses.push("Peso alto limita mudanca de direcao em curvas")
  if (intent === "control" && car.power_hp > 800 && car.drivetrain !== "AWD") weaknesses.push("Muita potencia sem AWD exige acelerador muito progressivo")
  if (intent === "acceleration" && car.drivetrain === "FWD") weaknesses.push("FWD perde tracao mais cedo em largada e saida")

  return weaknesses
}

export function getFH6IntentWarnings(context: IntentContext): TuneWarning[] {
  const warnings: TuneWarning[] = []

  if (context.intent === "speed" && context.car.power_hp < 350) {
    warnings.push({
      type: "tip",
      message: "Para velocidade final, carros abaixo de 350 hp costumam precisar priorizar potencia antes de aero ou cambio.",
    })
  }

  if (context.intent === "cornering" && context.car.weight_kg > 1800) {
    warnings.push({
      type: "warning",
      message: "Perfil de curvas em carro pesado: reducao de peso e pneus largos sao mais importantes que ganhar potencia.",
    })
  }

  if (context.intent === "acceleration" && context.drivetrain === "FWD") {
    warnings.push({
      type: "warning",
      message: "FWD limita tracao em aceleracao. Se o carro permitir, AWD tende a ser mais consistente para largada e saida.",
    })
  }

  if (context.intent === "control" && context.style === "meta") {
    warnings.push({
      type: "tip",
      message: "Controle + estilo meta cria uma tune rapida, mas menos agressiva que um setup puramente competitivo.",
    })
  }

  return warnings
}
