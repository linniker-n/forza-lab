import type { Car, CarClass, Drivetrain, Parts, TuneIntent, TuneType } from "@/types"
import type { CarProfile } from "./analyze"
import { getClassPiLimit } from "./classes"

// 1 = D/C class, 2 = B/A, 3 = S1/S2, 4 = R/X.
type Depth = 1 | 2 | 3 | 4
type PartCategory = keyof Parts
type EfficiencyTier = "essential" | "high" | "medium" | "low" | "ballast"

interface PartCandidate {
  name: string
  category: PartCategory
  piCost: number
  efficiencyScore: number
  tier: EfficiencyTier
}

export interface PartsSelectionPlan {
  parts: Parts
  estimatedPi: number
  piLimit: number
  budgetUsed: number
  engineSwapApplied: boolean
  skipped: string[]
  notes: string[]
}

const CLASS_DEPTH: Record<CarClass, Depth> = {
  D: 1,
  C: 1,
  B: 2,
  A: 2,
  S1: 3,
  S2: 3,
  R: 4,
  X: 4,
}

const JDM_BRANDS = new Set([
  "Toyota",
  "Nissan",
  "Honda",
  "Mazda",
  "Subaru",
  "Mitsubishi",
  "Lexus",
  "Infiniti",
  "Acura",
  "Datsun",
  "Scion",
  "Isuzu",
])
const US_BRANDS = new Set([
  "Ford",
  "Chevrolet",
  "Dodge",
  "GMC",
  "Pontiac",
  "Shelby",
  "Jeep",
  "Buick",
  "Cadillac",
  "Lincoln",
  "Plymouth",
  "Mercury",
  "RAM",
  "Chrysler",
])
const EURO_BRANDS = new Set([
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Porsche",
  "Ferrari",
  "Lamborghini",
  "Alfa Romeo",
  "Fiat",
  "Lancia",
  "Lotus",
  "McLaren",
  "Bentley",
  "Bugatti",
  "Koenigsegg",
  "Pagani",
  "Renault",
  "Peugeot",
  "Citroen",
  "Volkswagen",
  "SEAT",
  "Cupra",
  "Volvo",
])

function emptyParts(): Parts {
  return {
    engine: [],
    platform: [],
    drivetrain: [],
    tires: [],
    aero: [],
  }
}

