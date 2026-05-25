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
const HIGH_CLASSES = new Set<CarClass>(["S2", "R", "X"])
const MID_HIGH_CLASSES = new Set<CarClass>(["A", "S1"])

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

// ── Pressão de pneus em Bar (vídeo 2) ───────────────────────────────────────
// Original/Rua/Esportivo: 1,8–1,9 bar | Rally: 1,9–2,1 | Slick/Semi/Drift: 2,1–2,3 | Off-road: 1,0–1,4
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

  const slickLike = HIGH_CLASSES.has(context.targetClass) || context.tuneType === "grip"
  const base = slickLike ? 2.2 : MID_HIGH_CLASSES.has(context.targetClass) ? 2.0 : 1.85
  let front = base
  let rear = base

  if (context.intent === "cornering" || context.intent === "control") {
    front -= 0.05
    rear -= 0.05
  }
  if (context.intent === "speed") {
    front += 0.05
    rear += 0.05
  }
  if (context.intent === "acceleration") {
    front += 0.05
    rear -= 0.1
  }
  if (context.profile.isHeavy) {
    front += 0.05
    rear += 0.05
  }

  return { front, rear, min: slickLike ? 2.1 : 1.8, max: slickLike ? 2.3 : 2.1 }
}

function applyTires(tune: TuningSetup, context: FH6VideoRuleContext) {
  const pressure = tirePressureBar(context)
  tune.tires.front = psiFromBar(clamp(pressure.front, pressure.min, pressure.max))
  tune.tires.rear = psiFromBar(clamp(pressure.rear, pressure.min, pressure.max))
}

// ── Alinhamento (vídeo 2) ────────────────────────────────────────────────────
// Cambagem: sempre negativa 0 a -2°. RWD: mais negativa na frente. FWD: mais negativa atrás. AWD: similar.
// Caster: sempre 7 (máximo).
function applyAlignment(tune: TuningSetup, context: FH6VideoRuleContext) {
  let camberFront = context.drivetrain === "FWD" ? -1.05 : context.drivetrain === "AWD" ? -1.2 : -1.45
  let camberRear = context.drivetrain === "FWD" ? -1.35 : context.drivetrain === "AWD" ? -1.15 : -0.95

  if (context.intent === "cornering" || context.tuneType === "grip") {
    camberFront -= 0.25
    camberRear -= 0.15
  }
  if (context.intent === "speed" || context.tuneType === "top_speed") {
    camberFront += 0.35
    camberRear += 0.25
  }
  if (context.tuneType === "drift") {
    camberFront = -2.0
    camberRear = -1.0
  }

  tune.alignment.camber_front = r1(clamp(camberFront, -2, 0))
  tune.alignment.camber_rear = r1(clamp(camberRear, -2, 0))

  const frontToe =
    context.intent === "cornering" ? -0.1 :
    context.drivetrain === "FWD" ? -0.1 :
    0
  const rearToe =
    context.intent === "control" || context.control === "keyboard" ? 0.2 :
    context.intent === "cornering" ? 0.1 :
    context.tuneType === "drift" ? 0 :
    0.1

  tune.alignment.toe_front = r1(clamp(frontToe, -0.3, 0.3))
  tune.alignment.toe_rear = r1(clamp(rearToe, -0.3, 0.3))
  tune.alignment.caster = 7
}

