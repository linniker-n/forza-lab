import type { Car, CarClass, Drivetrain, DrivingStyle, GeneratedTune, TuneIntent, TuneRequest, TuneType, TuneWarning } from "@/types"
import { analyzeCar } from "./analyze"
import {
  applyFH6Intent,
  getFH6IntentCarStrengths,
  getFH6IntentCarWeaknesses,
  getFH6IntentLabel,
  getFH6IntentStrengths,
  getFH6IntentSummary,
  getFH6IntentWarnings,
} from "./fh6-intents"
import { findForzaTuneCalibration, getCalibrationSummary } from "./forzatune-calibration"
import { calculateAdvancedGearing } from "./gearing-calculator"
import { selectParts } from "./parts"
import { buildTune } from "./presets"

const CLASS_PI_MAP: Record<CarClass, number> = {
  D: 500, C: 600, B: 700, A: 800, S1: 900, S2: 950, R: 975, X: 999,
}

function canUseDrivetrain(car: Car, drivetrain: Drivetrain): boolean {
  return drivetrain === car.drivetrain || car.available_conversions.includes(drivetrain)
}

function resolveDrivetrain(car: Car, preferred: string, tuneType: TuneType): Drivetrain {
  if (preferred !== "original" && canUseDrivetrain(car, preferred as Drivetrain)) return preferred as Drivetrain
  if (tuneType === "drift" && car.drivetrain !== "RWD" && canUseDrivetrain(car, "RWD")) return "RWD"
  if ((tuneType === "rally" || tuneType === "cross_country") && car.drivetrain !== "AWD" && canUseDrivetrain(car, "AWD")) return "AWD"
  return car.drivetrain
}

function generateSummary(car: Car, tuneType: TuneType, drivetrain: Drivetrain, style: DrivingStyle, intent: TuneIntent): string {
  const tuneLabels: Record<TuneType, string> = {
    street: "corridas de asfalto",
    drag: "arrancadas e drag",
    drift: "drift e ângulo controlado",
    rally: "terra e rally",
    cross_country: "terrenos pesados e cross country",
    top_speed: "velocidade máxima",
    grip: "circuitos técnicos e tempo de volta",
  }
  const styleLabels: Record<DrivingStyle, string> = {
    casual: "fácil de controlar e confortável",
    competitive: "competitivo e preciso",
    meta: "máxima performance e agressividade",
  }
  return `Tune do ${car.brand} ${car.model} (${car.year}) preparada para ${tuneLabels[tuneType]}, com tração ${drivetrain}. Perfil FH6: ${getFH6IntentLabel(intent)}. ${getFH6IntentSummary(intent)} Configurada para ser ${styleLabels[style]}.`
}

function generateHowToDrive(tuneType: TuneType, drivetrain: Drivetrain, intent: TuneIntent): string {
  const guides: Record<TuneType, string> = {
    street: `Frear antes da curva e acelerar progressivamente na saída. ${drivetrain === "AWD" ? "AWD oferece tração consistente, use isso a seu favor." : drivetrain === "RWD" ? "RWD exige suavidade no acelerador em curvas." : "FWD tende a subesterçar — freie mais antes da curva."}`,
    drag: `Largar suave para não patinar. Use 1ª curta e mude rápido para 2ª e 3ª. ${drivetrain === "AWD" ? "AWD oferece largada mais consistente." : "RWD exige controle na largada — solte o acelerador gradualmente."}`,
    drift: `Use 3ª marcha como marcha principal. Controle o ângulo pelo acelerador, não apenas pelo volante. Se fechar rápido demais, aumente levemente o diferencial.`,
    rally: `Câmbio curto, mantenha o motor na faixa de torque. Em terra, frear antes e soltar freio antes de girar. Não lute contra o carro em terreno irregular.`,
    cross_country: `Mantenha velocidade constante em terreno irregular. Evite frear brusco em lama. Use o impulso a favor em saltos — não freie no ar.`,
    top_speed: `Foque na reta mais longa. Acelerador fundo após a curva. Câmbio afinado para terminar a última marcha no limite de RPM.`,
    grip: `Braking points precisos. Trail brake leve na entrada da curva. Acelere somente quando o carro estiver apontado para a saída.`,
  }
  const intentGuides: Record<TuneIntent, string> = {
    balanced: "Use como base geral: ajuste apenas se sentir understeer, oversteer ou falta de final.",
    control: "Priorize entrada limpa e aceleração progressiva; o setup foi feito para salvar erros sem quebrar a traseira.",
    speed: "Abra a curva antes da reta e deixe o carro respirar até a última marcha; se bater limitador cedo, alongue mais o final drive.",
    cornering: "Use trail brake leve, aponte cedo e confie no aero; se a traseira ficar viva, reduza barra traseira ou aumente aero traseiro.",
    acceleration: "Aplique acelerador em rampa na saída; se patinar, reduza diferencial traseiro de aceleração antes de mexer nas molas.",
  }

  return `${guides[tuneType]} ${intentGuides[intent]}`
}

