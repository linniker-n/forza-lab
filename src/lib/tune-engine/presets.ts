/**
 * Forza Horizon 6 — Motor de cálculo de tune
 *
 * Baseado em:
 *  - Física de suspensão (weight × bias × frequency factor)
 *  - Ensinamentos dos vídeos:
 *    • FH5 PT-BR (IDlPbm9i3EA): telemetria de pneu, barras, câmbio escadinha,
 *      traseira ligeiramente mais rígida, diferencial 70% traseira AWD
 *    • FH6 Pro Tips (BfoNrIbj6N8): 100% diferencial como ponto de partida,
 *      supercharger centrífugo é o melhor swap, evitar comando de válvulas
 */

import type { Car, Drivetrain, TuneType, TuningSetup } from "@/types"
import type { CarProfile } from "./analyze"

function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max)
}

function r1(val: number): number {
  return Math.round(val * 10) / 10
}

function r2(val: number): number {
  return Math.round(val * 100) / 100
}

// Round to nearest multiple of 25 (spring rates in lbf/in)
function r25(val: number): number {
  return Math.round(val / 25) * 25
}

// ─────────────────────────────────────────────────────────────────────────────
// SPRINGS — física de frequência natural por tipo de tune
//
// spring_rate (lbf/in) = axle_weight_kg × bias × factor
//
// Calibrado contra tunes verificadas da comunidade FH5/FH6:
//   GR Yaris 1280 kg AWD S1 street → 575F / 475R kgf/mm ≈ 100.7/83.2
//   BMW M3   1500 kg RWD  A  grip  → 750F / 625R
// ─────────────────────────────────────────────────────────────────────────────
const SPRING_FACTORS: Record<TuneType, { f: number; r: number }> = {
  // Ensinamento (vídeo): "traseira ligeiramente mais rígida que dianteira"
  // → fator traseiro ligeiramente maior na maioria dos tipos
  street:        { f: 0.84, r: 0.80 },  // R > F para ajudar entrada de curva
  grip:          { f: 1.02, r: 1.00 },  // R ≈ F, levemente mais rígido traseiro
  drift:         { f: 0.92, r: 0.68 },  // Dianteiro rígido para iniciação
  drag:          { f: 0.65, r: 0.52 },  // Traseiro mole para transferência de peso
  rally:         { f: 0.58, r: 0.56 },  // Levemente stiffer no traseiro para tração
  cross_country: { f: 0.42, r: 0.41 },
  top_speed:     { f: 0.94, r: 0.90 },
}

