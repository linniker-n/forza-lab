import type { CarClass } from "@/types"

export const CLASS_PI_LIMITS: Record<CarClass, number> = {
  D: 400,
  C: 500,
  B: 600,
  A: 700,
  S1: 800,
  S2: 900,
  R: 998,
  X: 999,
}

export const CLASS_PI_FLOORS: Record<CarClass, number> = {
  D: 100,
  C: 401,
  B: 501,
  A: 601,
  S1: 701,
  S2: 801,
  R: 901,
  X: 999,
}

export function getClassPiLimit(carClass: CarClass): number {
  return CLASS_PI_LIMITS[carClass]
}

export function classFromPi(pi: number): CarClass {
  if (pi >= 999) return "X"
  if (pi >= 901) return "R"
  if (pi >= 801) return "S2"
  if (pi >= 701) return "S1"
  if (pi >= 601) return "A"
  if (pi >= 501) return "B"
  if (pi >= 401) return "C"
  return "D"
}
