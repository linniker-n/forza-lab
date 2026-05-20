import rawCars from "./cars.generated.json"
import type { Car, CarCategory, CarClass, Drivetrain, TuneType } from "@/types"

interface CarsPayload {
  source_url: string
  synced_at: string
  count: number
  cars: Car[]
}

const payload = rawCars as CarsPayload

const TUNE_TYPES = new Set<TuneType>([
  "street",
  "drag",
  "drift",
  "rally",
  "cross_country",
  "top_speed",
  "grip",
])

const CAR_TYPES = new Set<CarCategory>([
  "jdm",
  "muscle",
  "hypercar",
  "supercar",
  "suv",
  "offroad",
  "classic",
  "sport",
  "truck",
  "buggy",
])

const DRIVETRAINS = new Set<Drivetrain>(["FWD", "RWD", "AWD"])
const CLASSES = new Set<CarClass>(["D", "C", "B", "A", "S1", "S2", "R", "X"])

export const CARS_SYNCED_AT = payload.synced_at
export const CARS_TOTAL = payload.count
export const CARS: Car[] = payload.cars

export function getCarImageUrl(car: Car): string {
  if (car.image_url) return car.image_url
  if (!car.imagin_make || !car.imagin_model) return ""
  const make = encodeURIComponent(car.imagin_make)
  const model = encodeURIComponent(car.imagin_model)
  return `https://cdn.imagin.studio/getimage?customer=img&make=${make}&modelFamily=${model}&modelYear=${car.year}&zoomType=fullscreen&angle=01`
}

export function getCarById(id: string): Car | undefined {
  return CARS.find((car) => car.id === id)
}

export function searchCars(query: string): Car[] {
  const q = query.toLowerCase().trim()
  if (!q) return CARS

  return CARS.filter((car) =>
    [
      car.brand,
      car.model,
      String(car.year),
      car.fandom_car_type ?? "",
      car.country ?? "",
      car.rarity ?? "",
    ].some((value) => value.toLowerCase().includes(q))
  )
}

function isTuneType(value?: string): value is TuneType {
  return !!value && TUNE_TYPES.has(value as TuneType)
}

function isCarType(value?: string): value is CarCategory {
  return !!value && CAR_TYPES.has(value as CarCategory)
}

function isDrivetrain(value?: string): value is Drivetrain {
  return !!value && DRIVETRAINS.has(value as Drivetrain)
}

function isCarClass(value?: string): value is CarClass {
  return !!value && CLASSES.has(value as CarClass)
}

export function filterCars(filters: {
  brand?: string
  tune_type?: string
  drivetrain?: string
  base_class?: string
  car_type?: string
}): Car[] {
  return CARS.filter((car) => {
    if (filters.brand && !car.brand.toLowerCase().includes(filters.brand.toLowerCase())) return false
    if (isDrivetrain(filters.drivetrain) && car.drivetrain !== filters.drivetrain) return false
    if (isCarClass(filters.base_class) && car.base_class !== filters.base_class) return false
    if (isTuneType(filters.tune_type) && !car.recommended_use.includes(filters.tune_type)) return false
    if (isCarType(filters.car_type) && !car.car_type.includes(filters.car_type)) return false
    return true
  })
}

export const BRANDS = [...new Set(CARS.map((car) => car.brand))].sort()
