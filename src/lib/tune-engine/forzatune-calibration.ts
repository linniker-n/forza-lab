import rawCars from "@/data/forzatune/cars-v101.json"
import rawDivisions from "@/data/forzatune/divisions-v101.json"
import type { Car, CarCategory, Drivetrain } from "@/types"

interface RawForzaTuneRecord {
  id?: number
  div: string
  yr?: number
  mk?: string
  mdl?: string
  cls?: string
  p?: number
  a?: number
  b: number
  c: number
  d: number
  e: number
  f: number
  g: number
  h: "F" | "M" | "R"
}

export interface ForzaTuneGeometry {
  length: number
  width: number
  height: number
  wheelbase: number
  frontTrack: number
  rearTrack: number
  wheelbaseToLengthRatio: number
  wheelbaseToHeightRatio: number
  averageTrackWidth: number
  widthToHeightRatio: number
}

export interface ForzaTuneCalibration {
  id: number
  year?: number
  make?: string
  model?: string
  division: string
  geometry: ForzaTuneGeometry
  engineLocation: "front" | "mid" | "rear"
  source: "car" | "division"
  matchScore: number
}

const cars = rawCars as RawForzaTuneRecord[]
const divisions = rawDivisions as RawForzaTuneRecord[]

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(forza edition|welcome pack|preorder car|horizon edition)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function key(...parts: Array<string | number | undefined>): string {
  return parts
    .filter((part) => part !== undefined && String(part).trim().length > 0)
    .map((part) => normalize(String(part)))
    .join("|")
}

function toGeometry(record: RawForzaTuneRecord): ForzaTuneGeometry {
  const length = record.b
  const width = record.c
  const height = record.d
  const wheelbase = record.e
  const frontTrack = record.f
  const rearTrack = record.g

  return {
    length,
    width,
    height,
    wheelbase,
    frontTrack,
    rearTrack,
    wheelbaseToLengthRatio: wheelbase / length,
    wheelbaseToHeightRatio: wheelbase / height,
    averageTrackWidth: (frontTrack + rearTrack) / 2,
    widthToHeightRatio: width / height,
  }
}

function engineLocation(value: RawForzaTuneRecord["h"]): ForzaTuneCalibration["engineLocation"] {
  if (value === "M") return "mid"
  if (value === "R") return "rear"
  return "front"
}

function toCalibration(
  record: RawForzaTuneRecord,
  source: ForzaTuneCalibration["source"],
  matchScore: number,
): ForzaTuneCalibration {
  return {
    id: record.id ?? 0,
    year: record.yr,
    make: record.mk,
    model: record.mdl,
    division: record.div,
    geometry: toGeometry(record),
    engineLocation: engineLocation(record.h),
    source,
    matchScore,
  }
}

const exactCarMap = new Map<string, RawForzaTuneRecord>()
const modelCarMap = new Map<string, RawForzaTuneRecord[]>()
const divisionMap = new Map<string, RawForzaTuneRecord>()

for (const record of cars) {
  if (!record.mk || !record.mdl) continue
  exactCarMap.set(key(record.yr, record.mk, record.mdl), record)
  const modelKey = key(record.mk, record.mdl)
  modelCarMap.set(modelKey, [...(modelCarMap.get(modelKey) ?? []), record])
}

for (const record of divisions) {
  divisionMap.set(normalize(record.div), record)
}

function bestModelMatch(car: Car): RawForzaTuneRecord | null {
  const candidates = modelCarMap.get(key(car.brand, car.model)) ?? []
  if (candidates.length === 0) return null

  return candidates.reduce((best, candidate) => {
    const bestDelta = Math.abs((best.yr ?? car.year) - car.year)
    const candidateDelta = Math.abs((candidate.yr ?? car.year) - car.year)
    return candidateDelta < bestDelta ? candidate : best
  }, candidates[0])
}