function generateWarnings(
  car: Car,
  tuneType: TuneType,
  drivetrain: Drivetrain,
  requestedDrivetrain: TuneRequest["preferred_drivetrain"],
  engineSwap: boolean,
): TuneWarning[] {
  const warnings: TuneWarning[] = []
  const calibrationSummary = getCalibrationSummary(car)

  if (calibrationSummary) {
    warnings.push({
      type: "info",
      message: calibrationSummary,
    })
  }

  if (engineSwap) {
    warnings.push({
      type: "info",
      message: "Tune calculada com swap de motor ativo. Molas, diferencial e câmbio foram ajustados para potência ~80% acima do stock. Ajuste fino pode ser necessário após instalar o motor escolhido.",
    })
  }

  if (requestedDrivetrain !== "original" && requestedDrivetrain !== drivetrain) {
    warnings.push({
      type: "warning",
      message: `Tração ${requestedDrivetrain} não está disponível para este carro. A tune foi recalculada usando ${drivetrain}.`,
    })
  }
  if (drivetrain === "RWD" && car.drivetrain !== "RWD") {
    warnings.push({ type: "warning", message: "Conversão para RWD exige ajuste cuidadoso do diferencial e cambagem." })
  }
  if (tuneType === "drift" && drivetrain !== "RWD") {
    warnings.push({ type: "tip", message: "Para drift, RWD é o ideal. AWD pode funcionar mas exige diferencial adaptado." })
  }
  if (car.weight_kg > 1800 && tuneType === "grip") {
    warnings.push({ type: "warning", message: "Carro pesado prejudica tempos em circuitos. Priorize redução de peso máxima." })
  }
  if (car.power_hp > 700 && tuneType === "street") {
    warnings.push({ type: "tip", message: "Muita potência para rua. Ajuste o diferencial para evitar wheelspin na aceleração." })
  }
  if (tuneType === "cross_country" && !car.car_type.includes("offroad") && !car.car_type.includes("truck") && !car.car_type.includes("suv")) {
    warnings.push({ type: "info", message: "Este carro não é otimizado para off-road. Considere SUVs ou trucks para melhores resultados." })
  }

  return warnings
}

function getStrengths(car: Car, tuneType: TuneType): string[] {
  const score = car.meta_score[tuneType === "grip" ? "street" : tuneType] ?? 5
  const strengths: string[] = []
  const calibration = findForzaTuneCalibration(car)

  if (calibration?.source === "car") {
    strengths.push("Base geometrica recuperada do APK para este carro")
  } else if (calibration?.source === "division") {
    strengths.push(`Fallback de divisao ForzaTune: ${calibration.division}`)
  }
  if (score >= 8) strengths.push(`Excelente aptidão natural para ${tuneType}`)
  if (car.weight_kg < 1400) strengths.push("Leveza favorece aceleração e mudança de direção")
  if (car.power_hp > 500) strengths.push("Alta potência proporciona aceleração superior")
  if (car.drivetrain === "AWD" && ["street", "rally", "cross_country"].includes(tuneType)) {
    strengths.push("AWD nativo oferece tração superior")
  }
  if (car.car_type.includes("jdm") && tuneType === "drift") strengths.push("Plataforma JDM ideal para drift")
  if (strengths.length === 0) strengths.push("Carro versátil com bom potencial de upgrade")
  return strengths
}

function getWeaknesses(car: Car, tuneType: TuneType): string[] {
  const weaknesses: string[] = []
  if (car.weight_kg > 1800) weaknesses.push("Peso elevado prejudica desempenho em curvas")
  if (car.power_hp < 250 && tuneType === "drag") weaknesses.push("Baixa potência base limita performance em drag")
  if (car.drivetrain === "FWD" && tuneType === "drift") weaknesses.push("FWD dificulta drift — conversão RWD recomendada")
  if (tuneType === "top_speed" && car.power_hp < 400) weaknesses.push("Potência insuficiente para velocidades máximas competitivas")
  if (car.car_type.includes("muscle") && tuneType === "grip") weaknesses.push("Muscle cars tendem a ter understeer em circuitos técnicos")
  if (weaknesses.length === 0) weaknesses.push("Nenhuma fraqueza crítica identificada para este uso")
  return weaknesses
}

