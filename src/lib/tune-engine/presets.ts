import type {
  Drivetrain,
  TuneType,
  TuningSetup,
} from "@/types"
import type { CarProfile } from "./analyze"

function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max)
}

function round(val: number, decimals = 1): number {
  return Math.round(val * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

export function getPresetTune(tuneType: TuneType): TuningSetup {
  const presets: Record<TuneType, TuningSetup> = {
    street: {
      tires: { front: 28.0, rear: 28.5 },
      gearing: { final_drive: 3.7, gear_1: 3.1, gear_2: 2.2, gear_3: 1.65, gear_4: 1.3, gear_5: 1.05, gear_6: 0.85 },
      alignment: { camber_front: -2.0, camber_rear: -1.3, toe_front: 0.0, toe_rear: 0.1, caster: 6.0 },
      antiroll_bars: { front: 27.0, rear: 24.0 },
      springs: { front: 650, rear: 620, ride_height_front: "low", ride_height_rear: "low" },
      damping: { rebound_front: 9.5, rebound_rear: 8.8, bump_front: 5.8, bump_rear: 5.4 },
      aero: { front: "medium", rear: "medium-high" },
      brakes: { balance: 50, pressure: 105 },
      differential: { front_accel: 25, front_decel: 5, rear_accel: 65, rear_decel: 20, center_balance: 70 },
    },
    drag: {
      tires: { front: 30.0, rear: 26.0 },
      gearing: { final_drive: 4.2, gear_1: 2.8, gear_2: 2.1, gear_3: 1.75, gear_4: 1.45, gear_5: 1.2, gear_6: 1.0 },
      alignment: { camber_front: -0.5, camber_rear: -0.3, toe_front: 0.0, toe_rear: 0.0, caster: 5.0 },
      antiroll_bars: { front: 15.0, rear: 30.0 },
      springs: { front: 450, rear: 350, ride_height_front: "medium-high", ride_height_rear: "low" },
      damping: { rebound_front: 6.0, rebound_rear: 9.0, bump_front: 4.0, bump_rear: 5.5 },
      aero: { front: "min", rear: "low" },
      brakes: { balance: 52, pressure: 95 },
      differential: { front_accel: 15, front_decel: 5, rear_accel: 85, rear_decel: 30, center_balance: 75 },
    },
    drift: {
      tires: { front: 30.0, rear: 38.0 },
      gearing: { final_drive: 3.9, gear_1: 3.0, gear_2: 2.1, gear_3: 1.6, gear_4: 1.25, gear_5: 1.0, gear_6: 0.82 },
      alignment: { camber_front: -4.2, camber_rear: -1.0, toe_front: 0.5, toe_rear: 0.1, caster: 7.0 },
      antiroll_bars: { front: 32.0, rear: 22.0 },
      springs: { front: 580, rear: 520, ride_height_front: "low", ride_height_rear: "medium-low" },
      damping: { rebound_front: 10.0, rebound_rear: 8.0, bump_front: 6.0, bump_rear: 5.0 },
      aero: { front: "low", rear: "low" },
      brakes: { balance: 48, pressure: 115 },
      differential: { rear_accel: 95, rear_decel: 85 },
    },
    rally: {
      tires: { front: 22.0, rear: 23.0 },
      gearing: { final_drive: 3.5, gear_1: 3.2, gear_2: 2.3, gear_3: 1.75, gear_4: 1.4, gear_5: 1.15, gear_6: 0.95 },
      alignment: { camber_front: -1.5, camber_rear: -0.8, toe_front: 0.1, toe_rear: 0.0, caster: 5.8 },
      antiroll_bars: { front: 18.0, rear: 17.0 },
      springs: { front: 480, rear: 450, ride_height_front: "medium-high", ride_height_rear: "high" },
      damping: { rebound_front: 6.5, rebound_rear: 6.0, bump_front: 4.0, bump_rear: 3.8 },
      aero: { front: "medium", rear: "medium" },
      brakes: { balance: 50, pressure: 95 },
      differential: { front_accel: 30, front_decel: 10, rear_accel: 70, rear_decel: 25, center_balance: 65 },
    },
    cross_country: {
      tires: { front: 21.0, rear: 22.0 },
      gearing: { final_drive: 3.2, gear_1: 3.4, gear_2: 2.5, gear_3: 1.9, gear_4: 1.5, gear_5: 1.2, gear_6: 1.0 },
      alignment: { camber_front: -1.0, camber_rear: -0.5, toe_front: 0.0, toe_rear: 0.0, caster: 5.5 },
      antiroll_bars: { front: 14.0, rear: 13.0 },
      springs: { front: 380, rear: 360, ride_height_front: "max", ride_height_rear: "max" },
      damping: { rebound_front: 5.0, rebound_rear: 5.0, bump_front: 3.0, bump_rear: 3.0 },
      aero: { front: "low", rear: "low" },
      brakes: { balance: 50, pressure: 90 },
      differential: { front_accel: 40, front_decel: 15, rear_accel: 75, rear_decel: 30, center_balance: 58 },
    },
    top_speed: {
      tires: { front: 29.5, rear: 29.5 },
      gearing: { final_drive: 2.8, gear_1: 3.5, gear_2: 2.6, gear_3: 2.0, gear_4: 1.6, gear_5: 1.3, gear_6: 1.05 },
      alignment: { camber_front: -1.0, camber_rear: -0.5, toe_front: 0.0, toe_rear: 0.0, caster: 5.5 },
      antiroll_bars: { front: 20.0, rear: 18.0 },
      springs: { front: 700, rear: 680, ride_height_front: "low", ride_height_rear: "low" },
      damping: { rebound_front: 9.0, rebound_rear: 8.5, bump_front: 5.5, bump_rear: 5.0 },
      aero: { front: "min", rear: "min" },
      brakes: { balance: 50, pressure: 100 },
      differential: { front_accel: 20, front_decel: 5, rear_accel: 60, rear_decel: 15, center_balance: 65 },
    },
    grip: {
      tires: { front: 27.5, rear: 28.0 },
      gearing: { final_drive: 3.9, gear_1: 3.1, gear_2: 2.2, gear_3: 1.65, gear_4: 1.3, gear_5: 1.05, gear_6: 0.85 },
      alignment: { camber_front: -2.5, camber_rear: -1.5, toe_front: -0.1, toe_rear: 0.1, caster: 6.5 },
      antiroll_bars: { front: 30.0, rear: 26.0 },
      springs: { front: 700, rear: 670, ride_height_front: "low", ride_height_rear: "low" },
      damping: { rebound_front: 11.0, rebound_rear: 10.0, bump_front: 6.5, bump_rear: 6.0 },
      aero: { front: "high", rear: "high" },
      brakes: { balance: 50, pressure: 110 },
      differential: { front_accel: 20, front_decel: 5, rear_accel: 70, rear_decel: 25, center_balance: 72 },
    },
  }
  return presets[tuneType]
}

export function adaptTuneToCar(
  base: TuningSetup,
  profile: CarProfile,
  tuneType: TuneType,
  targetDrivetrain?: Drivetrain
): TuningSetup {
  const tune = structuredClone(base)
  const drivetrain = targetDrivetrain ?? (profile.isAWD ? "AWD" : profile.isRWD ? "RWD" : "FWD")

  if (profile.isHeavy) {
    tune.springs.front = round(tune.springs.front * 1.15)
    tune.springs.rear = round(tune.springs.rear * 1.15)
    tune.damping.rebound_front = round(clamp(tune.damping.rebound_front + 1, 3, 15))
    tune.damping.rebound_rear = round(clamp(tune.damping.rebound_rear + 1, 3, 15))
    tune.brakes.pressure = clamp(tune.brakes.pressure + 10, 60, 150)
  }

  if (profile.isLight) {
    tune.springs.front = round(tune.springs.front * 0.88)
    tune.springs.rear = round(tune.springs.rear * 0.88)
    tune.tires.front = round(tune.tires.front - 0.5, 1)
    tune.tires.rear = round(tune.tires.rear - 0.5, 1)
  }

  if (profile.isPowerful) {
    tune.gearing.final_drive = round(tune.gearing.final_drive * 0.92, 2)
    if (tune.differential.rear_accel !== undefined) {
      tune.differential.rear_accel = clamp(tune.differential.rear_accel - 10, 15, 100)
    }
  }

  if (drivetrain === "FWD") {
    tune.differential = {
      front_accel: 30,
      front_decel: 10,
      rear_accel: 0,
      rear_decel: 0,
    }
    tune.alignment.camber_front = round(clamp(tune.alignment.camber_front - 0.3, -5, 0), 1)
  }

  if (drivetrain === "RWD" && tuneType !== "drift") {
    tune.differential = {
      rear_accel: clamp((tune.differential.rear_accel ?? 65), 45, 75),
      rear_decel: clamp((tune.differential.rear_decel ?? 20), 10, 35),
    }
  }

  if (drivetrain === "AWD") {
    tune.differential = {
      front_accel: tune.differential.front_accel ?? 25,
      front_decel: tune.differential.front_decel ?? 5,
      rear_accel: tune.differential.rear_accel,
      rear_decel: tune.differential.rear_decel,
      center_balance: tune.differential.center_balance ?? 68,
    }
  }

  if (profile.isMuscle && tuneType === "drag") {
    tune.differential.rear_accel = 90
    tune.springs.rear = round(tune.springs.rear * 0.85)
  }

  tune.damping.bump_front = round(tune.damping.rebound_front * 0.6, 1)
  tune.damping.bump_rear = round(tune.damping.rebound_rear * 0.6, 1)

  return tune
}
