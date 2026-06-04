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

// ── Pressão de pneus em Bar (vídeo 2 + guia rua/estrada) ────────────────────
// Ponto de partida: 2,0 bar F/T para rua/estrada (guia). Slick/alto PI: 2,1–2,3.
// Top speed: ligeiramente mais alto para reduzir atrito de rolamento.
// Pressão traseira +0,05 bar para FWD/AWD pesado → induz sobresterço leve.
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
    return { front: 2.1, rear: 2.1, min: 1.9, max: 2.3 }
  }

  // Rua/grip/estrada: ponto de partida 2,0 bar para todas as classes (guia)
  const slickLike = HIGH_CLASSES.has(context.targetClass) || context.tuneType === "grip"
  const base = slickLike ? 2.2 : 2.0
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
  // FWD ou AWD pesado: traseira ligeiramente mais alta induz rotação (guia)
  if (context.drivetrain === "FWD" || (context.drivetrain === "AWD" && context.profile.isHeavy)) {
    rear += 0.05
  }

  return { front, rear, min: slickLike ? 2.1 : 1.9, max: slickLike ? 2.3 : 2.2 }
}

function applyTires(tune: TuningSetup, context: FH6VideoRuleContext) {
  const pressure = tirePressureBar(context)
  tune.tires.front = psiFromBar(clamp(pressure.front, pressure.min, pressure.max))
  tune.tires.rear = psiFromBar(clamp(pressure.rear, pressure.min, pressure.max))
}