// PI is estimated as the class ceiling (a real calculation would need game data)
function estimatePI(targetClass: CarClass): number {
  return CLASS_PI_MAP[targetClass]
}

export function generateTune(request: TuneRequest, car: Car): GeneratedTune {
  const profile    = analyzeCar(car)
  const drivetrain = resolveDrivetrain(car, request.preferred_drivetrain, request.tune_type)
  const fh6Intent  = request.fh6_intent ?? "balanced"

  // Parts selection — passes engine_swap flag
  const parts = selectParts(car, profile, request.tune_type, drivetrain, request.target_class, request.engine_swap, fh6Intent)

  // When engine swap is active, simulate a car with ~80% more power for tune calculations.
  // This makes the physics formulas generate stiffer springs, more conservative differential,
  // and shorter gearing — appropriate for a high-power swap build.
  const carForTune = request.engine_swap
    ? { ...car, power_hp: Math.round(car.power_hp * 1.8) }
    : car
  const profileForTune = request.engine_swap
    ? { ...profile, isPowerful: true, isLowPower: false }
    : profile

  let tuning = buildTune(carForTune, profileForTune, request.tune_type, drivetrain)

  // Difficulty adjustments on top of physics base
  if (request.difficulty === "easy") {
    if (tuning.differential.rear_accel !== undefined) {
      tuning.differential.rear_accel = Math.max(30, tuning.differential.rear_accel - 15)
    }
    tuning.antiroll_bars.front = Math.max(5, tuning.antiroll_bars.front - 3)
    tuning.antiroll_bars.rear  = Math.max(5, tuning.antiroll_bars.rear  - 3)
  } else if (request.difficulty === "aggressive") {
    if (tuning.differential.rear_accel !== undefined) {
      tuning.differential.rear_accel = Math.min(100, tuning.differential.rear_accel + 15)
    }
    tuning.antiroll_bars.front = Math.min(65, tuning.antiroll_bars.front + 3)
    tuning.antiroll_bars.rear  = Math.min(65, tuning.antiroll_bars.rear  + 3)
  }

  tuning = applyFH6Intent(tuning, {
    car: carForTune,
    profile: profileForTune,
    tuneType: request.tune_type,
    drivetrain,
    intent: fh6Intent,
    style: request.style,
    control: request.control,
    difficulty: request.difficulty,
  })

  if (request.gearing_calculator) {
    tuning.gearing = calculateAdvancedGearing(request.gearing_calculator, {
      base: tuning.gearing,
      intent: fh6Intent,
      drivetrain,
      powerHp: carForTune.power_hp,
      weightKg: carForTune.weight_kg,
    })
  }

  const intentWeaknesses = getFH6IntentCarWeaknesses(car, fh6Intent)
  const baseWeaknesses = getWeaknesses(car, request.tune_type)
  const weaknesses = intentWeaknesses.length > 0
    ? [...baseWeaknesses.filter((item) => !item.startsWith("Nenhuma")), ...intentWeaknesses]
    : baseWeaknesses

  return {
    car,
    target_class: request.target_class,
    tune_type:    request.tune_type,
    fh6_intent:   fh6Intent,
    drivetrain,
    parts,
    tuning,
    summary:    generateSummary(car, request.tune_type, drivetrain, request.style, fh6Intent),
    how_to_drive: generateHowToDrive(request.tune_type, drivetrain, fh6Intent),
    strengths:  [...getStrengths(car, request.tune_type), ...getFH6IntentStrengths(fh6Intent), ...getFH6IntentCarStrengths(car, fh6Intent)],
    weaknesses,
    warnings:   [
      ...generateWarnings(car, request.tune_type, drivetrain, request.preferred_drivetrain, request.engine_swap),
      ...(request.gearing_calculator ? [{
        type: "info" as const,
        message: `Cambio recalculado pela calculadora avancada: ${request.gearing_calculator.number_of_gears} marchas para alvo de ${request.gearing_calculator.target_speed_kmh} km/h a ${request.gearing_calculator.redline_rpm} rpm.`,
      }] : []),
      ...getFH6IntentWarnings({
        car: carForTune,
        profile: profileForTune,
        tuneType: request.tune_type,
        drivetrain,
        intent: fh6Intent,
        style: request.style,
        control: request.control,
        difficulty: request.difficulty,
      }),
    ],
    pi_estimate: estimatePI(request.target_class),
  }
}
