import type { Car, Drivetrain, TuneType, TuningSetup } from "@/types"
import type { CarProfile } from "./analyze"

function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max)
}

function r1(val: number): number {
  return Math.round(val * 10) / 10
}

function r2(val: number): number {
  return Math.round(val * 100) / 100
}

// Round to nearest multiple of 25 (for spring rates in lbf/in)
function r25(val: number): number {
  return Math.round(val / 25) * 25
}

// ─────────────────────────────────────────────────────────────────────────────
// PHYSICS-BASED SPRING CALCULATION
//
// Formula: spring_rate (lbf/in) = axle_weight_kg × bias × frequency_factor
//
// The frequency_factor converts kg → lbf/in and targets a spring frequency
// that suits the tune type:
//   - Cross country / rally: soft (low frequency, ≈1.0–1.4 Hz)
//   - Street / drift:        medium (≈1.8–2.4 Hz)
//   - Grip / top_speed:      stiff (≈2.5–3.5 Hz)
//   - Drag (rear):           very soft for weight transfer (≈0.8 Hz)
//
// Empirical calibration against community tunes (FH5/FH6):
//   GR Yaris 1280 kg AWD S1 street → ~575 F / ~475 R  ✓
//   BMW M3  1500 kg RWD  A  grip   → ~800 F / ~700 R  ✓
//   Previa  2100 kg AWD  B  rally  → ~520 F / ~480 R  ✓
// ─────────────────────────────────────────────────────────────────────────────
const SPRING_FACTORS: Record<TuneType, { f: number; r: number }> = {
  street:        { f: 0.86, r: 0.78 },
  grip:          { f: 1.06, r: 0.96 },
  drift:         { f: 0.90, r: 0.70 },  // stiffer front for initiation
  drag:          { f: 0.68, r: 0.52 },  // soft rear for weight transfer
  rally:         { f: 0.58, r: 0.55 },
  cross_country: { f: 0.42, r: 0.40 },
  top_speed:     { f: 0.96, r: 0.88 },
}

function calcSprings(
  car: Car,
  tuneType: TuneType,
  drivetrain: Drivetrain,
): { front: number; rear: number } {
  // Estimate front/rear weight bias based on drivetrain layout
  const frontBias =
    drivetrain === "AWD" ? 0.52 :
    drivetrain === "RWD" ? 0.45 : 0.62

  const { f: ff, r: rf } = SPRING_FACTORS[tuneType]

  const frontAxle = car.weight_kg * frontBias
  const rearAxle  = car.weight_kg * (1 - frontBias)

  return {
    front: clamp(r25(frontAxle * ff), 100, 2000),
    rear:  clamp(r25(rearAxle  * rf), 100, 2000),
  }
}

// ARBs are proportional to springs, scaled to the in-game 1–65 range.
// ARB ≈ spring_rate × 0.045 (front) / × 0.042 (rear)
function calcARBs(springs: { front: number; rear: number }): { front: number; rear: number } {
  return {
    front: r1(clamp(springs.front * 0.045, 5, 65)),
    rear:  r1(clamp(springs.rear  * 0.042, 5, 65)),
  }
}

