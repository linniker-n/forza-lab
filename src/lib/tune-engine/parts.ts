import type { Car, CarClass, Drivetrain, Parts, TuneIntent, TuneType } from "@/types"
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
    // NA — Ensinamento (vídeo FH6): "evite o comando de válvulas se possível.
    // A relação performance/PI é ruim. Prefiro trocar o motor a colocar um cam."
    // Usamos Displacement + Valves + Ignition (melhor custo/PI que Camshaft)
    if (depth >= 2) parts.push("Race Valves", "Race Displacement")
    if (depth >= 3) parts.push("Race Ignition", "Race Pistons")
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

function aeroParts(tuneType: TuneType, intent: TuneIntent): string[] {
  if (intent === "speed") return tuneType === "grip" ? ["Rear Wing (Low)"] : []
  if (intent === "control") return ["Adjustable Rear Wing"]
  if (intent === "cornering") return ["Front Splitter (High)", "Adjustable Rear Wing"]
  if (intent === "acceleration" && tuneType !== "drag") return ["Rear Wing (Low)"]

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

// ─────────────────────────────────────────────────────────────────────────────
// Engine swap recommendation — por marca, origem e tipo de tune
// ─────────────────────────────────────────────────────────────────────────────

const JDM_BRANDS  = new Set(["Toyota","Nissan","Honda","Mazda","Subaru","Mitsubishi","Lexus","Infiniti","Acura","Datsun","Scion","Isuzu"])
const US_BRANDS   = new Set(["Ford","Chevrolet","Dodge","GMC","Pontiac","Shelby","Jeep","Buick","Cadillac","Lincoln","Plymouth","Mercury","RAM","Chrysler"])
const EURO_BRANDS = new Set(["BMW","Mercedes-Benz","Audi","Porsche","Ferrari","Lamborghini","Alfa Romeo","Fiat","Lancia","Lotus","McLaren","Bentley","Bugatti","Koenigsegg","Pagani","Renault","Peugeot","Citroën","Volkswagen","SEAT","Cupra","Volvo"])

function recommendSwap(car: Car, tuneType: TuneType): string {
  const isJDM  = JDM_BRANDS.has(car.brand) || car.car_type.includes("jdm")
  const isUS   = US_BRANDS.has(car.brand)
  const isEuro = EURO_BRANDS.has(car.brand)
  const isAWD  = car.drivetrain === "AWD"
  const isHeavy = car.weight_kg > 1600
  const isHighPower = car.power_hp > 500

  const isDrift  = tuneType === "drift"
  const isDrag   = tuneType === "drag"
  const isRally  = tuneType === "rally" || tuneType === "cross_country"
  const isSprint = tuneType === "top_speed" || tuneType === "grip"

  if (isDrift) {
    // RWD JDM: 2JZ é o swap clássico
    if (isJDM && car.drivetrain !== "AWD") return "2JZ-GTE Turbocharged Inline-6"
    // AWD JDM: RB26 mantém AWD e entrega potência
    if (isJDM && isAWD) return "RB26DETT Turbocharged Inline-6"
    // Carros americanos: LS7 é o swap de drift padrão
    if (isUS) return "7.0L Chevrolet LS7 V8"
    // Europeus leves: BMW S54 ou S65 dependendo do peso
    if (isEuro && !isHeavy) return "BMW S54B32 Inline-6"
    if (isEuro) return "BMW S65B40 V8"
    // Outros: 2JZ é universalmente bem suportado no jogo
    return "2JZ-GTE Turbocharged Inline-6"
  }

  if (isDrag) {
    // Drag quer potência bruta — V8/V10 americanos dominam
    if (isHighPower && (isUS || !isJDM)) return "Dodge 8.3L V10 (SRT Viper)"
    if (isUS) return "5.0L Ford Coyote V8"
    // JDM drag: 2JZ ainda é referência com muito potencial de boost
    if (isJDM) return "2JZ-GTE Turbocharged Inline-6"
    // Europeus: LS swap é popular no drag até em carros europeus
    return "6.2L Chevrolet LS3 V8"
  }

  if (isRally) {
    // AWD JDM (Subaru, Mitsubishi): EJ25 ou 4B11 dependendo do carro
    if (isJDM && isAWD && (car.brand === "Subaru" || car.brand === "Mitsubishi")) {
      return car.brand === "Subaru"
        ? "EJ25 Flat-4 Turbocharged (WRX STI)"
        : "4B11T Turbocharged Inline-4 (Lancer Evo)"
    }
    // Outros JDM AWD
    if (isJDM && isAWD) return "EJ25 Flat-4 Turbocharged (WRX STI)"
    // JDM RWD: SR20DET para rally leve
    if (isJDM) return "SR20DET Turbocharged Inline-4"
    // Americanos: Coyote aguenta off-road sem perder torque
    if (isUS) return "5.0L Ford Coyote V8"
    // Europeus: LS3 é resistente e tem torque na base
    return "6.2L Chevrolet LS3 V8"
  }

  if (isSprint) {
    // Top speed / circuito — potência + peso
    if (isHeavy) return "5.2L Lamborghini V10"
    if (isJDM && !isHighPower) return "2JZ-GTE Turbocharged Inline-6"
    if (isJDM && isHighPower) return "RB26DETT Turbocharged Inline-6"
    if (isUS) return "7.0L Chevrolet LS7 V8"
    if (isEuro) return "BMW S65B40 V8"
    return "5.0L Ford Coyote V8"
  }

  // Street / rua — escolha pelo perfil do carro
  if (isJDM && car.power_hp < 300) return "SR20DET Turbocharged Inline-4"
  if (isJDM) return "2JZ-GTE Turbocharged Inline-6"
  if (isUS && isHighPower) return "Dodge 8.3L V10 (SRT Viper)"
  if (isUS) return "5.0L Ford Coyote V8"
  if (isEuro && !isHeavy) return "BMW S54B32 Inline-6"
  return "6.2L Chevrolet LS3 V8"
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
  const needsConversion = targetDrivetrain !== car.drivetrain
  const conversionParts: string[] = needsConversion ? [`${targetDrivetrain} Conversion`] : []

  // Engine swap força profundidade mínima full-race (3) + adiciona o swap
  const baseDepth = CLASS_DEPTH[targetClass]
  const depth: Depth = engineSwap ? Math.max(baseDepth, 3) as Depth : baseDepth

  const swapParts: string[] = engineSwap
    ? [
        recommendSwap(car, tuneType),
        "Race Intercooler",
        "Race Fuel System",
        "⚠ Confirme a disponibilidade do swap no menu Upgrades do jogo — opções variam por carro",
      ]
    : []

  const engine = engineSwap
    ? [...swapParts, "Race Flywheel", "Race Clutch"]  // swap substitui o motor original
    : engineParts(car, depth)

  return {
    engine,
    platform:   platformParts(tuneType, depth),
    drivetrain: [...conversionParts, ...drivetrainParts(tuneType, depth)],
    tires:      tireParts(tuneType, depth),
    aero:       aeroParts(tuneType, intent),
  }
}
