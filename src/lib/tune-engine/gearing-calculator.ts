import type { AdvancedGearingInput, Drivetrain, Gearing, TuneIntent } from "@/types"

interface AdvancedGearingContext {
  base: Gearing
  intent: TuneIntent
  drivetrain: Drivetrain
  powerHp: number
  weightKg: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function r2(value: number): number {
  return Math.round(value * 100) / 100
}

function targetFirstGearSpeed(targetSpeedKmh: number, intent: TuneIntent, drivetrain: Drivetrain): number {
  const factor =
    intent === "speed" ? 0.22 :
    intent === "acceleration" ? 0.14 :
    intent === "cornering" ? 0.16 :
    intent === "control" ? 0.18 :
    0.17
  const drivetrainAdjust = drivetrain === "AWD" ? 1.06 : drivetrain === "RWD" ? 0.98 : 0.94
  return clamp(targetSpeedKmh * factor * drivetrainAdjust, 42, 95)
}

function naturalTopSpeed(powerHp: number, weightKg: number): number {
  const powerToWeight = powerHp / Math.max(weightKg, 1)
  return clamp(175 + Math.sqrt(powerToWeight) * 175, 170, 440)
}

function finalGearRatio(intent: TuneIntent, numberOfGears: number): number {
  const base =
    intent === "speed" ? 0.66 :
    intent === "acceleration" ? 0.92 :
    intent === "cornering" ? 0.86 :
    intent === "control" ? 0.80 :
    0.78

  return clamp(base + (6 - numberOfGears) * 0.04, 0.58, 1.12)
}

function makeGearing(finalDrive: number, ratios: number[]): Gearing {
  return {
    final_drive: r2(finalDrive),
    gear_1: r2(ratios[0]),
    gear_2: r2(ratios[1]),
    gear_3: r2(ratios[2]),
    gear_4: r2(ratios[3]),
    gear_5: r2(ratios[4]),
    gear_6: r2(ratios[5]),
    ...(ratios[6] !== undefined ? { gear_7: r2(ratios[6]) } : {}),
    ...(ratios[7] !== undefined ? { gear_8: r2(ratios[7]) } : {}),
    ...(ratios[8] !== undefined ? { gear_9: r2(ratios[8]) } : {}),
    ...(ratios[9] !== undefined ? { gear_10: r2(ratios[9]) } : {}),
  }
}

export function calculateAdvancedGearing(
  input: AdvancedGearingInput,
  context: AdvancedGearingContext,
): Gearing {
  const gears = Math.round(clamp(input.number_of_gears, 6, 10))
  const targetSpeed = clamp(input.target_speed_kmh, 120, 520)
  const first = clamp(input.current_first_gear ?? context.base.gear_1, 2.2, 4.2)
  const currentFinal = clamp(input.current_final_drive ?? context.base.final_drive, 2.2, 5.5)
  const desiredFirstSpeed = targetFirstGearSpeed(targetSpeed, context.intent, context.drivetrain)
  const naturalSpeed = naturalTopSpeed(context.powerHp, context.weightKg)
  const topSpeedFactor = clamp(targetSpeed / naturalSpeed, 0.72, 1.42)
  const rpmFactor = clamp(input.redline_rpm / 7500, 0.78, 1.25)

  let finalDrive = (currentFinal / topSpeedFactor) * rpmFactor

  if (input.first_gear_speed_kmh && input.first_gear_speed_kmh > 10) {
    finalDrive = currentFinal * clamp(input.first_gear_speed_kmh / desiredFirstSpeed, 0.62, 1.55)
  }

  if (context.intent === "speed") finalDrive *= 0.94
  if (context.intent === "acceleration" || context.intent === "cornering") finalDrive *= 1.06
  if (context.intent === "control") finalDrive *= 0.98

  finalDrive = clamp(finalDrive, 2.2, 5.5)

  let last = finalGearRatio(context.intent, gears)
  if (input.first_gear_speed_kmh && targetSpeed > input.first_gear_speed_kmh) {
    last = clamp(first * (input.first_gear_speed_kmh / targetSpeed), 0.52, 1.18)
  }

  const ratios = Array.from({ length: gears }, (_, index) => {
    const t = gears === 1 ? 0 : index / (gears - 1)
    return first * Math.pow(last / first, t)
  })

  // Keep 1st/2nd less violent on high power RWD/FWD builds.
  if (context.powerHp > 700 && context.drivetrain !== "AWD") {
    ratios[0] *= 0.93
    ratios[1] *= 0.96
  }

  return makeGearing(finalDrive, ratios)
}