// Dampers target ~65 % of critical damping for rebound, ~60 % of rebound for bump.
// In-game damper scale: 1–20.
// Empirical coefficient: rebound = spring × 0.015
function calcDampers(springs: { front: number; rear: number }): {
  rebound_front: number; rebound_rear: number
  bump_front: number;    bump_rear: number
} {
  const rf = r1(clamp(springs.front * 0.0150, 3, 18))
  const rr = r1(clamp(springs.rear  * 0.0150, 3, 18))
  return {
    rebound_front: rf,
    rebound_rear:  rr,
    bump_front:    r1(rf * 0.60),
    bump_rear:     r1(rr * 0.60),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ALIGNMENT PRESETS — these are style choices, not physics. They stay fixed
// per tune type but get small drivetrain-specific corrections.
// ─────────────────────────────────────────────────────────────────────────────
const ALIGNMENT_PRESETS: Record<TuneType, {
  camber_front: number; camber_rear: number
  toe_front: number;    toe_rear: number
  caster: number
}> = {
  street:        { camber_front: -2.0, camber_rear: -1.3, toe_front:  0.0, toe_rear:  0.1, caster: 6.0 },
  grip:          { camber_front: -2.5, camber_rear: -1.5, toe_front: -0.1, toe_rear:  0.1, caster: 6.5 },
  drift:         { camber_front: -4.2, camber_rear: -1.0, toe_front:  0.5, toe_rear:  0.1, caster: 7.0 },
  drag:          { camber_front: -0.5, camber_rear: -0.3, toe_front:  0.0, toe_rear:  0.0, caster: 5.0 },
  rally:         { camber_front: -1.5, camber_rear: -0.8, toe_front:  0.1, toe_rear:  0.0, caster: 5.8 },
  cross_country: { camber_front: -1.0, camber_rear: -0.5, toe_front:  0.0, toe_rear:  0.0, caster: 5.5 },
  top_speed:     { camber_front: -1.0, camber_rear: -0.5, toe_front:  0.0, toe_rear:  0.0, caster: 5.5 },
}

// ─────────────────────────────────────────────────────────────────────────────
// TIRE PRESSURE PRESETS — vary by tune type and surface
// ─────────────────────────────────────────────────────────────────────────────
const TIRE_PRESETS: Record<TuneType, { front: number; rear: number }> = {
  street:        { front: 28.0, rear: 28.5 },
  grip:          { front: 27.5, rear: 28.0 },
  drift:         { front: 30.0, rear: 38.0 },
  drag:          { front: 30.0, rear: 26.0 },
  rally:         { front: 22.0, rear: 23.0 },
  cross_country: { front: 21.0, rear: 22.0 },
  top_speed:     { front: 29.5, rear: 29.5 },
}

// ─────────────────────────────────────────────────────────────────────────────
// GEAR RATIO PRESETS — per tune type. Final drive is later scaled by power.
// ─────────────────────────────────────────────────────────────────────────────
const GEARING_PRESETS: Record<TuneType, TuningSetup["gearing"]> = {
  street:        { final_drive: 3.70, gear_1: 3.10, gear_2: 2.20, gear_3: 1.65, gear_4: 1.30, gear_5: 1.05, gear_6: 0.85 },
  grip:          { final_drive: 3.90, gear_1: 3.10, gear_2: 2.20, gear_3: 1.65, gear_4: 1.30, gear_5: 1.05, gear_6: 0.85 },
  drift:         { final_drive: 3.90, gear_1: 3.00, gear_2: 2.10, gear_3: 1.60, gear_4: 1.25, gear_5: 1.00, gear_6: 0.82 },
  drag:          { final_drive: 4.20, gear_1: 2.80, gear_2: 2.10, gear_3: 1.75, gear_4: 1.45, gear_5: 1.20, gear_6: 1.00 },
  rally:         { final_drive: 3.50, gear_1: 3.20, gear_2: 2.30, gear_3: 1.75, gear_4: 1.40, gear_5: 1.15, gear_6: 0.95 },
  cross_country: { final_drive: 3.20, gear_1: 3.40, gear_2: 2.50, gear_3: 1.90, gear_4: 1.50, gear_5: 1.20, gear_6: 1.00 },
  top_speed:     { final_drive: 2.80, gear_1: 3.50, gear_2: 2.60, gear_3: 2.00, gear_4: 1.60, gear_5: 1.30, gear_6: 1.05 },
}

// ─────────────────────────────────────────────────────────────────────────────
// BRAKE PRESETS — per tune type
// ─────────────────────────────────────────────────────────────────────────────
const BRAKE_PRESETS: Record<TuneType, { balance: number; pressure: number }> = {
  street:        { balance: 50, pressure: 105 },
  grip:          { balance: 50, pressure: 110 },
  drift:         { balance: 48, pressure: 115 },
  drag:          { balance: 52, pressure:  95 },
  rally:         { balance: 50, pressure:  95 },
  cross_country: { balance: 50, pressure:  90 },
  top_speed:     { balance: 50, pressure: 100 },
}

// ─────────────────────────────────────────────────────────────────────────────
// AERO PRESETS — per tune type
// ─────────────────────────────────────────────────────────────────────────────
const AERO_PRESETS: Record<TuneType, TuningSetup["aero"]> = {
  street:        { front: "medium",      rear: "medium-high" },
  grip:          { front: "high",        rear: "high"        },
  drift:         { front: "low",         rear: "low"         },
  drag:          { front: "min",         rear: "low"         },
  rally:         { front: "medium",      rear: "medium"      },
  cross_country: { front: "low",         rear: "low"         },
  top_speed:     { front: "min",         rear: "min"         },
}

// ─────────────────────────────────────────────────────────────────────────────
// DIFFERENTIAL PRESETS — per drivetrain × tune type
// ─────────────────────────────────────────────────────────────────────────────
function baseDifferential(
  tuneType: TuneType,
  drivetrain: Drivetrain,
): TuningSetup["differential"] {
  if (drivetrain === "FWD") {
    return { front_accel: 30, front_decel: 10, rear_accel: 0, rear_decel: 0 }
  }
  if (drivetrain === "RWD") {
    const accel: Record<TuneType, number> = {
      street: 65, grip: 70, drift: 95, drag: 85, rally: 60, cross_country: 55, top_speed: 60,
    }
    const decel: Record<TuneType, number> = {
      street: 20, grip: 25, drift: 85, drag: 30, rally: 20, cross_country: 20, top_speed: 15,
    }
    return { rear_accel: accel[tuneType], rear_decel: decel[tuneType] }
  }
  // AWD
  const rAccel: Record<TuneType, number> = {
    street: 65, grip: 70, drift: 75, drag: 85, rally: 70, cross_country: 75, top_speed: 60,
  }
  const rDecel: Record<TuneType, number> = {
    street: 20, grip: 25, drift: 30, drag: 30, rally: 25, cross_country: 30, top_speed: 15,
  }
  const center: Record<TuneType, number> = {
    street: 70, grip: 72, drift: 60, drag: 75, rally: 65, cross_country: 58, top_speed: 65,
  }
  return {
    front_accel: 25, front_decel: 5,
    rear_accel: rAccel[tuneType],
    rear_decel: rDecel[tuneType],
    center_balance: center[tuneType],
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RIDE HEIGHT PRESETS — per tune type
// ─────────────────────────────────────────────────────────────────────────────
const RIDE_HEIGHT: Record<TuneType, { front: TuningSetup["springs"]["ride_height_front"]; rear: TuningSetup["springs"]["ride_height_rear"] }> = {
  street:        { front: "low",          rear: "low"        },
  grip:          { front: "low",          rear: "low"        },
  drift:         { front: "low",          rear: "medium-low" },
  drag:          { front: "medium-high",  rear: "low"        },
  rally:         { front: "medium-high",  rear: "high"       },
  cross_country: { front: "max",          rear: "max"        },
  top_speed:     { front: "low",          rear: "low"        },
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT — builds a complete TuningSetup from physics + car data
// ─────────────────────────────────────────────────────────────────────────────
export function buildTune(
  car: Car,
  profile: CarProfile,
  tuneType: TuneType,
  targetDrivetrain: Drivetrain,
): TuningSetup {
  const springs = calcSprings(car, tuneType, targetDrivetrain)
  const arbs    = calcARBs(springs)
  const dampers = calcDampers(springs)
  const rh      = RIDE_HEIGHT[tuneType]
  const diff    = baseDifferential(tuneType, targetDrivetrain)
  const gearing = { ...GEARING_PRESETS[tuneType] }

  // Scale final drive by power: more power → shorter final drive for quicker acceleration
  const ptw = car.power_hp / car.weight_kg
  if (ptw > 0.35) gearing.final_drive = r2(gearing.final_drive * (1 - (ptw - 0.35) * 0.12))
  if (ptw < 0.18) gearing.final_drive = r2(gearing.final_drive * (1 + (0.18 - ptw) * 0.15))
  gearing.final_drive = clamp(r2(gearing.final_drive), 2.20, 5.50)

  // Tire pressure — heavier cars need slightly more pressure
  const tires = { ...TIRE_PRESETS[tuneType] }
  if (profile.isHeavy) {
    tires.front = r1(tires.front + 1.0)
    tires.rear  = r1(tires.rear  + 1.5)
  }
  if (profile.isLight) {
    tires.front = r1(tires.front - 0.5)
    tires.rear  = r1(tires.rear  - 0.5)
  }

  // Alignment — start from preset, then apply drivetrain correction
  const alignment = { ...ALIGNMENT_PRESETS[tuneType] }
  if (targetDrivetrain === "FWD") {
    alignment.camber_front = r1(clamp(alignment.camber_front - 0.3, -5.0, 0))
  }

  // Brakes — heavier cars need more pressure
  const brakes = { ...BRAKE_PRESETS[tuneType] }
  if (profile.isHeavy) brakes.pressure = clamp(brakes.pressure + 10, 60, 150)

  // Differential power adjustments
  const differential = { ...diff }
  if (profile.isPowerful && differential.rear_accel !== undefined) {
    differential.rear_accel = clamp(differential.rear_accel - 8, 15, 100)
  }
  // Muscle car drag special case
  if (profile.isMuscle && tuneType === "drag") {
    differential.rear_accel = 90
  }

  return {
    tires,
    gearing,
    alignment,
    antiroll_bars: arbs,
    springs: {
      front: springs.front,
      rear:  springs.rear,
      ride_height_front: rh.front,
      ride_height_rear:  rh.rear,
    },
    damping: dampers,
    aero:    AERO_PRESETS[tuneType],
    brakes,
    differential,
  }
}

// Keep legacy export name so generator.ts import doesn't break during transition
export { buildTune as adaptTuneToCar }
export function getPresetTune(_tuneType: TuneType): TuningSetup {
  throw new Error("getPresetTune is deprecated — use buildTune instead")
}