function candidate(
  category: PartCategory,
  name: string,
  piCost: number,
  efficiencyScore: number,
  tier: EfficiencyTier,
): PartCandidate {
  return { category, name, piCost, efficiencyScore, tier }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function maxDepth(a: Depth, b: Depth): Depth {
  return Math.max(a, b) as Depth
}

function isHighClass(targetClass: CarClass): boolean {
  return targetClass === "S1" || targetClass === "S2" || targetClass === "R" || targetClass === "X"
}

function estimateEngineSwapPi(car: Car, targetClass: CarClass, tuneType: TuneType): number {
  const classLoad: Record<CarClass, number> = {
    D: 18,
    C: 20,
    B: 24,
    A: 28,
    S1: 34,
    S2: 40,
    R: 44,
    X: 48,
  }
  const lowPowerPenalty = car.power_hp < 260 ? 8 : 0
  const dragPenalty = tuneType === "drag" ? 6 : 0
  return classLoad[targetClass] + lowPowerPenalty + dragPenalty
}

function recommendSwap(car: Car, tuneType: TuneType): string {
  const isJDM = JDM_BRANDS.has(car.brand) || car.car_type.includes("jdm")
  const isUS = US_BRANDS.has(car.brand)
  const isEuro = EURO_BRANDS.has(car.brand)
  const isAWD = car.drivetrain === "AWD"
  const isHeavy = car.weight_kg > 1600
  const isHighPower = car.power_hp > 500

  const isDrift = tuneType === "drift"
  const isDrag = tuneType === "drag"
  const isRally = tuneType === "rally" || tuneType === "cross_country"
  const isSprint = tuneType === "top_speed" || tuneType === "grip"

  if (isDrift) {
    if (isJDM && car.drivetrain !== "AWD") return "2JZ-GTE Turbocharged Inline-6"
    if (isJDM && isAWD) return "RB26DETT Turbocharged Inline-6"
    if (isUS) return "7.0L Chevrolet LS7 V8"
    if (isEuro && !isHeavy) return "BMW S54B32 Inline-6"
    if (isEuro) return "BMW S65B40 V8"
    return "2JZ-GTE Turbocharged Inline-6"
  }

  if (isDrag) {
    if (isHighPower && (isUS || !isJDM)) return "Dodge 8.3L V10 (SRT Viper)"
    if (isUS) return "5.0L Ford Coyote V8"
    if (isJDM) return "2JZ-GTE Turbocharged Inline-6"
    return "6.2L Chevrolet LS3 V8"
  }

  if (isRally) {
    if (isJDM && isAWD && (car.brand === "Subaru" || car.brand === "Mitsubishi")) {
      return car.brand === "Subaru"
        ? "EJ25 Flat-4 Turbocharged (WRX STI)"
        : "4B11T Turbocharged Inline-4 (Lancer Evo)"
    }
    if (isJDM && isAWD) return "EJ25 Flat-4 Turbocharged (WRX STI)"
    if (isJDM) return "SR20DET Turbocharged Inline-4"
    if (isUS) return "5.0L Ford Coyote V8"
    return "6.2L Chevrolet LS3 V8"
  }

  if (isSprint) {
    if (isHeavy) return "5.2L Lamborghini V10"
    if (isJDM && !isHighPower) return "2JZ-GTE Turbocharged Inline-6"
    if (isJDM && isHighPower) return "RB26DETT Turbocharged Inline-6"
    if (isUS) return "7.0L Chevrolet LS7 V8"
    if (isEuro) return "BMW S65B40 V8"
    return "5.0L Ford Coyote V8"
  }

  if (isJDM && car.power_hp < 300) return "SR20DET Turbocharged Inline-4"
  if (isJDM) return "2JZ-GTE Turbocharged Inline-6"
  if (isUS && isHighPower) return "Dodge 8.3L V10 (SRT Viper)"
  if (isUS) return "5.0L Ford Coyote V8"
  if (isEuro && !isHeavy) return "BMW S54B32 Inline-6"
  return "6.2L Chevrolet LS3 V8"
}

function essentialCandidates(
  tuneType: TuneType,
  targetDrivetrain: Drivetrain,
  originalDrivetrain: Drivetrain,
): PartCandidate[] {
  const suspension =
    tuneType === "drift" ? "Drift Suspension" :
    tuneType === "rally" ? "Rally Suspension" :
    tuneType === "cross_country" ? "Off-Road Suspension" :
    "Race Springs & Dampers"

  const antiRollBars =
    tuneType === "drift" ? "Drift Anti-Roll Bars" :
    tuneType === "rally" ? "Rally Anti-Roll Bars" :
    tuneType === "cross_country" ? "Off-Road Anti-Roll Bars" :
    "Race Anti-Roll Bars"

  const differential = tuneType === "drift" ? "Drift Differential" : "Race Differential"
  const conversion =
    targetDrivetrain !== originalDrivetrain
      ? [candidate("drivetrain", `${targetDrivetrain} Conversion`, 0, 10, "essential")]
      : []

  return [
    candidate("platform", suspension, 0, 10, "essential"),
    candidate("platform", antiRollBars, 0, 10, "essential"),
    candidate("drivetrain", "Race Transmission", 0, 10, "essential"),
    candidate("drivetrain", differential, 0, 10, "essential"),
    ...conversion,
  ]
}

function weightReductionCandidates(profile: CarProfile, depth: Depth): PartCandidate[] {
  const heavyDiscount = profile.isHeavy ? -3 : 0
  const lightPenalty = profile.isLight ? 2 : 0
  const adjustment = heavyDiscount + lightPenalty

  const race = candidate("platform", "Race Weight Reduction", clamp(24 + adjustment, 14, 30), 9.8, "high")
  const sport = candidate("platform", "Sport Weight Reduction", clamp(14 + adjustment, 8, 20), 8.7, "high")
  const street = candidate("platform", "Street Weight Reduction", clamp(8 + adjustment, 4, 12), 7.4, "high")

  if (depth >= 3 || profile.isHeavy) return [race, sport, street]
  if (depth === 2) return [race, sport, street]
  return [race, sport, street]
}

function tireCompoundCandidates(tuneType: TuneType, targetClass: CarClass): PartCandidate[] {
  if (tuneType === "drag") {
    return [candidate("tires", "Drag Tires", 9, 9.2, "high")]
  }
  if (tuneType === "drift") {
    return [candidate("tires", "Drift Tires", 7, 8.2, "high")]
  }
  if (tuneType === "rally") {
    return [candidate("tires", "Rally Tires", 8, 9.1, "high")]
  }
  if (tuneType === "cross_country") {
    return [candidate("tires", "Off-Road Tires", 7, 9.0, "high")]
  }

  const street = candidate("tires", "Street Tires", 3, 6.4, "high")
  const sport = candidate("tires", "Sport Tires", 7, 7.5, "high")
  const semi = candidate("tires", "Semi-Slick Tires", 14, 8.8, "high")
  const race = candidate("tires", "Race Tires", 20, 9.1, "high")

  if (targetClass === "D") return [street]
  if (targetClass === "C" || targetClass === "B") return [sport, street]
  if (targetClass === "A") return [semi, sport, street]
  return [race, semi, sport]
}

function tireWidthCandidates(tuneType: TuneType, depth: Depth): PartCandidate[] {
  if (tuneType === "drag" || tuneType === "drift") {
    return [
      candidate("tires", "Max Width Rear Tires", 4, 8.4, "high"),
      candidate("tires", "Stock Front Tire Width", 0, 5.5, "high"),
    ]
  }

  if (tuneType === "cross_country") {
    return [
      candidate("tires", "Max Width Rear Tires", 4, 8.4, "high"),
      candidate("tires", "Max Width Front Tires", 4, 8.2, "high"),
    ]
  }

  if (depth >= 3 || tuneType === "grip") {
    return [
      candidate("tires", "Max Width Rear Tires", 4, 8.4, "high"),
      candidate("tires", "Max Width Front Tires", 4, 7.8, "high"),
    ]
  }

  return [
    candidate("tires", "+1 Rear Tire Width", 2, 7.4, "high"),
    candidate("tires", "+1 Front Tire Width", 2, 7.0, "high"),
  ]
}

function trackWidthCandidates(tuneType: TuneType, depth: Depth): PartCandidate[] {
  if (tuneType === "drag") return []

  if (depth >= 3 || tuneType === "grip" || tuneType === "rally") {
    return [
      candidate("platform", "Max Front Track Width", 1, 8.2, "high"),
      candidate("platform", "Max Rear Track Width", 1, 8.1, "high"),
    ]
  }

  return [
    candidate("platform", "Front Track Width +1", 1, 7.3, "high"),
    candidate("platform", "Rear Track Width +1", 1, 7.3, "high"),
  ]
}

function brakeCandidates(tuneType: TuneType, depth: Depth): PartCandidate[] {
  if (tuneType === "drag") return [candidate("platform", "Sport Brakes", 2, 5.4, "medium")]
  if (tuneType === "cross_country") return [candidate("platform", "Sport Brakes", 2, 5.6, "medium")]
  if (depth >= 2 || tuneType === "grip") return [candidate("platform", "Race Brakes", 5, 6.5, "medium")]
  return [candidate("platform", "Sport Brakes", 2, 5.7, "medium")]
}

function drivetrainSupportCandidates(depth: Depth): PartCandidate[] {
  const parts = [candidate("drivetrain", "Race Clutch", 2, 6.2, "medium")]
  if (depth >= 3) parts.push(candidate("drivetrain", "Race Driveline", 3, 6.0, "medium"))
  return parts
}

function aeroCandidates(tuneType: TuneType, intent: TuneIntent): PartCandidate[] {
  const aero =
    intent === "speed" ? (tuneType === "grip" ? ["Rear Wing (Low)"] : []) :
    intent === "control" ? ["Adjustable Rear Wing"] :
    intent === "cornering" ? ["Front Splitter (High)", "Adjustable Rear Wing"] :
    intent === "acceleration" && tuneType !== "drag" ? ["Rear Wing (Low)"] :
    tuneType === "grip" ? ["Front Splitter (High)", "Adjustable Rear Wing"] :
    tuneType === "drag" ? [] :
    tuneType === "drift" ? ["Front Bumper Aero", "Rear Spoiler (Low)"] :
    tuneType === "rally" ? ["Adjustable Front Bumper", "Adjustable Rear Wing (Medium)"] :
    tuneType === "cross_country" ? [] :
    tuneType === "top_speed" ? ["Front Splitter (Low)", "Rear Wing (Low)"] :
    ["Adjustable Rear Wing"]

  return aero.map((name) => {
    const piCost = name.includes("High") || name === "Adjustable Rear Wing" ? 0 : -1
    return candidate("aero", name, piCost, 7.2, "medium")
  })
}

function electricEngineCandidates(depth: Depth): PartCandidate[] {
  if (depth >= 3) {
    return [
      candidate("engine", "Race Battery", 10, 7.2, "medium"),
      candidate("engine", "Race Motor", 16, 7.0, "medium"),
      candidate("engine", "Race Inverter", 8, 6.7, "medium"),
    ]
  }

  return [
    candidate("engine", "Sport Battery", 5, 6.8, "medium"),
    candidate("engine", "Sport Motor", 9, 6.6, "medium"),
  ]
}

function engineUpgradeCandidates(car: Car, depth: Depth, engineSwapApplied: boolean): PartCandidate[] {
  if (engineSwapApplied) {
    return [
      candidate("engine", "Race Fuel System", 7, 6.5, "medium"),
      candidate("engine", "Race Flywheel", 2, 6.1, "medium"),
    ]
  }

  if (car.aspiration === "Electric") return electricEngineCandidates(depth)

  const parts: PartCandidate[] = [
    candidate("engine", depth === 1 ? "Sport Intake" : "Race Intake", depth === 1 ? 2 : 4, 7.4, "medium"),
    candidate("engine", depth === 1 ? "Sport Exhaust" : "Race Exhaust", depth === 1 ? 3 : 5, 7.2, "medium"),
  ]

  if (car.aspiration === "Turbo") {
    parts.push(candidate("engine", depth === 1 ? "Sport Turbo" : "Race Turbo", depth === 1 ? 5 : 11, 7.0, "medium"))
    if (depth >= 4) parts.push(candidate("engine", "Race Fuel System", 8, 6.1, "medium"))
  } else if (car.aspiration === "Supercharged") {
    parts.push(candidate("engine", depth === 1 ? "Sport Supercharger" : "Race Supercharger", depth === 1 ? 5 : 11, 7.0, "medium"))
    if (depth >= 4) parts.push(candidate("engine", "Race Fuel System", 8, 6.1, "medium"))
  } else {
    if (depth >= 2) {
      parts.push(candidate("engine", "Race Valves", 5, 6.5, "medium"))
      parts.push(candidate("engine", "Race Displacement", 10, 5.7, "medium"))
    }
    if (depth >= 3) {
      parts.push(candidate("engine", "Race Ignition", 5, 6.0, "medium"))
      parts.push(candidate("engine", "Race Pistons", 8, 5.8, "medium"))
    }
  }

  if (depth >= 3) parts.push(candidate("engine", "Race Flywheel", 2, 6.1, "medium"))
  if (depth >= 4) parts.push(candidate("engine", "Race Engine Block", 12, 5.6, "medium"))

  return parts
}

function lowEfficiencyCandidates(depth: Depth, targetClass: CarClass): PartCandidate[] {
  if (depth < 4 && !isHighClass(targetClass)) return []

  return [
    candidate("engine", "Race Intercooler", 11, 3.2, "low"),
    candidate("engine", "Race Oil Cooling", 9, 2.2, "low"),
    candidate("platform", "Race Roll Cage", 12, 2.0, "low"),
  ]
}

function ballastCandidates(): PartCandidate[] {
  return [
    candidate("platform", "Heavier Rims", -2, 4.0, "ballast"),
    candidate("platform", "Rim Size +1", -1, 3.5, "ballast"),
  ]
}

function sortByEfficiency(a: PartCandidate, b: PartCandidate): number {
  const aRatio = a.piCost <= 0 ? Number.POSITIVE_INFINITY : a.efficiencyScore / a.piCost
  const bRatio = b.piCost <= 0 ? Number.POSITIVE_INFINITY : b.efficiencyScore / b.piCost
  if (bRatio !== aRatio) return bRatio - aRatio
  if (b.efficiencyScore !== a.efficiencyScore) return b.efficiencyScore - a.efficiencyScore
  return a.piCost - b.piCost
}

function uniqueSkipped(skipped: string[]): string[] {
  return [...new Set(skipped)]
}

export function selectPartsPlan(
  car: Car,
  profile: CarProfile,
  tuneType: TuneType,
  targetDrivetrain: Drivetrain,
  targetClass: CarClass,
  engineSwap = false,
  intent: TuneIntent = "balanced",
): PartsSelectionPlan {
  const parts = emptyParts()
  const selected = new Set<string>()
  const skipped: string[] = []
  const notes: string[] = []
  const piLimit = getClassPiLimit(targetClass)
  const startingPi = clamp(Math.round(car.base_pi), 100, 999)
  let estimatedPi = startingPi
  let engineSwapApplied = false

  function add(part: PartCandidate, force = false): boolean {
    if (selected.has(part.name)) return true

    const nextPi = clamp(estimatedPi + part.piCost, 100, 999)
    if (!force && part.piCost > 0 && nextPi > piLimit) {
      skipped.push(part.name)
      return false
    }

    selected.add(part.name)
    parts[part.category].push(part.name)
    estimatedPi = nextPi
    return true
  }

  function addBestFit(candidates: PartCandidate[]): boolean {
    for (const part of candidates) {
      if (add(part)) return true
    }
    if (candidates[0]) skipped.push(candidates[0].name)
    return false
  }

  if (engineSwap) {
    const swap = candidate("engine", recommendSwap(car, tuneType), estimateEngineSwapPi(car, targetClass, tuneType), 5.2, "medium")
    engineSwapApplied = add(swap)
    if (!engineSwapApplied) {
      notes.push("Engine swap skipped to keep the build inside the target PI class.")
    }
  }

  const depth = engineSwapApplied ? maxDepth(CLASS_DEPTH[targetClass], 3) : CLASS_DEPTH[targetClass]

  // Tuning unlocks are deliberately zero-cost in this planner: they are mandatory
  // for adjustable tune controls and usually have minimal PI impact in-game.
  for (const part of essentialCandidates(tuneType, targetDrivetrain, car.drivetrain)) {
    add(part, true)
  }

  addBestFit(weightReductionCandidates(profile, depth))
  addBestFit(tireCompoundCandidates(tuneType, targetClass))

  for (const part of [...tireWidthCandidates(tuneType, depth), ...trackWidthCandidates(tuneType, depth)]) {
    add(part)
  }

  const mediumCandidates = [
    ...aeroCandidates(tuneType, intent),
    ...brakeCandidates(tuneType, depth),
    ...drivetrainSupportCandidates(depth),
    ...engineUpgradeCandidates(car, depth, engineSwapApplied),
  ].sort(sortByEfficiency)

  for (const part of mediumCandidates) {
    add(part)
  }

  const remainingAfterMedium = piLimit - estimatedPi
  if (remainingAfterMedium >= 8 || targetClass === "X") {
    for (const part of lowEfficiencyCandidates(depth, targetClass).sort(sortByEfficiency)) {
      add(part)
    }
  }

  if (estimatedPi > piLimit && estimatedPi - piLimit <= 3) {
    for (const part of ballastCandidates()) {
      if (estimatedPi <= piLimit) break
      add(part, true)
    }
  }

  if (estimatedPi > piLimit) {
    notes.push(`Base PI ${startingPi} is above the ${targetClass} class limit (${piLimit}).`)
  } else if (piLimit - estimatedPi <= 3 && targetClass !== "X") {
    notes.push("If the in-game PI lands 1-3 points over the class, use heavier rims or +1 rim size as ballast.")
  }

  return {
    parts,
    estimatedPi,
    piLimit,
    budgetUsed: Math.max(0, estimatedPi - startingPi),
    engineSwapApplied,
    skipped: uniqueSkipped(skipped),
    notes,
  }
}

export function selectParts(
  car: Car,
  profile: CarProfile,
  tuneType: TuneType,
  targetDrivetrain: Drivetrain,
  targetClass: CarClass,
  engineSwap = false,
  intent: TuneIntent = "balanced",
): Parts {
  return selectPartsPlan(car, profile, tuneType, targetDrivetrain, targetClass, engineSwap, intent).parts
}
