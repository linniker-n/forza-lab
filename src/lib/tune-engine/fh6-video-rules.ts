import type {
  Car,
  CarClass,
  ControlType,
  Differential,
  Drivetrain,
  DrivingStyle,
  TuneIntent,
  TuneType,
  TuningSetup,
} from "@/types"

import type { CarProfile } from "./analyze"

interface FH6VideoRuleContext {
  car: Car
  profile: CarProfile
  tuneType: TuneType
  drivetrain: Drivetrain
  targetClass: CarClass
  intent: TuneIntent
  style: DrivingStyle
  control: ControlType
}

const AERO_LEVELS: TuningSetup["aero"]["front"][] = ["min", "low", "medium", "medium-high", "high", "max"]
const ROAD_GRIP_TYPES = new Set<TuneType>(["street", "grip", "top_speed"])
const PRO_SPRING_LBFIN = 457 // 80 kgf/mm

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function r1(value: number): number {
  return Math.round(value * 10) / 10
}

function psiFromBar(bar: number): number {
  return r1(bar / 0.06895)
}

function aeroIndex(value: TuningSetup["aero"]["front"]): number {
  return AERO_LEVELS.indexOf(value)
}

function shiftAero(value: TuningSetup["aero"]["front"], delta: number): TuningSetup["aero"]["front"] {
  return AERO_LEVELS[clamp(aeroIndex(value) + delta, 0, AERO_LEVELS.length - 1)]
}

function atLeastAero(value: TuningSetup["aero"]["front"], minimum: TuningSetup["aero"]["front"]): TuningSetup["aero"]["front"] {
  return aeroIndex(value) < aeroIndex(minimum) ? minimum : value
}