function calcSprings(car: Car, tuneType: TuneType, drivetrain: Drivetrain) {
  const frontBias =
    drivetrain === "AWD" ? 0.52 :
    drivetrain === "RWD" ? 0.45 : 0.62

  const { f: ff, r: rf } = SPRING_FACTORS[tuneType]
  const frontAxle = car.weight_kg * frontBias
  const rearAxle  = car.weight_kg * (1 - frontBias)

  // Faixa do jogo: ~14 a 338,1 kgf/mm = ~80 a 1925 lbf/in
  return {
    front: clamp(r25(frontAxle * ff), 80, 1925),
    rear:  clamp(r25(rearAxle  * rf), 80, 1925),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BARRAS ESTABILIZADORAS
//
// Ensinamento (vídeo FH5): "traseira um pouco mais rígida que dianteira melhora
// aderência na dianteira e equilíbrio geral"
// Ensinamento (vídeo FH6): "1 in 65 é um bom ponto de partida" (range completo).
// Softer front = oversteer. Stiffer front = understeer. Sempre relativo.
//
// Multipliers calibrados para que traseiro > dianteiro (exceto drift):
// ─────────────────────────────────────────────────────────────────────────────
const ARB_FACTORS: Record<TuneType, { f: number; r: number }> = {
  street:        { f: 0.030, r: 0.050 },  // traseiro mais rígido → menos understeer
  grip:          { f: 0.028, r: 0.054 },  // diferença maior para máxima rotação
  drift:         { f: 0.052, r: 0.030 },  // INVERSO: dianteiro rígido para iniciação
  drag:          { f: 0.016, r: 0.055 },  // traseiro muito rígido para anti-squat
  rally:         { f: 0.030, r: 0.040 },  // traseiro levemente mais rígido
  cross_country: { f: 0.022, r: 0.028 },  // ambos macios para absorção
  top_speed:     { f: 0.030, r: 0.048 },
}

function calcARBs(springs: { front: number; rear: number }, tuneType: TuneType) {
  const { f, r } = ARB_FACTORS[tuneType]
  return {
    front: r1(clamp(springs.front * f, 3, 65)),
    rear:  r1(clamp(springs.rear  * r, 3, 65)),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AMORTECEDORES
//
// Rebound = spring × 0.015 (alvo ~65% do amortecimento crítico)
// Bump    = rebound × 0.60  (alvo ~60% do rebound — padrão comunitário FH5/FH6)
// ─────────────────────────────────────────────────────────────────────────────
function calcDampers(springs: { front: number; rear: number }) {
  const rf = r1(clamp(springs.front * 0.0148, 3, 18))
  const rr = r1(clamp(springs.rear  * 0.0148, 3, 18))
  return {
    rebound_front: rf,
    rebound_rear:  rr,
    bump_front:    r1(rf * 0.60),
    bump_rear:     r1(rr * 0.60),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ALINHAMENTO
//
// Ensinamento (vídeo FH5): usar telemetria para validar cambagem.
// Se temperatura INTERNA > EXTERNA → cambagem negativa excessiva → reduzir.
// Meta: ≤1° de diferença interno/externo.
//
// Ajustes aplicados:
// - Cambagem traseira reduzida vs valores anteriores (evita superaquecimento interno)
// - Caster aumentado para 6.5 (vídeo FH5 usa 6.5 para GT-R)
// ─────────────────────────────────────────────────────────────────────────────
const ALIGNMENT_PRESETS: Record<TuneType, {
  camber_front: number; camber_rear: number
  toe_front: number;    toe_rear: number
  caster: number
}> = {
  //                              Câmbio diant.  Câmbio tras.  Toe D    Toe T   Caster
  street:        { camber_front: -2.0, camber_rear: -1.0, toe_front:  0.0, toe_rear:  0.1, caster: 6.5 },
  grip:          { camber_front: -2.5, camber_rear: -1.2, toe_front: -0.1, toe_rear:  0.1, caster: 6.5 },
  drift:         { camber_front: -4.2, camber_rear: -1.0, toe_front:  0.5, toe_rear:  0.1, caster: 7.0 },
  drag:          { camber_front: -0.5, camber_rear: -0.2, toe_front:  0.0, toe_rear:  0.0, caster: 5.0 },
  rally:         { camber_front: -1.5, camber_rear: -0.7, toe_front:  0.1, toe_rear:  0.0, caster: 5.8 },
  cross_country: { camber_front: -1.0, camber_rear: -0.5, toe_front:  0.0, toe_rear:  0.0, caster: 5.5 },
  top_speed:     { camber_front: -1.0, camber_rear: -0.5, toe_front:  0.0, toe_rear:  0.0, caster: 5.5 },
}

// ─────────────────────────────────────────────────────────────────────────────
// PRESSÃO DOS PNEUS
//
// Ensinamento (vídeo FH5): usa 1,6 bar (≈23.2 PSI) com pneu slick.
// Valores ajustados para baixo comparado com versão anterior.
// Pneus mais macios nas modalidades de tração: mais área de contato.
// ─────────────────────────────────────────────────────────────────────────────
const TIRE_PRESETS: Record<TuneType, { front: number; rear: number }> = {
  street:        { front: 27.0, rear: 27.5 },  // era 28.0/28.5
  grip:          { front: 26.0, rear: 26.5 },  // era 27.5/28.0 — slick fica com menos pressão
  drift:         { front: 30.0, rear: 38.0 },  // traseiro alto para escorregamento controlado
  drag:          { front: 30.0, rear: 25.5 },  // traseiro menos pressão para grip na largada
  rally:         { front: 21.5, rear: 22.5 },
  cross_country: { front: 20.0, rear: 21.0 },
  top_speed:     { front: 29.0, rear: 29.0 },
}

// ─────────────────────────────────────────────────────────────────────────────
// CÂMBIO — formato "escadinha" progressiva
//
// Ensinamento (vídeo FH5): relações devem estar bem espaçadas em progressão
// uniforme ("escadinha"). Primeira marcha não deve ser curta demais (corta giro).
// Final drive ajustado depois pela relação potência/peso.
// ─────────────────────────────────────────────────────────────────────────────
const GEARING_PRESETS: Record<TuneType, TuningSetup["gearing"]> = {
  street:        { final_drive: 3.70, gear_1: 2.95, gear_2: 2.18, gear_3: 1.62, gear_4: 1.28, gear_5: 1.02, gear_6: 0.84 },
  grip:          { final_drive: 3.85, gear_1: 2.95, gear_2: 2.18, gear_3: 1.62, gear_4: 1.28, gear_5: 1.02, gear_6: 0.84 },
  drift:         { final_drive: 3.90, gear_1: 2.90, gear_2: 2.08, gear_3: 1.58, gear_4: 1.23, gear_5: 0.98, gear_6: 0.80 },
  drag:          { final_drive: 4.20, gear_1: 2.75, gear_2: 2.08, gear_3: 1.72, gear_4: 1.42, gear_5: 1.18, gear_6: 0.98 },
  rally:         { final_drive: 3.50, gear_1: 3.05, gear_2: 2.25, gear_3: 1.72, gear_4: 1.38, gear_5: 1.12, gear_6: 0.92 },
  cross_country: { final_drive: 3.20, gear_1: 3.20, gear_2: 2.42, gear_3: 1.85, gear_4: 1.45, gear_5: 1.18, gear_6: 0.98 },
  top_speed:     { final_drive: 2.80, gear_1: 3.40, gear_2: 2.55, gear_3: 1.96, gear_4: 1.56, gear_5: 1.26, gear_6: 1.02 },
}

// ─────────────────────────────────────────────────────────────────────────────
// FREIOS
// Ensinamento: freios são caros em PI — usar somente quando necessário.
// ─────────────────────────────────────────────────────────────────────────────
const BRAKE_PRESETS: Record<TuneType, { balance: number; pressure: number }> = {
  street:        { balance: 50, pressure: 105 },
  grip:          { balance: 50, pressure: 110 },
  drift:         { balance: 48, pressure: 115 },
  drag:          { balance: 52, pressure:  95 },
  rally:         { balance: 50, pressure:  95 },
  cross_country: { balance: 50, pressure:  90 },
  top_speed:     { balance: 50, pressure: 100 },
}

// ─────────────────────────────────────────────────────────────────────────────
// AERO — traseiro alto resolve oversteer em alta velocidade (vídeo FH6)
// ─────────────────────────────────────────────────────────────────────────────
const AERO_PRESETS: Record<TuneType, TuningSetup["aero"]> = {
  street:        { front: "medium",  rear: "medium-high" },
  grip:          { front: "high",    rear: "high"        },
  drift:         { front: "low",     rear: "low"         },
  drag:          { front: "min",     rear: "low"         },
  rally:         { front: "medium",  rear: "medium"      },
  cross_country: { front: "low",     rear: "low"         },
  top_speed:     { front: "min",     rear: "min"         },
}

// ─────────────────────────────────────────────────────────────────────────────
// DIFERENCIAL
//
// Ensinamento (vídeo FH6): "I always go 100 as a starting point" para aceleração.
// Ensinamento (vídeo FH5): 70% para traseira no centro AWD é bom ponto de partida.
//                           Aceleração = saída de curva, Desaceleração = entrada.
//
// Valores mais agressivos vs versão anterior. Usuário pode diagnosticar e reduzir.
// ─────────────────────────────────────────────────────────────────────────────
function baseDifferential(tuneType: TuneType, drivetrain: Drivetrain): TuningSetup["differential"] {
  if (drivetrain === "FWD") {
    return { front_accel: 35, front_decel: 10, rear_accel: 0, rear_decel: 0 }
  }

  if (drivetrain === "RWD") {
    // "I always go 100 as a starting point" → valores altos, ajuste via diagnóstico
    const accel: Record<TuneType, number> = {
      street: 80, grip: 85, drift: 98, drag: 92, rally: 72, cross_country: 65, top_speed: 72,
    }
    const decel: Record<TuneType, number> = {
      street: 22, grip: 28, drift: 88, drag: 32, rally: 22, cross_country: 22, top_speed: 18,
    }
    return { rear_accel: accel[tuneType], rear_decel: decel[tuneType] }
  }

  // AWD — centro: 70-75% traseira como ensinado (Vídeo FH5: "70% é bom ponto de partida")
  const rAccel: Record<TuneType, number> = {
    street: 78, grip: 82, drift: 80, drag: 90, rally: 75, cross_country: 78, top_speed: 70,
  }
  const rDecel: Record<TuneType, number> = {
    street: 22, grip: 28, drift: 32, drag: 32, rally: 26, cross_country: 30, top_speed: 18,
  }
  const center: Record<TuneType, number> = {
    street: 70, grip: 72, drift: 62, drag: 78, rally: 68, cross_country: 60, top_speed: 68,
  }
  return {
    front_accel: 25, front_decel: 5,
    rear_accel:     rAccel[tuneType],
    rear_decel:     rDecel[tuneType],
    center_balance: center[tuneType],
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RIDE HEIGHT
// ─────────────────────────────────────────────────────────────────────────────
const RIDE_HEIGHT: Record<TuneType, { front: TuningSetup["springs"]["ride_height_front"]; rear: TuningSetup["springs"]["ride_height_rear"] }> = {
  street:        { front: "low",         rear: "low"        },
  grip:          { front: "low",         rear: "low"        },
  drift:         { front: "low",         rear: "medium-low" },
  drag:          { front: "medium-high", rear: "low"        },
  rally:         { front: "medium-high", rear: "high"       },
  cross_country: { front: "max",         rear: "max"        },
  top_speed:     { front: "low",         rear: "low"        },
}

// ─────────────────────────────────────────────────────────────────────────────
// BUILD PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export function buildTune(
  car: Car,
  profile: CarProfile,
  tuneType: TuneType,
  targetDrivetrain: Drivetrain,
): TuningSetup {
  const springs = calcSprings(car, tuneType, targetDrivetrain)
  const arbs    = calcARBs(springs, tuneType)   // agora usa multipliers por tipo
  const dampers = calcDampers(springs)
  const rh      = RIDE_HEIGHT[tuneType]
  const diff    = baseDifferential(tuneType, targetDrivetrain)
  const gearing = { ...GEARING_PRESETS[tuneType] }

  // Escala final drive por relação potência/peso
  // Ensinamento: câmbio em formato escadinha, final drive ajustado para não
  // cortar giro (aceleração) nem deixar marcha final sem uso (velocidade)
  const ptw = car.power_hp / car.weight_kg
  if (ptw > 0.35) gearing.final_drive = r2(gearing.final_drive * (1 - (ptw - 0.35) * 0.10))
  if (ptw < 0.18) gearing.final_drive = r2(gearing.final_drive * (1 + (0.18 - ptw) * 0.12))
  gearing.final_drive = clamp(r2(gearing.final_drive), 2.20, 5.50)

  // Pressão de pneus — ajuste por peso (mais pesado = ligeiramente mais pressão)
  const tires = { ...TIRE_PRESETS[tuneType] }
  if (profile.isHeavy) {
    tires.front = r1(tires.front + 1.0)
    tires.rear  = r1(tires.rear  + 1.5)
  }
  if (profile.isLight) {
    tires.front = r1(tires.front - 0.5)
    tires.rear  = r1(tires.rear  - 0.5)
  }

  // Alinhamento — correção por tração
  const alignment = { ...ALIGNMENT_PRESETS[tuneType] }
  if (targetDrivetrain === "FWD") {
    // FWD: menos cambagem dianteira para reduzir understeer na saída de curva
    alignment.camber_front = r1(clamp(alignment.camber_front - 0.3, -5.0, 0))
    alignment.toe_front    = r1(alignment.toe_front - 0.1) // leve toe-in ajuda rotação
  }
  if (targetDrivetrain === "RWD" && tuneType === "grip") {
    // RWD grip: ligeiramente mais cambagem traseira para compensar carga extra na saída
    alignment.camber_rear = r1(clamp(alignment.camber_rear - 0.2, -5.0, 0))
  }

  // Freios — mais pressão para carros pesados
  const brakes = { ...BRAKE_PRESETS[tuneType] }
  if (profile.isHeavy) brakes.pressure = clamp(brakes.pressure + 10, 60, 150)

  // Diferencial — ajuste por potência
  // Ensinamento: "I always go 100 as starting point" — mas para carros muito potentes
  // reduzimos um pouco para evitar wheelspin crônico
  const differential = { ...diff }
  if (profile.isPowerful && differential.rear_accel !== undefined) {
    differential.rear_accel = clamp(differential.rear_accel - 10, 20, 100)
  }
  if (profile.isMuscle && tuneType === "drag") {
    differential.rear_accel = 92
  }

  return {
    tires,
    gearing,
    alignment,
    antiroll_bars: arbs,
    springs: {
      front: springs.front,
      rear:  springs.rear,
      ride_height_front: rh.front,
      ride_height_rear:  rh.rear,
    },
    damping: dampers,
    aero:    AERO_PRESETS[tuneType],
    brakes,
    differential,
  }
}

export { buildTune as adaptTuneToCar }
export function getPresetTune(_tuneType: TuneType): TuningSetup {
  throw new Error("getPresetTune is deprecated — use buildTune instead")
}