// ── Alinhamento (vídeo 2 + guia) ─────────────────────────────────────────────
// Ponto de partida: 0,0° para tudo. Caster 7,0°.
// Top speed: manter cambagem próxima de 0,0° para maximizar área de contato em reta.
// Validar com telemetria: temp interna ≤ externa → cambagem ok.
function applyAlignment(tune: TuningSetup, context: FH6VideoRuleContext) {
  // Top speed: guia diz manter cambagem próxima de 0,0° na reta
  if (context.tuneType === "top_speed") {
    tune.alignment.camber_front = -0.3
    tune.alignment.camber_rear = -0.2
    tune.alignment.toe_front = 0
    tune.alignment.toe_rear = 0
    tune.alignment.caster = 7
    return
  }

  let camberFront = context.drivetrain === "FWD" ? -1.05 : context.drivetrain === "AWD" ? -1.2 : -1.45
  let camberRear = context.drivetrain === "FWD" ? -1.35 : context.drivetrain === "AWD" ? -1.15 : -0.95

  if (context.intent === "cornering" || context.tuneType === "grip") {
    camberFront -= 0.25
    camberRear -= 0.15
  }
  if (context.intent === "speed") {
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

// ── ARBs, molas e damping (vídeo 2 + guia) ──────────────────────────────────
// Meta: 1F / 65T. Normal: equilíbrio 0,55–0,60.
// Rebound: ponto de partida 9–10 (guia); traseiro +1 para melhor rotação em curva.
// Bump: manter baixo ~3 para não perder estabilidade em zebras/ondulações (guia).
// Altura: dianteira no máximo, traseira ligeiramente mais baixa para grip (guia).
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

  // Rebound: mínimo 9 (guia diz 9–10 como ponto de partida, antes era 12)
  tune.damping.rebound_front = r1(clamp(tune.damping.rebound_front, 9, 20))
  // Traseiro +1 em relação ao dianteiro para melhor rotação em curvas (guia)
  tune.damping.rebound_rear = r1(clamp(tune.damping.rebound_rear + 1, 9, 20))
  // Bump baixo (~3) para absorção de irregularidades sem perder estabilidade (guia)
  tune.damping.bump_front = r1(clamp(tune.damping.bump_front, 3, 5))
  tune.damping.bump_rear = r1(clamp(tune.damping.bump_rear, 3, 5))

  if (tune.damping.rebound_front <= tune.damping.bump_front) tune.damping.rebound_front = r1(tune.damping.bump_front + 6)
  if (tune.damping.rebound_rear <= tune.damping.bump_rear) tune.damping.rebound_rear = r1(tune.damping.bump_rear + 6)

  if (context.tuneType === "rally" || context.tuneType === "cross_country") {
    tune.springs.ride_height_front = "max"
    tune.springs.ride_height_rear = "max"
  } else if (context.tuneType === "drag") {
    tune.springs.ride_height_front = "medium-high"
    tune.springs.ride_height_rear = "low"
  } else if (context.intent === "speed" || context.tuneType === "top_speed") {
    tune.springs.ride_height_front = "low"
    tune.springs.ride_height_rear = "medium-low"
  } else {
    // Guia: dianteira no máximo, traseira ligeiramente mais baixa (melhora estabilidade e tração)
    tune.springs.ride_height_front = "max"
    tune.springs.ride_height_rear = "high"
  }
}

// ── Aerodinâmica (vídeos 1 e 2 + guia) ──────────────────────────────────────
// Guia: dianteira SEMPRE no máximo para evitar subesterço em curvas.
// Traseira: ~250 (medium-high) para equilibrar downforce vs arrasto em retas.
// Top speed: dianteira "low" (algum controle), traseira ao mínimo para reduzir arrasto.
// Drag: minimizar tudo. Speed intent (não top_speed): manter frente, só reduzir traseira.
function applyAero(tune: TuningSetup, context: FH6VideoRuleContext) {
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

// ── Freios (vídeo 2 + guia) ──────────────────────────────────────────────────
// Equilíbrio: ~55% dianteiro (45% traseiro, guia). Traseiro ajuda entrada de curva.
// Pressão: 130% como ponto de partida (guia recomenda ~150% como ajuste pessoal).
function applyBrakes(tune: TuningSetup, context: FH6VideoRuleContext) {
  tune.brakes.balance = clamp(
    context.intent === "control" ? 53 :
    context.tuneType === "top_speed" ? 52 :
    55,
    45, 65
  )
  tune.brakes.pressure = 130
}

// ── Diferencial (vídeo 2 + guia) ────────────────────────────────────────────
// Guia: aceleração 100% / desaceleração 0% (ou 2–4%) como ponto de partida.
// AWD centro: 70–80% traseira. Se travar em curva lenta, aumentar decel traseiro.
function rwdDifferential(context: FH6VideoRuleContext): Differential {
  if (context.tuneType === "drift") return { rear_accel: 85, rear_decel: 70 }
  if (context.tuneType === "drag" || context.intent === "acceleration") return { rear_accel: 78, rear_decel: 3 }
  if (context.intent === "control" || context.control === "keyboard") return { rear_accel: 50, rear_decel: 8 }
  if (context.intent === "speed" || context.tuneType === "top_speed") return { rear_accel: 65, rear_decel: 5 }
  // Default: aceleração alta (guia: 100% é ponto de partida); decel mínimo
  return { rear_accel: 78, rear_decel: 3 }
}

function fwdDifferential(context: FH6VideoRuleContext): Differential {
  const accel = context.intent === "acceleration" || context.tuneType === "drag" ? 95 : 88
  return { front_accel: accel, front_decel: 3, rear_accel: 0, rear_decel: 0 }
}

function awdDifferential(context: FH6VideoRuleContext): Differential {
  // Guia: centro 70–80% traseira
  const center =
    context.intent === "acceleration" || context.tuneType === "drag" ? 78 :
    context.intent === "control" ? 65 :
    context.intent === "speed" || context.tuneType === "top_speed" ? 70 :
    context.intent === "cornering" || context.tuneType === "grip" ? 72 :
    72

  return {
    // Guia: aceleração 100%, desaceleração 0% (ou 2–4% se travar em curvas)
    front_accel: context.intent === "control" ? 85 : 100,
    front_decel: context.intent === "control" ? 5 : 0,
    rear_accel: context.intent === "control" ? 88 : 100,
    rear_decel: context.intent === "control" ? 8 : 3,
    center_balance: clamp(center, 62, 85),
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
