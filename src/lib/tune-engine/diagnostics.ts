import type { Car, DiagnosticFix, DiagnosticProblem, DiagnosticResult, TuneType } from "@/types"

interface DiagnosticContext {
  car?: Car
  tuneType?: TuneType
}

const FIXES: Record<DiagnosticProblem, { diagnosis: string; fixes: DiagnosticFix[] }> = {
  understeer: {
    diagnosis:
      "O carro está saindo de frente porque há excesso de grip ou trava no eixo dianteiro, ou falta de rotação traseira.",
    fixes: [
      { parameter: "Barra estabilizadora dianteira", adjustment: "−3 pontos", reason: "Reduz rigidez dianteira, deixa a frente virar mais" },
      { parameter: "Barra estabilizadora traseira", adjustment: "+2 pontos", reason: "Aumenta rigidez traseira, melhora rotação" },
      { parameter: "Diferencial dianteiro (aceleração)", adjustment: "−5%", reason: "Menos trava na frente melhora a entrada em curva" },
      { parameter: "Diferencial central (AWD)", adjustment: "+5% para traseira", reason: "Mais torque na traseira ajuda a rotacionar" },
      { parameter: "Pressão dos pneus dianteiros", adjustment: "−0.5 PSI", reason: "Mais contato com o asfalto na dianteira" },
      { parameter: "Aero dianteiro", adjustment: "+médio", reason: "Mais downforce na frente gera mais grip de curva" },
    ],
  },
  oversteer: {
    diagnosis:
      "O carro escapa de traseira porque o eixo traseiro perde aderência antes do dianteiro. Pode ser excesso de torque, diferencial agressivo ou suspensão inadequada.",
    fixes: [
      { parameter: "Barra estabilizadora dianteira", adjustment: "+3 pontos", reason: "Mais rigidez dianteira reduz a rotação excessiva" },
      { parameter: "Barra estabilizadora traseira", adjustment: "−2 pontos", reason: "Menos rigidez traseira dá mais aderência à traseira" },
      { parameter: "Diferencial traseiro (aceleração)", adjustment: "−10%", reason: "Menos trava em aceleração evita perda de traseira" },
      { parameter: "Molas traseiras", adjustment: "Amaciar levemente", reason: "Traseira mais macia mantém contato com o piso" },
      { parameter: "Aero traseiro", adjustment: "+médio", reason: "Mais downforce na traseira melhora aderência" },
      { parameter: "Pressão dos pneus traseiros", adjustment: "−0.5 PSI", reason: "Mais área de contato na traseira" },
    ],
  },
  wheelspin: {
    diagnosis:
      "Os pneus traseiros estão patinando na saída, indicando que o torque está sendo aplicado mais rápido do que os pneus conseguem absorver.",
    fixes: [
      { parameter: "1ª e 2ª marcha", adjustment: "Alongar levemente", reason: "Marcha mais longa reduz torque instantâneo" },
      { parameter: "Diferencial traseiro (aceleração)", adjustment: "−10 a −15%", reason: "Menos trava permite que as rodas girem mais livres" },
      { parameter: "Pressão dos pneus traseiros", adjustment: "−1.0 PSI", reason: "Mais borracha em contato com o asfalto" },
      { parameter: "Largura dos pneus traseiros", adjustment: "+1 largura", reason: "Pneu mais largo distribui melhor o torque" },
      { parameter: "Molas traseiras", adjustment: "Amaciar levemente", reason: "Melhor absorção na saída mantém o pneu no chão" },
    ],
  },
  slow_cornering: {
    diagnosis:
      "O carro não está girando bem em curvas. Pode ser understeeer, suspensão muito rígida ou pneus insuficientes.",
    fixes: [
      { parameter: "Cambagem dianteira", adjustment: "Aumentar em −0.3", reason: "Mais cambagem melhora contato do pneu em curva" },
      { parameter: "Toe dianteiro", adjustment: "−0.1 para dentro", reason: "Leve toe-in na dianteira melhora precisão" },
      { parameter: "Barra dianteira", adjustment: "−2 pontos", reason: "Menos rigidez dianteira permite que o carro role mais" },
      { parameter: "Pressão dos pneus", adjustment: "−0.5 PSI em ambos", reason: "Mais contato com o piso melhora grip geral" },
      { parameter: "Aero dianteiro", adjustment: "+médio", reason: "Downforce extra gera mais grip de curva" },
    ],
  },
  slow_straight: {
    diagnosis:
      "O carro está lento em reta. Pode ser câmbio mal configurado, aero excessivo ou falta de potência.",
    fixes: [
      { parameter: "Última marcha", adjustment: "Alongar final drive", reason: "Mais comprimento na última marcha = mais velocidade final" },
      { parameter: "Aero traseiro", adjustment: "Reduzir", reason: "Menos downforce = menos arrasto = mais velocidade" },
      { parameter: "Aero dianteiro", adjustment: "Reduzir", reason: "Menos resistência frontal ao ar" },
      { parameter: "Pressão dos pneus", adjustment: "+0.5 PSI", reason: "Mais pressão reduz resistência de rolamento" },
    ],
  },
  bouncing: {
    diagnosis:
      "O carro está pulando ou rebotando, indicando amortecimento inadequado ou altura de suspensão muito alta.",
    fixes: [
      { parameter: "Rebound (rebote)", adjustment: "+1.5 pontos", reason: "Rebound mais alto controla melhor o movimento da suspensão" },
      { parameter: "Bump (compressão)", adjustment: "+0.8 pontos", reason: "Compressão mais rígida evita mergulho excessivo" },
      { parameter: "Molas", adjustment: "Aumentar levemente", reason: "Mola mais rígida reduz amplitude de oscilação" },
      { parameter: "Altura de suspensão", adjustment: "Reduzir levemente", reason: "Menor altura reduz movimento de pitch e roll" },
    ],
  },
  drift_loss: {
    diagnosis:
      "O carro está perdendo o drift, ou fecha rápido demais ou não mantém ângulo. Pode ser diferencial muito aberto ou pneus com grip excessivo.",
    fixes: [
      { parameter: "Diferencial traseiro (aceleração)", adjustment: "+10%", reason: "Mais trava mantém as rodas girando em ângulo" },
      { parameter: "Diferencial traseiro (desaceleração)", adjustment: "+10%", reason: "Mais trava ao soltar o gás sustenta o drift" },
      { parameter: "Pressão dos pneus traseiros", adjustment: "+2 PSI", reason: "Mais pressão reduz grip e facilita o deslizamento" },
      { parameter: "Cambagem dianteira", adjustment: "Aumentar em −0.3", reason: "Mais cambagem melhora resposta de direção no drift" },
      { parameter: "Toe dianteiro", adjustment: "+0.2 para fora", reason: "Ajuda a manter ângulo no drift" },
    ],
  },
  brake_instability: {
    diagnosis:
      "O carro está instável na frenagem, podendo travar rodas ou desviar de trajetória.",
    fixes: [
      { parameter: "Balanceamento de freios", adjustment: "Mover para frente (+2%)", reason: "Mais frenagem dianteira = mais estabilidade em linha reta" },
      { parameter: "Pressão de freio", adjustment: "−10%", reason: "Menos pressão evita travamento das rodas" },
      { parameter: "Barra dianteira", adjustment: "+2 pontos", reason: "Mais rigidez dianteira reduz oscilação na frenagem" },
      { parameter: "Rebound dianteiro", adjustment: "+1 ponto", reason: "Mais controle do mergulho dianteiro na frenagem" },
    ],
  },
}