// ── ARBs, molas e damping (vídeo 2) ─────────────────────────────────────────
// Meta agressivo: 1 frente / 65 traseira. Normal: equilíbrio 0,55–0,60.
// Bump: 3–7. Rebound: 12–20. Rebound sempre maior que bump.
// Altura: mais alto tende a mais grip no Forza; rally/terra sempre no máximo.
function applyBarsSpringsDamping(tune: TuningSetup, context: FH6VideoRuleContext) {
  if (context.style === "meta" && context.intent !== "control" && context.tuneType !== "rally" && context.tuneType !== "drift") {
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

  tune.damping.rebound_front = r1(clamp(tune.damping.rebound_front, 12, 20))
  tune.damping.rebound_rear = r1(clamp(tune.damping.rebound_rear, 12, 20))
  tune.damping.bump_front = r1(clamp(tune.damping.bump_front, 3, 7))
  tune.damping.bump_rear = r1(clamp(tune.damping.bump_rear, 3, 7))

  if (tune.damping.rebound_front <= tune.damping.bump_front) tune.damping.rebound_front = r1(tune.damping.bump_front + 9)
  if (tune.damping.rebound_rear <= tune.damping.bump_rear) tune.damping.rebound_rear = r1(tune.damping.bump_rear + 9)

  if (context.tuneType === "rally" || context.tuneType === "cross_country") {
    tune.springs.ride_height_front = "max"
    tune.springs.ride_height_rear = "max"
  } else if (context.tuneType === "drag") {
    tune.springs.ride_height_front = "medium-high"
    tune.springs.ride_height_rear = "low"
  } else if (context.intent === "cornering" || context.intent === "control" || context.tuneType === "grip") {
    tune.springs.ride_height_front = "high"
    tune.springs.ride_height_rear = "high"
  } else if (context.intent === "speed" || context.tuneType === "top_speed") {
    tune.springs.ride_height_front = "low"
    tune.springs.ride_height_rear = "medium-low"
  } else {
    tune.springs.ride_height_front = "medium-high"
    tune.springs.ride_height_rear = "medium-high"
  }
}

// ── Aerodinâmica (vídeos 1 e 2) ─────────────────────────────────────────────
// Mais downforce = mais curvas, menos velocidade. Menos = mais velocidade.
// Dianteiro levemente mais alto que traseiro é o equilíbrio base.
function applyAero(tune: TuningSetup, context: FH6VideoRuleContext) {
  if (context.intent === "speed" || context.tuneType === "top_speed" || context.tuneType === "drag") {
    tune.aero.front = shiftAero(tune.aero.front, -2)
    tune.aero.rear = shiftAero(tune.aero.rear, context.profile.isPowerful ? -1 : -2)
    return
  }

  if (context.intent === "cornering" || context.tuneType === "grip") {
    tune.aero.front = atLeastAero(tune.aero.front, "high")
    tune.aero.rear = atLeastAero(tune.aero.rear, "medium-high")
    return
  }

  if (context.intent === "control" || context.control === "keyboard") {
    tune.aero.front = atLeastAero(tune.aero.front, "medium-high")
    tune.aero.rear = atLeastAero(tune.aero.rear, "high")
    return
  }

  if (context.tuneType === "rally") {
    tune.aero.front = atLeastAero(tune.aero.front, "medium")
    tune.aero.rear = atLeastAero(tune.aero.rear, "medium")
  }
}

// ── Freios (vídeo 2) ─────────────────────────────────────────────────────────
// Balance: 50–55% dianteiro. Pressure: 100%.
function applyBrakes(tune: TuningSetup, context: FH6VideoRuleContext) {
  tune.brakes.balance = clamp(context.intent === "control" ? 53 : 52, 50, 55)
  tune.brakes.pressure = 100
}

// ── Diferencial (vídeo 2) ────────────────────────────────────────────────────
// RWD: 50–60% acel / 10–20% desacel. FWD/AWD: acel alto (80–95%) / desacel baixo (5–15%).
// AWD centro: 60–90% traseira.
function rwdDifferential(context: FH6VideoRuleContext): Differential {
  if (context.tuneType === "drift") return { rear_accel: 85, rear_decel: 70 }
  if (context.tuneType === "drag" || context.intent === "acceleration") return { rear_accel: 65, rear_decel: 10 }
  if (context.intent === "control" || context.control === "keyboard") return { rear_accel: 45, rear_decel: 10 }
  if (context.intent === "speed" || context.tuneType === "top_speed") return { rear_accel: 50, rear_decel: 12 }
  return { rear_accel: 55, rear_decel: 15 }
}

function fwdDifferential(context: FH6VideoRuleContext): Differential {
  const accel = context.intent === "acceleration" || context.tuneType === "drag" ? 92 : 85
  return { front_accel: accel, front_decel: 10, rear_accel: 0, rear_decel: 0 }
}

function awdDifferential(context: FH6VideoRuleContext): Differential {
  const center =
    context.intent === "acceleration" || context.tuneType === "drag" ? 78 :
    context.intent === "control" ? 62 :
    context.intent === "speed" || context.tuneType === "top_speed" ? 60 :
    context.intent === "cornering" || context.tuneType === "grip" ? 70 :
    68

  return {
    front_accel: context.intent === "control" ? 80 : 88,
    front_decel: 8,
    rear_accel: context.intent === "control" ? 85 : 92,
    rear_decel: 10,
    center_balance: clamp(center, 60, 90),
  }
}

function applyDifferential(tune: TuningSetup, context: FH6VideoRuleContext) {
  if (context.drivetrain === "FWD") {
    tune.differential = fwdDifferential(context)
  } else if (context.drivetrain === "AWD") {
    tune.differential = awdDifferential(context)
  } else {
    tune.differential = rwdDifferential(context)
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