const CATEGORY_DIVISION_HINTS: Record<CarCategory, string[]> = {
  buggy: ["Offroad Buggies", "Extreme Offroad", "Unlimited Offroad"],
  classic: ["Classic Sports Cars", "Classic Racers", "Classic Muscle", "Cult Classics"],
  hypercar: ["Modern Hypercars", "Hypercars", "Hyper Cars"],
  jdm: ["Sport Compact Icons", "Sport Compact", "Modern Sport Compact"],
  muscle: ["Modern Muscle", "Classic Muscle", "Retro Muscle"],
  offroad: ["Unlimited Offroad", "Extreme Offroad", "Modern Offroaders", "Offroad"],
  sport: ["Modern Sports Cars", "Modern Sport Coupe", "Sport GT", "Sport Compact"],
  supercar: ["Modern Supercars", "Modern Super Cars", "Supercar Renaissance", "Retro Supercars"],
  suv: ["Modern SUV", "Sport Utility Heroes", "Offroad"],
  truck: ["Forza Trophy Trucks", "Trucks", "Unlimited Offroad"],
}

function divisionCandidates(car: Car): string[] {
  const categories = car.car_type.length > 0 ? car.car_type : (["sport"] as CarCategory[])
  const hinted = categories.flatMap((category) => CATEGORY_DIVISION_HINTS[category] ?? [])
  const byUse =
    car.recommended_use.includes("rally") || car.recommended_use.includes("cross_country")
      ? ["Rally Monsters", "Modern Rally", "Forza Group Rally"]
      : []
  const byClass =
    car.base_class === "S2" || car.base_class === "X"
      ? ["Extreme Track Toys", "Track Toys", "Modern Hypercars"]
      : car.base_class === "S1"
        ? ["Modern Supercars", "Modern Sports Cars", "Track Toys"]
        : []

  return [...hinted, ...byUse, ...byClass, "Forza Horizon 5 General", "General"]
}

function findDivisionFallback(car: Car): RawForzaTuneRecord | null {
  for (const candidate of divisionCandidates(car)) {
    const record = divisionMap.get(normalize(candidate))
    if (record) return record
  }
  return null
}

export function findForzaTuneCalibration(car: Car): ForzaTuneCalibration | null {
  const exact = exactCarMap.get(key(car.year, car.brand, car.model))
  if (exact) return toCalibration(exact, "car", 100)

  const byModel = bestModelMatch(car)
  if (byModel) {
    const yearDelta = Math.abs((byModel.yr ?? car.year) - car.year)
    return toCalibration(byModel, "car", Math.max(82, 96 - yearDelta))
  }

  const fallback = findDivisionFallback(car)
  if (fallback) return toCalibration(fallback, "division", 68)

  return null
}

export function getCalibrationFrontWeightPercent(car: Car, drivetrain: Drivetrain): number | null {
  const calibration = findForzaTuneCalibration(car)
  if (!calibration) return null

  if (calibration.engineLocation === "rear") return drivetrain === "AWD" ? 41 : 39
  if (calibration.engineLocation === "mid") return drivetrain === "AWD" ? 46 : 44
  if (drivetrain === "FWD") return 62
  if (drivetrain === "AWD") return 54
  return 52
}

export function getCalibrationSummary(car: Car): string | null {
  const calibration = findForzaTuneCalibration(car)
  if (!calibration) return null

  const source =
    calibration.source === "car" && calibration.make && calibration.model
      ? `${calibration.make} ${calibration.model}${calibration.year ? ` ${calibration.year}` : ""}`
      : `divisao ${calibration.division}`

  const engine =
    calibration.engineLocation === "front"
      ? "motor dianteiro"
      : calibration.engineLocation === "mid"
        ? "motor central"
        : "motor traseiro"

  return `Calibracao recuperada do APK via ${source}: ${engine}, entre-eixos ${calibration.geometry.wheelbase.toFixed(2)} m e bitola media ${calibration.geometry.averageTrackWidth.toFixed(2)} m.`
}
