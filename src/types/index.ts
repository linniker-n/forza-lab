export type Drivetrain = "FWD" | "RWD" | "AWD"
export type CarClass = "D" | "C" | "B" | "A" | "S1" | "S2" | "R" | "X"
export type TuneType =
  | "street"
  | "drag"
  | "drift"
  | "rally"
  | "cross_country"
  | "top_speed"
  | "grip"

export type DrivingStyle = "casual" | "competitive" | "meta"
export type ControlType = "keyboard" | "controller" | "wheel"
export type DifficultyLevel = "easy" | "balanced" | "aggressive"
export type CarCategory =
  | "jdm"
  | "muscle"
  | "hypercar"
  | "supercar"
  | "suv"
  | "offroad"
  | "classic"
  | "sport"
  | "truck"
  | "buggy"

export interface MetaScore {
  street: number
  drag: number
  drift: number
  rally: number
  cross_country: number
  top_speed: number
}

export interface CarPerformance {
  speed: number
  handling: number
  acceleration: number
  launch: number
  braking: number
  offroad: number
}

export interface Car {
  id: string
  game: string
  brand: string
  model: string
  year: number
  base_class: CarClass
  base_pi: number
  drivetrain: Drivetrain
  weight_kg: number
  power_hp: number
  torque_nm: number
  aspiration: "NA" | "Turbo" | "Supercharged" | "Electric"
  car_type: CarCategory[]
  recommended_use: TuneType[]
  available_conversions: string[]
  meta_score: MetaScore
  notes: string
  imagin_make?: string
  imagin_model?: string
  source_url?: string
  image_url?: string
  fandom_car_type?: string
  country?: string
  unlock?: string
  rarity?: string
  value_cr?: number
  performance?: CarPerformance
}

export interface TuneRequest {
  car_id: string
  target_class: CarClass
  tune_type: TuneType
  style: DrivingStyle
  control: ControlType
  preferred_drivetrain: Drivetrain | "original"
  difficulty: DifficultyLevel
  engine_swap: boolean
}

export interface TirePressure {
  front: number
  rear: number
}

export interface Gearing {
  final_drive: number
  gear_1: number
  gear_2: number
  gear_3: number
  gear_4: number
  gear_5: number
  gear_6: number
  gear_7?: number
}

export interface Alignment {
  camber_front: number
  camber_rear: number
  toe_front: number
  toe_rear: number
  caster: number
}

export interface AntirollBars {
  front: number
  rear: number
}

export interface Springs {
  front: number
  rear: number
  ride_height_front: "low" | "medium-low" | "medium" | "medium-high" | "high" | "max"
  ride_height_rear: "low" | "medium-low" | "medium" | "medium-high" | "high" | "max"
}

export interface Damping {
  rebound_front: number
  rebound_rear: number
  bump_front: number
  bump_rear: number
}

export interface Aero {
  front: "min" | "low" | "medium" | "medium-high" | "high" | "max"
  rear: "min" | "low" | "medium" | "medium-high" | "high" | "max"
}

export interface Brakes {
  balance: number
  pressure: number
}

export interface Differential {
  front_accel?: number
  front_decel?: number
  rear_accel: number
  rear_decel: number
  center_balance?: number
}

export interface TuningSetup {
  tires: TirePressure
  gearing: Gearing
  alignment: Alignment
  antiroll_bars: AntirollBars
  springs: Springs
  damping: Damping
  aero: Aero
  brakes: Brakes
  differential: Differential
}

export interface Parts {
  engine: string[]
  platform: string[]
  drivetrain: string[]
  tires: string[]
  aero: string[]
}

export interface TuneWarning {
  type: "info" | "warning" | "tip"
  message: string
}

export interface GeneratedTune {
  car: Car
  target_class: CarClass
  tune_type: TuneType
  drivetrain: Drivetrain
  parts: Parts
  tuning: TuningSetup
  summary: string
  how_to_drive: string
  strengths: string[]
  weaknesses: string[]
  warnings: TuneWarning[]
  pi_estimate: number
}

export type DiagnosticProblem =
  | "understeer"
  | "oversteer"
  | "wheelspin"
  | "slow_cornering"
  | "slow_straight"
  | "bouncing"
  | "drift_loss"
  | "brake_instability"

export interface DiagnosticFix {
  parameter: string
  adjustment: string
  reason: string
}

export interface DiagnosticResult {
  problem: DiagnosticProblem
  diagnosis: string
  fixes: DiagnosticFix[]
  context_notes?: string[]
}
