import type { Car, Drivetrain, Parts, TuneType } from "@/types"
import type { CarProfile } from "./analyze"

export function selectParts(
  car: Car,
  profile: CarProfile,
  tuneType: TuneType,
  targetDrivetrain: Drivetrain
): Parts {
  const needsConversion = targetDrivetrain !== car.drivetrain

  const conversionParts: string[] = needsConversion
    ? [`${targetDrivetrain} Conversion`]
    : []

  switch (tuneType) {
    case "drift":
      return driftParts(profile, conversionParts)
    case "drag":
      return dragParts(profile, conversionParts)
    case "rally":
      return rallyParts(profile, conversionParts)
    case "cross_country":
      return crossCountryParts(profile, conversionParts)
    case "top_speed":
      return topSpeedParts(profile, conversionParts)
    case "grip":
      return gripParts(profile, conversionParts)
    default:
      return streetParts(profile, conversionParts)
  }
}

function streetParts(profile: CarProfile, conversions: string[]): Parts {
  return {
    engine: profile.isLowPower
      ? ["Race Intake", "Race Exhaust", "Race Turbo", "Race Engine Block", "Race Pistons"]
      : profile.isPowerful
        ? ["Race Intake", "Sport Exhaust", "Race Intercooler"]
        : ["Race Intake", "Sport Exhaust", "Street Turbo"],
    platform: [
      "Race Brakes",
      "Race Springs & Dampers",
      "Race Anti-Roll Bars",
      profile.isHeavy ? "Race Weight Reduction" : "Sport Weight Reduction",
    ],
    drivetrain: [
      ...conversions,
      "Race Transmission",
      "Race Differential",
      "Race Clutch",
    ],
    tires: [
      "Sport Tires",
      profile.isHeavy ? "Max Width Rear Tires" : "+1 Rear Tire Width",
      "+1 Front Tire Width",
    ],
    aero: ["Adjustable Rear Wing"],
  }
}

function driftParts(profile: CarProfile, conversions: string[]): Parts {
  return {
    engine: profile.isLowPower
      ? ["Race Intake", "Race Exhaust", "Race Turbo", "Race Engine Block"]
      : ["Race Intake", "Race Exhaust", "Race Intercooler"],
    platform: [
      "Drift Suspension",
      "Drift Anti-Roll Bars",
      "Race Brakes",
      "Race Weight Reduction",
    ],
    drivetrain: [
      ...conversions,
      "Drift Differential",
      "Race Transmission",
      "Race Clutch",
    ],
    tires: ["Drift Tires", "Max Width Rear Tires", "Stock Front Tire Width"],
    aero: ["Front Bumper Aero", "Rear Spoiler (Low)"],
  }
}

function dragParts(profile: CarProfile, conversions: string[]): Parts {
  return {
    engine: [
      "Race Intake",
      "Race Exhaust",
      profile.isPowerful ? "Race Intercooler" : "Race Turbo",
      "Race Engine Block",
      "Race Pistons",
      "Race Valves",
    ],
    platform: [
      "Race Brakes",
      "Drag Suspension",
      "Race Anti-Roll Bars",
      "Race Weight Reduction",
    ],
    drivetrain: [
      ...conversions,
      "Race Transmission",
      "Race Differential",
      "Race Driveline",
      "Race Clutch",
    ],
    tires: ["Drag Tires", "Max Width Rear Tires", "Stock Front Tire Width"],
    aero: [],
  }
}

function rallyParts(profile: CarProfile, conversions: string[]): Parts {
  return {
    engine: profile.isLowPower
      ? ["Race Intake", "Race Exhaust", "Race Turbo"]
      : ["Race Intake", "Sport Exhaust"],
    platform: [
      "Rally Suspension",
      "Rally Anti-Roll Bars",
      "Race Brakes",
      "Sport Weight Reduction",
    ],
    drivetrain: [
      ...conversions,
      "Race Transmission",
      "Race Differential",
      "Race Clutch",
    ],
    tires: ["Rally Tires", "+1 Rear Tire Width"],
    aero: ["Adjustable Front Bumper", "Adjustable Rear Wing (Medium)"],
  }
}

function crossCountryParts(profile: CarProfile, conversions: string[]): Parts {
  return {
    engine: ["Race Intake", "Race Exhaust", "Race Intercooler"],
    platform: [
      "Off-Road Suspension",
      "Off-Road Anti-Roll Bars",
      "Race Brakes",
      "Sport Weight Reduction",
    ],
    drivetrain: [
      ...conversions,
      "Race Transmission",
      "Race Differential",
      "Race Clutch",
    ],
    tires: ["Off-Road Tires", "Max Width Rear Tires", "Max Width Front Tires"],
    aero: [],
  }
}

function topSpeedParts(profile: CarProfile, conversions: string[]): Parts {
  return {
    engine: [
      "Race Intake",
      "Race Exhaust",
      profile.isPowerful ? "Race Intercooler" : "Race Turbo",
      "Race Engine Block",
      "Race Pistons",
    ],
    platform: [
      "Race Brakes",
      "Race Springs & Dampers",
      "Race Anti-Roll Bars",
      "Race Weight Reduction",
    ],
    drivetrain: [
      ...conversions,
      "Race Transmission",
      "Race Differential",
      "Race Driveline",
      "Race Clutch",
    ],
    tires: ["Sport Tires", "+1 Rear Tire Width"],
    aero: ["Front Splitter (Low)", "Rear Wing (Low)"],
  }
}

function gripParts(profile: CarProfile, conversions: string[]): Parts {
  return {
    engine: profile.isLowPower
      ? ["Race Intake", "Race Exhaust", "Race Turbo"]
      : ["Race Intake", "Sport Exhaust"],
    platform: [
      "Race Brakes",
      "Race Springs & Dampers",
      "Race Anti-Roll Bars",
      "Race Weight Reduction",
    ],
    drivetrain: [
      ...conversions,
      "Race Transmission",
      "Race Differential",
      "Race Clutch",
    ],
    tires: ["Semi-Slick Tires", "Max Width Rear Tires", "+1 Front Tire Width"],
    aero: ["Front Splitter (High)", "Adjustable Rear Wing"],
  }
}
