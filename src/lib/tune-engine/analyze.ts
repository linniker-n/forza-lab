import type { Car } from "@/types"

export interface CarProfile {
  isHeavy: boolean
  isLight: boolean
  isPowerful: boolean
  isLowPower: boolean
  isAWD: boolean
  isRWD: boolean
  isFWD: boolean
  powerToWeight: number
  isMuscle: boolean
  isJDM: boolean
  isHypercar: boolean
  isOffroad: boolean
}

export function analyzeCar(car: Car): CarProfile {
  return {
    isHeavy: car.weight_kg > 1700,
    isLight: car.weight_kg < 1300,
    isPowerful: car.power_hp > 500,
    isLowPower: car.power_hp < 250,
    isAWD: car.drivetrain === "AWD",
    isRWD: car.drivetrain === "RWD",
    isFWD: car.drivetrain === "FWD",
    powerToWeight: car.power_hp / car.weight_kg,
    isMuscle: car.car_type.includes("muscle"),
    isJDM: car.car_type.includes("jdm"),
    isHypercar: car.car_type.includes("hypercar"),
    isOffroad: car.car_type.includes("offroad") || car.car_type.includes("truck") || car.car_type.includes("suv"),
  }
}
