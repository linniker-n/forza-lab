import type { Car, CarClass, DifficultyLevel, Drivetrain, DrivingStyle, TuneIntent, TuneType, TuningSetup } from "@/types"
import type { CarProfile } from "./analyze"
import { findForzaTuneCalibration } from "./forzatune-calibration"
import { getTrackProfileDemand } from "./fh6-track-profiles"

interface PrecisionContext {
  car: Car
  profile: CarProfile
  tuneType: TuneType
  drivetrain: Drivetrain
  targetClass: CarClass
  intent: TuneIntent
  style: DrivingStyle
  difficulty: DifficultyLevel
}

const AERO_LEVELS: TuningSetup["aero"]["front"][] = ["min", "low", "medium", "medium-high", "high", "max"]
const CLASS_LOAD: Record<CarClass, number> = {
  D: 0.72,
  C: 0.82,
  B: 0.92,
  A: 1,
  S1: 1.12,
  S2: 1.24,
  R: 1.3,
  X: 1.38,
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

function scaleSprings(tune: TuningSetup, front: number, rear: number) {
  tune.springs.front = r1(clamp(tune.springs.front * front, 80, 1925))
  tune.springs.rear = r1(clamp(tune.springs.rear * rear, 80, 1925))
}

function scaleBars(tune: TuningSetup, front: number, rear: number) {
  tune.antiroll_bars.front = r1(clamp(tune.antiroll_bars.front * front, 3, 65))
  tune.antiroll_bars.rear = r1(clamp(tune.antiroll_bars.rear * rear, 3, 65))
}

function scaleDamping(tune: TuningSetup, front: number, rear: number) {
  tune.damping.rebound_front = r1(clamp(tune.damping.rebound_front * front, 3, 18))
  tune.damping.bump_front = r1(clamp(tune.damping.bump_front * front, 2, 12))
  tune.damping.rebound_rear = r1(clamp(tune.damping.rebound_rear * rear, 3, 18))
  tune.damping.bump_rear = r1(clamp(tune.damping.bump_rear * rear, 2, 12))
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

function applyGeometry(tune: TuningSetup, context: PrecisionContext) {
  const calibration = findForzaTuneCalibration(context.car)
  if (!calibration) return

  const strength = calibration.source === "car" ? 1 : 0.58
  const g = calibration.geometry
  const compact = clamp((0.56 - g.wheelbaseToLengthRatio) * 8, -0.35, 0.35) * strength
  const lowWide = clamp((g.widthToHeightRatio - 1.28) * 0.7, -0.25, 0.32) * strength
  const trackDelta = clamp((g.rearTrack - g.frontTrack) * 0.7, -0.12, 0.12) * strength

  if (compact > 0.05) {
    scaleBars(tune, 1 - compact * 0.12, 1 - compact * 0.22)
    scaleDamping(tune, 1, 1 - compact * 0.12)
    tune.alignment.toe_rear = r1(clamp(tune.alignment.toe_rear + compact * 0.25, -0.2, 0.45))
    tune.aero.rear = shiftAero(tune.aero.rear, compact > 0.18 ? 1 : 0)
  } else if (compact < -0.05) {
    scaleBars(tune, 1, 1 + Math.abs(compact) * 0.16)
    tune.alignment.caster = r1(clamp(tune.alignment.caster + Math.abs(compact) * 0.35, 4.5, 7))
  }

  if (lowWide > 0.05) {
    scaleSprings(tune, 1 + lowWide * 0.1, 1 + lowWide * 0.1)
    tune.alignment.camber_front = r1(clamp(tune.alignment.camber_front - lowWide * 0.45, -5, 0))
    tune.alignment.camber_rear = r1(clamp(tune.alignment.camber_rear - lowWide * 0.28, -5, 0))
  } else if (lowWide < -0.05) {
    scaleBars(tune, 1 - Math.abs(lowWide) * 0.18, 1 - Math.abs(lowWide) * 0.24)
    tune.aero.rear = shiftAero(tune.aero.rear, 1)
  }

  if (trackDelta > 0.02) {
    scaleBars(tune, 1, 1 + trackDelta)
  } else if (trackDelta < -0.02) {
    scaleBars(tune, 1 + Math.abs(trackDelta), 1)
  }

  if (calibration.engineLocation === "rear") {
    scaleBars(tune, 1.04, 0.86)
    scaleDamping(tune, 1.02, 0.9)
    tune.alignment.toe_rear = r1(clamp(tune.alignment.toe_rear + 0.12, -0.2, 0.45))
    tune.aero.rear = shiftAero(tune.aero.rear, context.intent === "speed" ? 0 : 1)
    if (tune.differential.rear_accel !== undefined) {
      tune.differential.rear_accel = clamp(tune.differential.rear_accel - 8, 15, 100)
    }
  }

  if (calibration.engineLocation === "mid") {
    scaleBars(tune, 0.98, 0.92)
    tune.alignment.toe_rear = r1(clamp(tune.alignment.toe_rear + 0.08, -0.2, 0.45))
    if (tune.differential.rear_decel !== undefined) {
      tune.differential.rear_decel = clamp(tune.differential.rear_decel - 4, 5, 100)
    }
  }
}

function applyPowerAndClass(tune: TuningSetup, context: PrecisionContext) {
  const classLoad = CLASS_LOAD[context.targetClass]
  const ptw = context.car.power_hp / Math.max(context.car.weight_kg, 1)
  const torqueLoad = context.car.torque_nm / Math.max(context.car.weight_kg, 1)
  const highTorque = clamp((torqueLoad - 0.42) * 1.6, 0, 0.45)

  scaleSprings(tune, 0.96 + classLoad * 0.04, 0.96 + classLoad * 0.04)
  scaleDamping(tune, 0.97 + classLoad * 0.03, 0.97 + classLoad * 0.03)

  if (ptw > 0.42) {
    const excess = clamp((ptw - 0.42) * 0.8, 0, 0.32)
    tune.tires.rear = r1(clamp(tune.tires.rear - 0.8 - excess, 18, 40))
    tune.gearing.final_drive = r2(clamp(tune.gearing.final_drive * (1 - excess * 0.12), 2.2, 5.5))
    scaleSprings(tune, 1, 1 - excess * 0.16)
    scaleDamping(tune, 1, 1 - excess * 0.12)
    if (tune.differential.rear_accel !== undefined) {
      tune.differential.rear_accel = clamp(tune.differential.rear_accel - 10 - Math.round(excess * 18), 15, 100)
    }
  } else if (ptw < 0.2) {
    tune.gearing.final_drive = r2(clamp(tune.gearing.final_drive * 1.08, 2.2, 5.5))
  }

  if (highTorque > 0) {
    tune.tires.rear = r1(clamp(tune.tires.rear - highTorque, 18, 40))
    if (tune.differential.rear_accel !== undefined) {
      tune.differential.rear_accel = clamp(tune.differential.rear_accel - Math.round(highTorque * 14), 15, 100)
    }
  }

  if (context.profile.isHeavy) {
    scaleSprings(tune, 1.06, 1.04)
    scaleDamping(tune, 1.06, 1.04)
    tune.brakes.pressure = clamp(tune.brakes.pressure + 6, 60, 150)
    tune.aero.rear = shiftAero(tune.aero.rear, 1)
  }
}

function applyUseCase(tune: TuningSetup, context: PrecisionContext) {
  const demand = getTrackProfileDemand(context.intent)
  const aeroDelta = Math.round((demand.aero - 0.48) * 3)
  const stiffness = 0.95 + demand.stiffness * 0.12

  if (context.intent !== "speed") {
    tune.aero.front = shiftAero(tune.aero.front, aeroDelta)
    tune.aero.rear = shiftAero(tune.aero.rear, aeroDelta)
  }
  scaleDamping(tune, stiffness, stiffness)

  if (context.tuneType === "rally" || context.tuneType === "cross_country") {
    scaleBars(tune, 0.78, 0.76)
    scaleDamping(tune, 0.88, 0.86)
    tune.tires.front = r1(clamp(tune.tires.front - 1.2, 18, 40))
    tune.tires.rear = r1(clamp(tune.tires.rear - 1.2, 18, 40))
  }

  if (context.tuneType === "drag") {
    tune.tires.front = r1(clamp(tune.tires.front + 1.2, 18, 40))
    tune.tires.rear = r1(clamp(tune.tires.rear - 1.8, 18, 40))
    scaleSprings(tune, 1.04, 0.82)
    scaleDamping(tune, 1.02, 0.8)
  }

  if (context.intent === "control") {
    scaleBars(tune, 0.92, 0.84)
    scaleDamping(tune, 0.94, 0.9)
    tune.alignment.toe_rear = r1(clamp(tune.alignment.toe_rear + 0.08, -0.2, 0.45))
  }

  if (context.intent === "speed") {
    tune.aero.front = shiftAero(tune.aero.front, -2)
    tune.aero.rear = shiftAero(tune.aero.rear, context.car.power_hp > 650 ? -1 : -2)
    tune.gearing.final_drive = r2(clamp(tune.gearing.final_drive * (0.94 - demand.speed * 0.04), 2.2, 5.5))
  }

  if (context.intent === "cornering") {
    tune.alignment.camber_front = r1(clamp(tune.alignment.camber_front - 0.18, -5, 0))
    tune.alignment.caster = r1(clamp(tune.alignment.caster + 0.2, 4.5, 7))
    scaleBars(tune, 0.96, 1.08)
  }

  if (context.intent === "acceleration") {
    tune.tires.rear = r1(clamp(tune.tires.rear - 0.8, 18, 40))
    scaleSprings(tune, 1, 0.9)
    tune.gearing.final_drive = r2(clamp(tune.gearing.final_drive * 1.04, 2.2, 5.5))
  }
}

function applyDrivetrainSafety(tune: TuningSetup, context: PrecisionContext) {
  if (context.drivetrain === "FWD") {
    tune.alignment.toe_front = r1(clamp(tune.alignment.toe_front - 0.08, -0.4, 0.4))
    scaleBars(tune, 0.9, 1.1)
    if (tune.differential.front_accel !== undefined) {
      tune.differential.front_accel = clamp(tune.differential.front_accel - 6, 5, 100)
    }
  }

  if (context.drivetrain === "RWD" && context.car.power_hp > 520) {
    tune.tires.rear = r1(clamp(tune.tires.rear - 0.6, 18, 40))
    tune.alignment.toe_rear = r1(clamp(tune.alignment.toe_rear + 0.06, -0.2, 0.45))
    if (tune.differential.rear_accel !== undefined && context.tuneType !== "drift") {
      tune.differential.rear_accel = clamp(tune.differential.rear_accel - 6, 15, 100)
    }
  }

  if (context.drivetrain === "AWD" && tune.differential.center_balance !== undefined) {
    const target =
      context.intent === "acceleration" ? 72 :
      context.intent === "control" ? 62 :
      context.intent === "speed" ? 66 :
      context.intent === "cornering" ? 70 :
      68
    tune.differential.center_balance = clamp(Math.round((tune.differential.center_balance + target) / 2), 45, 85)
  }
}

export function applyPrecisionModel(tune: TuningSetup, context: PrecisionContext): TuningSetup {
  const adjusted = cloneTune(tune)

  applyGeometry(adjusted, context)
  applyPowerAndClass(adjusted, context)
  applyUseCase(adjusted, context)
  applyDrivetrainSafety(adjusted, context)

  if (context.difficulty === "easy") {
    applyDrivetrainSafety(adjusted, { ...context, intent: "control" })
  }
  if (context.style === "meta" && context.intent !== "control") {
    scaleDamping(adjusted, 1.03, 1.03)
    adjusted.brakes.pressure = clamp(adjusted.brakes.pressure + 3, 60, 150)
  }

  return adjusted
}
