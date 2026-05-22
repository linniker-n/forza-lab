"use client"

import { useMemo, useState } from "react"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { calculateAdvancedGearing } from "@/lib/tune-engine/gearing-calculator"
import type { AdvancedGearingInput, Drivetrain, Gearing, TuneIntent } from "@/types"

/* ── Tutorial colapsável ── */
function GearingTutorial() {
  const [open, setOpen] = useState(false)

  const fields = [
    {
      name: "Redline RPM",
      what: "A rotação máxima do motor antes do corte de ignição (zona vermelha).",
      how: "Ative a telemetria no jogo (D-pad esquerdo) e observe o indicador de RPM. O valor onde a linha entra no vermelho é o seu redline.",
    },
    {
      name: "Velocidade alvo (km/h)",
      what: "A velocidade máxima que você quer atingir na última marcha a plena aceleração.",
      how: "Se a pista mais longa do evento tem uma reta de ~1.5 km, estime a velocidade máxima que seu carro consegue atingir nela. Não precisa ser exata — ajuste depois.",
    },
    {
      name: "Marchas",
      what: "Número de marchas do câmbio instalado (6, 7, 8...).",
      how: "Verifique na página de aprimoramentos do carro qual câmbio você instalou. Race Transmission de 7 marchas = '7'.",
    },
    {
      name: "Final Drive",
      what: "Multiplica todas as relações — menor = mais velocidade final, maior = mais aceleração.",
      how: "Esse é o ajuste mais importante. A calculadora recomenda um valor, mas você pode refinar: se o carro não chega à velocidade desejada, reduza. Se acelera muito rápido mas perde na reta, também reduza.",
    },
    {
      name: "Relação da 1ª",
      what: "Controla a aceleração de saída. Muito alta = carro corta giro na largada.",
      how: "Se o carro está 'cortando giro' (batendo no limitador) logo ao largar, aumente esse valor para uma relação mais longa.",
    },
    {
      name: "Vel. máx. em 1ª (opcional)",
      what: "Velocidade que o carro atinge ao final da 1ª marcha, no redline.",
      how: "Útil para calibrar com precisão. Deixe em branco se não souber — a calculadora estima automaticamente.",
    },
  ]

  const objectives = [
    { label: "Balanceado", desc: "Espaçamento uniforme. Bom para circuitos técnicos e corridas mistas." },
    { label: "Controle",   desc: "Mais marchas no meio do range. Ideal para carros difíceis de controlar." },
    { label: "Velocidade", desc: "Relações espalhadas para maximizar top speed. Bom para pistas rápidas." },
    { label: "Curvas",     desc: "Mais opções de marcha na faixa de torque. Ajuda na saída de curva." },
    { label: "Aceleração", desc: "Marchas curtas para aceleração máxima. Ideal para drag e reta." },
  ]

  return (
    <div className="r-card anim-up" style={{ animationDelay: "20ms" }}>
      {/* Header clicável */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-5"
        style={{ background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <div className="flex items-center gap-3">
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "var(--blue-dim)", border: "1px solid var(--border-blue)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="var(--blue-bright)" strokeWidth="1.4"/>
              <path d="M8 5v4M8 10.5v.5" stroke="var(--blue-bright)" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Como usar a Calculadora de Câmbio</p>
            <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Clique para {open ? "fechar" : "abrir"} o tutorial de uso
            </p>
          </div>
        </div>
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          style={{ flexShrink: 0, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none" }}
        >
          <path d="M4 6l4 4 4-4" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-6 space-y-6" style={{ borderTop: "1px solid var(--border)" }}>

          {/* O que é */}
          <div className="pt-5 space-y-2">
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              O que é
            </p>
            <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.7 }}>
              A Calculadora de Câmbio gera as <strong style={{ color: "var(--text)" }}>relações de marcha ideais</strong> para o seu
              carro e objetivo. Em vez de ajustar cada marcha manualmente no jogo, você informa os dados do motor e da pista —
              e recebe os valores prontos para copiar no Forza.
            </p>
          </div>

          {/* Passo a passo */}
          <div className="space-y-3">
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Fluxo recomendado
            </p>
            <div className="space-y-2">
              {[
                { n: "1", title: "Abra a telemetria no Forza", desc: "Pressione D-pad esquerdo para ativar o painel de telemetria. Anote o Redline RPM (onde a linha entra no vermelho)." },
                { n: "2", title: "Defina sua velocidade alvo", desc: "Rode algumas voltas e observe a velocidade máxima que consegue atingir. Esse será o valor de 'Velocidade alvo'." },
                { n: "3", title: "Informe potência e peso", desc: "Veja nas Estatísticas do carro (botão Y no jogo). Esses dados ajudam a calibrar a relação de 1ª marcha." },
                { n: "4", title: "Escolha o objetivo", desc: "Balanceado funciona para a maioria. Velocidade para pistas rápidas. Aceleração para drag. Curvas para circuitos técnicos." },
                { n: "5", title: "Copie os valores para o jogo", desc: "Vá em Configuração de Tune → Câmbio. Ajuste cada marcha conforme o resultado. O 'Final Drive' é o mais importante — comece por ele." },
              ].map(({ n, title, desc }) => (
                <div key={n} className="flex gap-3">
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                    background: "var(--blue-dim)", border: "1px solid var(--border-blue)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 800, color: "var(--blue-bright)",
                    fontFamily: "var(--font-geist-mono)",
                  }}>
                    {n}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{title}</p>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.55, marginTop: 2 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Campos */}
          <div className="space-y-3">
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              O que cada campo significa
            </p>
            <div className="space-y-2">
              {fields.map(({ name, what, how }) => (
                <div key={name} className="rounded-lg p-3 space-y-1"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{name}</p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.55 }}>{what}</p>
                  <p style={{ fontSize: 11, color: "var(--blue-bright)", lineHeight: 1.55 }}>
                    <span style={{ fontWeight: 700 }}>Como obter: </span>{how}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Objetivos */}
          <div className="space-y-3">
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Objetivos disponíveis
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {objectives.map(({ label, desc }) => (
                <div key={label} className="flex items-start gap-2 rounded-lg p-3"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 4, flexShrink: 0, marginTop: 1,
                    background: "var(--blue-dim)", color: "var(--blue-bright)", border: "1px solid var(--border-blue)" }}>
                    {label}
                  </span>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.55 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Dica importante */}
          <div className="flex gap-3 rounded-lg p-4"
            style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)" }}>
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>💡</span>
            <div className="space-y-1">
              <p style={{ fontSize: 12, fontWeight: 700, color: "#fbbf24" }}>Dica: formato "escadinha"</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
                Relações de marcha bem ajustadas formam uma progressão uniforme — cada marcha tem um espaço
                parecido com a anterior. Se você visualizar os números em ordem, devem parecer uma escada.
                Se houver um "degrau" muito grande entre duas marchas, o carro vai perder aceleração naquele ponto.
                Use os resultados da calculadora como ponto de partida e ajuste a marcha problemática ±0.10.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const INTENTS: { value: TuneIntent; label: string }[] = [
  { value: "balanced", label: "Balanceado" },
  { value: "control", label: "Controle" },
  { value: "speed", label: "Velocidade" },
  { value: "cornering", label: "Curvas" },
  { value: "acceleration", label: "Aceleracao" },
]

const DRIVETRAINS: Drivetrain[] = ["AWD", "RWD", "FWD"]
const GEAR_KEYS = ["gear_1", "gear_2", "gear_3", "gear_4", "gear_5", "gear_6", "gear_7", "gear_8", "gear_9", "gear_10"] as const

function numeric(value: string, fallback: number): number {
  const parsed = Number(value.replace(",", "."))
  return Number.isFinite(parsed) ? parsed : fallback
}

function optionalNumeric(value: string): number | undefined {
  if (!value.trim()) return undefined
  const parsed = Number(value.replace(",", "."))
  return Number.isFinite(parsed) ? parsed : undefined
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function baseGearing(finalDrive: number, firstGear: number): Gearing {
  return {
    final_drive: finalDrive,
    gear_1: firstGear,
    gear_2: 2.18,
    gear_3: 1.62,
    gear_4: 1.28,
    gear_5: 1.02,
    gear_6: 0.84,
  }
}

export default function CalculatorPage() {
  const [redlineRpm, setRedlineRpm] = useState("7500")
  const [targetSpeedKmh, setTargetSpeedKmh] = useState("320")
  const [numberOfGears, setNumberOfGears] = useState("6")
  const [currentFinalDrive, setCurrentFinalDrive] = useState("3.70")
  const [currentFirstGear, setCurrentFirstGear] = useState("2.95")
  const [firstGearSpeedKmh, setFirstGearSpeedKmh] = useState("")
  const [powerHp, setPowerHp] = useState("600")
  const [weightKg, setWeightKg] = useState("1450")
  const [drivetrain, setDrivetrain] = useState<Drivetrain>("AWD")
  const [intent, setIntent] = useState<TuneIntent>("balanced")

  const result = useMemo(() => {
    const finalDrive = clamp(optionalNumeric(currentFinalDrive) ?? 3.7, 2.2, 5.5)
    const firstGear = clamp(optionalNumeric(currentFirstGear) ?? 2.95, 2.2, 4.2)
    const input: AdvancedGearingInput = {
      redline_rpm: Math.round(clamp(numeric(redlineRpm, 7500), 4500, 11000)),
      target_speed_kmh: Math.round(clamp(numeric(targetSpeedKmh, 320), 120, 520)),
      number_of_gears: Math.round(clamp(numeric(numberOfGears, 6), 6, 10)),
      current_final_drive: optionalNumeric(currentFinalDrive),
      current_first_gear: optionalNumeric(currentFirstGear),
      first_gear_speed_kmh: optionalNumeric(firstGearSpeedKmh),
    }

    return calculateAdvancedGearing(input, {
      base: baseGearing(finalDrive, firstGear),
      intent,
      drivetrain,
      powerHp: clamp(numeric(powerHp, 600), 40, 1800),
      weightKg: clamp(numeric(weightKg, 1450), 300, 3500),
    })
  }, [
    currentFinalDrive,
    currentFirstGear,
    drivetrain,
    firstGearSpeedKmh,
    intent,
    numberOfGears,
    powerHp,
    redlineRpm,
    targetSpeedKmh,
    weightKg,
  ])

  return (
    <RequireAuth>
      <div className="dot-grid" style={{ minHeight: "100dvh" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
          <div className="anim-up">
            <p className="section-label">Calculadora</p>
            <h1 className="page-title">Câmbio</h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.6 }}>
              Gera relações de marcha otimizadas para seu carro, pista e objetivo.
              Copie os valores direto para o Forza.
            </p>
          </div>

          <GearingTutorial />

          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-4">
            <section className="r-card bracket p-5 space-y-5 anim-up" style={{ animationDelay: "40ms" }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="calc-label">Redline RPM</span>
                  <input className="r-input" value={redlineRpm} onChange={(event) => setRedlineRpm(event.target.value)} inputMode="numeric" />
                </label>
                <label className="space-y-1">
                  <span className="calc-label">Velocidade alvo km/h</span>
                  <input className="r-input" value={targetSpeedKmh} onChange={(event) => setTargetSpeedKmh(event.target.value)} inputMode="numeric" />
                </label>
                <label className="space-y-1">
                  <span className="calc-label">Marchas</span>
                  <input className="r-input" value={numberOfGears} onChange={(event) => setNumberOfGears(event.target.value)} inputMode="numeric" />
                </label>
                <label className="space-y-1">
                  <span className="calc-label">Final drive atual</span>
                  <input className="r-input" value={currentFinalDrive} onChange={(event) => setCurrentFinalDrive(event.target.value)} inputMode="decimal" />
                </label>
                <label className="space-y-1">
                  <span className="calc-label">Relacao da 1a atual</span>
                  <input className="r-input" value={currentFirstGear} onChange={(event) => setCurrentFirstGear(event.target.value)} inputMode="decimal" />
                </label>
                <label className="space-y-1">
                  <span className="calc-label">Velocidade maxima em 1a</span>
                  <input className="r-input" value={firstGearSpeedKmh} onChange={(event) => setFirstGearSpeedKmh(event.target.value)} inputMode="decimal" placeholder="Opcional" />
                </label>
                <label className="space-y-1">
                  <span className="calc-label">Potencia hp</span>
                  <input className="r-input" value={powerHp} onChange={(event) => setPowerHp(event.target.value)} inputMode="decimal" />
                </label>
                <label className="space-y-1">
                  <span className="calc-label">Peso kg</span>
                  <input className="r-input" value={weightKg} onChange={(event) => setWeightKg(event.target.value)} inputMode="decimal" />
                </label>
              </div>

              <div className="space-y-2">
                <p className="calc-label">Objetivo</p>
                <div className="flex flex-wrap gap-2">
                  {INTENTS.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      className={`filter-chip${intent === item.value ? " active" : ""}`}
                      onClick={() => setIntent(item.value)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="calc-label">Tracao</p>
                <div className="flex flex-wrap gap-2">
                  {DRIVETRAINS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`filter-chip${drivetrain === item ? " active" : ""}`}
                      onClick={() => setDrivetrain(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="r-card bracket p-5 space-y-4 anim-up" style={{ animationDelay: "80ms" }}>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="section-label">Resultado</p>
                  <h2 style={{ fontSize: 22, fontWeight: 850, color: "var(--text)", lineHeight: 1.1 }}>
                    Final {result.final_drive.toFixed(2)}
                  </h2>
                </div>
                <span className={`badge-class badge-${drivetrain.toLowerCase()}`}>{drivetrain}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {GEAR_KEYS.filter((key) => result[key] !== undefined).map((key, index) => (
                  <div
                    key={key}
                    className="rounded-lg p-3"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}
                  >
                    <p className="calc-label">{index + 1}a marcha</p>
                    <p className="mono-val" style={{ fontSize: 24, color: "var(--text)", marginTop: 2 }}>
                      {result[key]?.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </RequireAuth>
  )
}
