import type { Car, CarClass, Drivetrain, Parts, TuneType } from "@/types"
import type { CarProfile } from "./analyze"

// 1 = D/C class (light upgrade), 2 = B/A (medium), 3 = S1/S2 (full race), 4 = R/X (extreme)
type Depth = 1 | 2 | 3 | 4

const CLASS_DEPTH: Record<CarClass, Depth> = {
  D: 1, C: 1, B: 2, A: 2, S1: 3, S2: 3, R: 4, X: 4,
}

function engineParts(car: Car, depth: Depth): string[] {
  if (car.aspiration === "Electric") {
    return depth >= 3
      ? ["Race Battery", "Race Motor", "Race Inverter"]
      : ["Sport Battery", "Sport Motor"]
  }

  const parts: string[] = []

  // Intake
  parts.push(depth === 1 ? "Sport Intake" : "Race Intake")

  // Exhaust
  parts.push(depth === 1 ? "Sport Exhaust" : "Race Exhaust")

  // Forced induction — based on car's aspiration
  if (car.aspiration === "Turbo") {
    if (depth === 1) {
      parts.push("Sport Turbo")
    } else if (depth === 2) {
      parts.push("Race Turbo", "Race Intercooler")
    } else {
      parts.push("Race Turbo", "Race Intercooler", "Race Fuel System")
    }
  } else if (car.aspiration === "Supercharged") {
    if (depth === 1) {
      parts.push("Sport Supercharger")
    } else if (depth === 2) {
      parts.push("Race Supercharger", "Race Intercooler")
    } else {
      parts.push("Race Supercharger", "Race Intercooler", "Race Fuel System")
    }
  } else {
    // NA — compensate with more internal upgrades
    if (depth >= 2) parts.push("Race Camshaft", "Race Valves")
    if (depth >= 3) parts.push("Race Ignition", "Race Displacement")
  }

  // Engine internals for serious builds
  if (depth === 3) parts.push("Race Pistons", "Race Flywheel")
  if (depth === 4) parts.push("Race Pistons", "Race Flywheel", "Race Engine Block")

  // Unique items — remove duplicates (NA depth 3 would add Pistons twice without this)
  return [...new Set(parts)]
}

function platformParts(tuneType: TuneType, depth: Depth): string[] {
  const weightReduction = depth >= 3 ? "Race Weight Reduction" : "Sport Weight Reduction"

  if (tuneType === "drift") {
    return ["Drift Suspension", "Drift Anti-Roll Bars", "Race Brakes", weightReduction]
  }
  if (tuneType === "rally") {
    return ["Rally Suspension", "Rally Anti-Roll Bars", "Race Brakes", weightReduction]
  }
  if (tuneType === "cross_country") {
    return ["Off-Road Suspension", "Off-Road Anti-Roll Bars", "Race Brakes", weightReduction]
  }

  if (depth === 1) {
    return ["Sport Brakes", "Sport Springs & Dampers", "Sport Anti-Roll Bars"]
  }
  return [
    "Race Brakes",
    "Race Springs & Dampers",
    "Race Anti-Roll Bars",
    weightReduction,
  ]
}

function drivetrainParts(tuneType: TuneType, depth: Depth): string[] {
  const diff =
    tuneType === "drift" ? "Drift Differential" : depth === 1 ? "Sport Differential" : "Race Differential"
  const trans = depth === 1 ? "Sport Transmission" : "Race Transmission"
  const clutch = depth === 1 ? "Sport Clutch" : "Race Clutch"

  const parts = [trans, diff, clutch]
  if (depth >= 3) parts.push("Race Driveline")
  return parts
}

function tireParts(tuneType: TuneType, depth: Depth): string[] {
  switch (tuneType) {
    case "drag":
      return ["Drag Tires", "Max Width Rear Tires", "Stock Front Tire Width"]
    case "drift":
      return ["Drift Tires", "Max Width Rear Tires", "Stock Front Tire Width"]
    case "rally":
      return ["Rally Tires", "+1 Rear Tire Width"]
    case "cross_country":
      return ["Off-Road Tires", "Max Width Rear Tires", "Max Width Front Tires"]
    case "grip":
      return ["Semi-Slick Tires", "Max Width Rear Tires", "+1 Front Tire Width"]
    case "top_speed":
      return [
        depth >= 3 ? "Semi-Slick Tires" : "Sport Tires",
        "+1 Rear Tire Width",
      ]
    default: // street
      return [
        depth >= 3 ? "Semi-Slick Tires" : "Sport Tires",
        "+1 Rear Tire Width",
        "+1 Front Tire Width",
      ]
  }
}

function aeroParts(tuneType: TuneType): string[] {
  switch (tuneType) {
    case "grip":    return ["Front Splitter (High)", "Adjustable Rear Wing"]
    case "drag":    return []
    case "drift":   return ["Front Bumper Aero", "Rear Spoiler (Low)"]
    case "rally":   return ["Adjustable Front Bumper", "Adjustable Rear Wing (Medium)"]
    case "cross_country": return []
    case "top_speed": return ["Front Splitter (Low)", "Rear Wing (Low)"]
    default:        return ["Adjustable Rear Wing"]
  }
}

export function selectParts(
  car: Car,
  profile: CarProfile,
  tuneType: TuneType,
  targetDrivetrain: Drivetrain,
  targetClass: CarClass,
): Parts {
  const needsConversion = targetDrivetrain !== car.drivetrain
  const conversionParts: string[] = needsConversion ? [`${targetDrivetrain} Conversion`] : []

  const depth = CLASS_DEPTH[targetClass]

  return {
    engine:     engineParts(car, depth),
    platform:   platformParts(tuneType, depth),
    drivetrain: [...conversionParts, ...drivetrainParts(tuneType, depth)],
    tires:      tireParts(tuneType, depth),
    aero:       aeroParts(tuneType),
  }
}