export function diagnose(problem: DiagnosticProblem, context: DiagnosticContext = {}): DiagnosticResult {
  const data = FIXES[problem]
  const fixes = [...data.fixes]
  const contextNotes: string[] = []

  if (context.car) {
    const carLabel = `${context.car.brand} ${context.car.model}`
    contextNotes.push(`Contexto aplicado: ${carLabel} ${context.car.year}, ${context.car.drivetrain}, ${context.car.weight_kg} kg.`)

    if (context.car.weight_kg > 1800 && ["understeer", "slow_cornering", "brake_instability"].includes(problem)) {
      fixes.push({
        parameter: "Redução de peso",
        adjustment: "Priorizar upgrade máximo",
        reason: "Carros pesados exigem menos massa antes de ganhar potência para manter frenagem e entrada de curva previsíveis",
      })
    }

    if (context.car.power_hp > 650 && ["wheelspin", "oversteer"].includes(problem)) {
      fixes.push({
        parameter: "Câmbio e acelerador",
        adjustment: "Alongar 1ª/2ª e reduzir agressividade",
        reason: "Potência alta entrega torque rápido demais para pneus frios ou traseira pouco carregada",
      })
    }

    if (context.car.drivetrain === "FWD" && ["understeer", "slow_cornering"].includes(problem)) {
      fixes.push({
        parameter: "Diferencial dianteiro",
        adjustment: "Reduzir aceleração em 5% a 10%",
        reason: "FWD muito travado empurra o carro para fora da curva quando acelera",
      })
    }
  }

  if (context.tuneType === "rally" || context.tuneType === "cross_country") {
    if (problem === "bouncing" || problem === "brake_instability") {
      contextNotes.push("Tune off-road detectada: as correções priorizam absorção e estabilidade em piso irregular.")
      fixes.push({
        parameter: "Altura e bump",
        adjustment: "Aumentar altura e manter bump em 55% a 60% do rebound",
        reason: "Evita batida de suspensão sem deixar o carro quicar em sequência de ondulações",
      })
    }
  }

  if (context.tuneType === "drift" && problem === "drift_loss") {
    contextNotes.push("Tune de drift detectada: mantenha a análise focada em diferencial, pressão traseira e marcha útil.")
  }

  return {
    problem,
    diagnosis: data.diagnosis,
    fixes,
    context_notes: contextNotes,
  }
}

export const PROBLEM_LABELS: Record<DiagnosticProblem, string> = {
  understeer: "Carro sai muito de frente (understeer)",
  oversteer: "Carro escapa de traseira (oversteer)",
  wheelspin: "Carro patina muito na saída",
  slow_cornering: "Carro não faz curva / lento em curva",
  slow_straight: "Carro está lento em reta",
  bouncing: "Carro pula / rebota demais",
  drift_loss: "Carro não segura o drift",
  brake_instability: "Carro instável na frenagem",
}