function isRoadGripTune(context: FH6VideoRuleContext): boolean {
  return ROAD_GRIP_TYPES.has(context.tuneType)
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

// ── Pressão de pneus em Bar (guia PRO) ──────────────────────────────────────
// Padrão: 2,0 bar F/T para rua/estrada/grip. Off-road e especiais têm valores próprios.
function tirePressureBar(context: FH6VideoRuleContext): { front: number; rear: number; min: number; max: number } {
  if (context.tuneType === "cross_country") {
    return { front: 1.22, rear: 1.18, min: 1.0, max: 1.4 }
  }
  if (context.tuneType === "rally") {
    return { front: 2.0, rear: 1.95, min: 1.9, max: 2.1 }
  }
  if (context.tuneType === "drag") {
    return { front: 2.15, rear: 2.0, min: 1.8, max: 2.3 }
  }
  if (context.tuneType === "drift") {
    return { front: 2.2, rear: 2.15, min: 2.1, max: 2.3 }
  }
  if (context.tuneType === "top_speed") {
    return { front: 2.0, rear: 2.0, min: 1.5, max: 2.0 }
  }
  // Padrão PRO: 2,0 bar F/T fixo para rua/estrada/grip
  return { front: 2.0, rear: 2.0, min: 1.8, max: 2.2 }
}

function applyTires(tune: TuningSetup, context: FH6VideoRuleContext) {
  const pressure = tirePressureBar(context)
  tune.tires.front = psiFromBar(clamp(pressure.front, pressure.min, pressure.max))
  tune.tires.rear = psiFromBar(clamp(pressure.rear, pressure.min, pressure.max))
}

// ── Alinhamento (guia PRO) ────────────────────────────────────────────────────
// Padrão: 0°/0°/0°/0°/7° para todos os tipos (ponto de partida PRO).
// Drift: cambagem agressiva para iniciação. Top speed: próximo de 0° para reta.
function applyAlignment(tune: TuningSetup, context: FH6VideoRuleContext) {
  if (context.tuneType === "drift") {
    tune.alignment.camber_front = -4.2
    tune.alignment.camber_rear = -1.0
    tune.alignment.toe_front = 0.5
    tune.alignment.toe_rear = 0.1
    tune.alignment.caster = 7
    return
  }

  if (context.tuneType === "top_speed") {
    tune.alignment.camber_front = 0
    tune.alignment.camber_rear = 0
    tune.alignment.toe_front = 0
    tune.alignment.toe_rear = 0
    tune.alignment.caster = 7
    return
  }

  // Padrão PRO: 0,0,0,0,7 — ajustar via telemetria de temperatura de pneu
  tune.alignment.camber_front = 0
  tune.alignment.camber_rear = 0
  tune.alignment.toe_front = 0
  tune.alignment.toe_rear = 0
  tune.alignment.caster = 7
}

// ── ARBs, molas e damping (guia PRO) ─────────────────────────────────────────
// Barras: 1F/65T como padrão universal (exceto drift, rally, cross_country).
// Amortecimento: rebound 9/9, bump 3/3 fixos como ponto de partida PRO.
// Altura: dianteira no máximo, traseira ligeiramente mais baixa para grip.
function applyBarsSpringsDamping(tune: TuningSetup, context: FH6VideoRuleContext) {
  if (context.tuneType !== "rally" && context.tuneType !== "drift" && context.tuneType !== "cross_country") {
    tune.antiroll_bars.front = 1
    tune.antiroll_bars.rear = 65
  } else {
    const total = clamp(tune.antiroll_bars.front + tune.antiroll_bars.rear, 38, 95)
    const rearShare =
      context.intent === "control" ? 0.55 :
      context.intent === "cornering" ? 0.6 :
      context.drivetrain === "FWD" ? 0.6 :
      0.58
    tune.antiroll_bars.rear = r1(clamp(total * rearShare, 3, 65))
    tune.antiroll_bars.front = r1(clamp(total - tune.antiroll_bars.rear, 3, 65))
  }

  // Amortecimento PRO fixo: rebound 9/9, bump 3/3
  tune.damping.rebound_front = 9
  tune.damping.rebound_rear = 9
  tune.damping.bump_front = 3
  tune.damping.bump_rear = 3

  if (isRoadGripTune(context)) {
    tune.springs.front = PRO_SPRING_LBFIN
    tune.springs.rear = PRO_SPRING_LBFIN
    tune.springs.ride_height_front = "max"
    tune.springs.ride_height_rear = "max"
    return
  }

  if (context.tuneType === "rally" || context.tuneType === "cross_country") {
    tune.springs.ride_height_front = "max"
    tune.springs.ride_height_rear = "max"
  } else if (context.tuneType === "drag") {
    tune.springs.ride_height_front = "medium-high"
    tune.springs.ride_height_rear = "low"
  } else {
    // Padrão PRO: dianteira no máximo, traseira high
    tune.springs.ride_height_front = "max"
    tune.springs.ride_height_rear = "high"
  }
}

// ── Aerodinâmica (vídeos 1 e 2 + guia) ──────────────────────────────────────
// Guia: dianteira SEMPRE no máximo para evitar subesterço em curvas.
// Traseira: ~250 (medium-high) para equilibrar downforce vs arrasto em retas.
// Top speed segue a mesma base: frente no máximo e traseira alta para controle.
// Drag: minimizar tudo. Speed intent (não top_speed): manter frente, só reduzir traseira.
function applyAero(tune: TuningSetup, context: FH6VideoRuleContext) {
  if (isRoadGripTune(context)) {
    tune.aero.front = "max"
    tune.aero.rear = "high"
    return
  }

  if (context.tuneType === "top_speed") {
    // Guia: frente ainda precisa de algum downforce para controle; traseira ao mínimo
    tune.aero.front = "low"
    tune.aero.rear = shiftAero(tune.aero.rear, -4)
    return
  }

  if (context.tuneType === "drag") {
    tune.aero.front = shiftAero(tune.aero.front, -2)
    tune.aero.rear = shiftAero(tune.aero.rear, -2)
    return
  }

  if (context.intent === "speed") {
    // Guia: dianteira no máximo; só reduzir traseira para ganhar reta
    tune.aero.front = atLeastAero(tune.aero.front, "high")
    tune.aero.rear = shiftAero(tune.aero.rear, context.profile.isPowerful ? -1 : -2)
    return
  }

  if (context.intent === "cornering" || context.tuneType === "grip") {
    // Guia: dianteira SEMPRE no máximo para garantir entrada de curva
    tune.aero.front = "max"
    tune.aero.rear = atLeastAero(tune.aero.rear, "medium-high")
    return
  }

  if (context.intent === "control" || context.control === "keyboard") {
    tune.aero.front = "max"
    tune.aero.rear = atLeastAero(tune.aero.rear, "high")
    return
  }

  if (context.tuneType === "rally") {
    tune.aero.front = atLeastAero(tune.aero.front, "medium")
    tune.aero.rear = atLeastAero(tune.aero.rear, "medium")
    return
  }

  // Balanced/default para rua: frente no máximo, traseira medium-high (~250, guia)
  tune.aero.front = "max"
  tune.aero.rear = atLeastAero(tune.aero.rear, "medium-high")
}

// ── Freios (guia PRO) ────────────────────────────────────────────────────────
// Equilíbrio: 40-45% dianteiro / pressão 150% (padrão do guia).
function applyBrakes(tune: TuningSetup, context: FH6VideoRuleContext) {
  tune.brakes.balance = context.tuneType === "top_speed" ? 45 : 40
  tune.brakes.pressure = 150
}

// ── Diferencial (guia PRO) ────────────────────────────────────────────────────
// Padrão fixo: aceleração 100%, desaceleração 0%. AWD centro 70% traseira.
function rwdDifferential(): Differential {
  return { rear_accel: 100, rear_decel: 0 }
}

function fwdDifferential(): Differential {
  return { front_accel: 100, front_decel: 0, rear_accel: 100, rear_decel: 0 }
}

function awdDifferential(): Differential {
  return {
    front_accel: 100,
    front_decel: 0,
    rear_accel: 100,
    rear_decel: 0,
    center_balance: 70,
  }
}

function applyDifferential(tune: TuningSetup, context: FH6VideoRuleContext) {
  if (context.drivetrain === "FWD") {
    tune.differential = fwdDifferential()
  } else if (context.drivetrain === "AWD") {
    tune.differential = awdDifferential()
  } else {
    tune.differential = rwdDifferential()
  }
}

export function applyFH6VideoRules(tune: TuningSetup, context: FH6VideoRuleContext): TuningSetup {
  const adjusted = cloneTune(tune)

  applyTires(adjusted, context)
  applyAlignment(adjusted, context)
  applyBarsSpringsDamping(adjusted, context)
  applyAero(adjusted, context)
  applyBrakes(adjusted, context)
  applyDifferential(adjusted, context)

  return adjusted
}
