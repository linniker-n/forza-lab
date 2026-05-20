/**
 * Motor de diagnóstico de tune — Forza Horizon 6
 *
 * Baseado nos ensinamentos dos vídeos:
 *  • FH5 PT-BR (IDlPbm9i3EA): metodologia de uma alteração por vez,
 *    telemetria de temperatura de pneu, barras estabilizadoras, câmbio escadinha
 *  • FH6 Pro Tips (BfoNrIbj6N8): aero traseiro, diferencial agressivo,
 *    freio traseiro vs balanceamento
 */

import type { Car, DiagnosticBehavior, DiagnosticFix, DiagnosticPhase, DiagnosticProblem, DiagnosticResult, TuneIntent, TuneType } from "@/types"

interface DiagnosticContext {
  car?: Car
  tuneType?: TuneType
  intent?: TuneIntent
  phase?: DiagnosticPhase
  behavior?: DiagnosticBehavior
}

const FIXES: Record<DiagnosticProblem, { diagnosis: string; fixes: DiagnosticFix[] }> = {
  understeer: {
    diagnosis:
      "O carro está saindo de frente porque a dianteira tem mais resistência à rotação do que a traseira. " +
      "Na telemetria, você verá que o pneu dianteiro externo esquenta mais do que o interno — sinal de que está trabalhando no limite.",
    fixes: [
      {
        parameter: "Barra estabilizadora dianteira",
        adjustment: "−3 a −5 pontos",
        reason: "Esta é a correção mais eficaz. Barra dianteira mais mole deixa o carro girar mais na entrada de curva. " +
                "Faça uma alteração por vez e cronometre a diferença de volta.",
      },
      {
        parameter: "Barra estabilizadora traseira",
        adjustment: "+2 a +3 pontos",
        reason: "Traseira mais rígida aumenta a tendência de rotação. Ajuste combinado com a dianteira.",
      },
      {
        parameter: "Diferencial dianteiro (aceleração)",
        adjustment: "−5% a −10%",
        reason: "Diferencial dianteiro muito travado empurra o carro para fora na saída de curva. " +
                "Reduza a aceleração para que as rodas dianteiras girem mais livremente.",
      },
      {
        parameter: "Diferencial central (AWD)",
        adjustment: "+5% para traseira",
        reason: "Mais torque na traseira ajuda a rotacionar o carro. Ensinamento: 70% traseira é bom ponto de partida.",
      },
      {
        parameter: "Pressão dos pneus dianteiros",
        adjustment: "−0.5 PSI",
        reason: "Menos pressão aumenta a área de contato do pneu com o asfalto, melhorando grip na curva.",
      },
      {
        parameter: "Cambagem dianteira",
        adjustment: "−0.3° (mais negativa)",
        reason: "Mais cambagem negativa melhora contato do pneu em curva. Valide na telemetria: " +
                "se temperatura interna > externa, reduza cambagem.",
      },
    ],
  },

  oversteer: {
    diagnosis:
      "A traseira está perdendo aderência antes da dianteira. Pode ser diferencial agressivo demais, " +
      "barra traseira muito rígida, ou cambagem traseira excessiva. " +
      "Na telemetria: pneu traseiro externo esquentando muito = sinal de oversteer estrutural.",
    fixes: [
      {
        parameter: "Barra estabilizadora dianteira",
        adjustment: "+2 a +4 pontos",
        reason: "Dianteira mais rígida transfere mais carga para o eixo traseiro, reduzindo rotação excessiva.",
      },
      {
        parameter: "Barra estabilizadora traseira",
        adjustment: "−2 a −4 pontos",
        reason: "Traseira mais mole dá mais aderência à traseira. " +
                "Lembre: softer rear = understeer. Encontre o equilíbrio.",
      },
      {
        parameter: "Diferencial traseiro (aceleração)",
        adjustment: "−8% a −15%",
        reason: "Diferencial muito travado solta a traseira na saída. " +
                "Partimos de valores altos (100) — agora reduza até o carro ficar estável.",
      },
      {
        parameter: "Aero traseiro",
        adjustment: "+1 nível (ex: médio → alto)",
        reason: "Ensinamento (FH6): se o carro está solto em alta velocidade, aumente o downforce traseiro. " +
                "Isso estabiliza a traseira sem prejudicar a entrada de curva.",
      },
      {
        parameter: "Cambagem traseira",
        adjustment: "+0.3° (menos negativa)",
        reason: "Excesso de cambagem negativa na traseira pode causar instabilidade. " +
                "Use telemetria: se o pneu traseiro está com interno MUITO mais quente que externo, " +
                "reduza a cambagem traseira.",
      },
      {
        parameter: "Pressão dos pneus traseiros",
        adjustment: "−0.5 PSI",
        reason: "Mais área de contato na traseira aumenta aderência e reduz tendência ao oversteer.",
      },
    ],
  },

  wheelspin: {
    diagnosis:
      "Os pneus traseiros estão patinando na saída porque o torque está sendo aplicado " +
      "mais rápido do que os pneus conseguem absorver. Comum em carros de alta potência e em largadas.",
    fixes: [
      {
        parameter: "Diferencial traseiro (aceleração)",
        adjustment: "−10% a −18%",
        reason: "Diferencial menos travado permite que as rodas girem mais individualmente, " +
                "reduzindo patinagem. Partimos de 100 — reduza gradualmente.",
      },
      {
        parameter: "1ª e 2ª marcha",
        adjustment: "Alongar (reduzir ratio)",
        reason: "Ensinamento: se a primeira marcha está cortando giro, ajuste a transmissão final " +
                "para trás (aumentar). Relações de marcha em 'escadinha' evitam torque brusco.",
      },
      {
        parameter: "Pressão dos pneus traseiros",
        adjustment: "−1.0 PSI",
        reason: "Menos pressão = mais borracha no asfalto = melhor absorção do torque na saída.",
      },
      {
        parameter: "Molas traseiras",
        adjustment: "Amaciar −25 kgf/mm (ou −150 lbf/in)",
        reason: "Traseira mais mole melhora absorção na saída, mantendo o pneu em contato com o piso.",
      },
      {
        parameter: "Largura dos pneus traseiros",
        adjustment: "+1 largura (se disponível)",
        reason: "Pneu mais largo distribui melhor o torque. Dica: pneu traseiro mais largo pode até " +
                "reduzir o PI do carro enquanto aumenta aderência.",
      },
    ],
  },

  slow_cornering: {
    diagnosis:
      "O carro não está girando bem em curvas. Normalmente é understeer estrutural, " +
      "suspensão muito rígida ou cambagem inadequada. Verifique temperatura dos pneus na telemetria.",
    fixes: [
      {
        parameter: "Cambagem dianteira",
        adjustment: "−0.3° (mais negativa)",
        reason: "Mais cambagem dianteira melhora contato do pneu em curva. " +
                "Valide: temperatura interna deve ser ≤1° acima da externa. Se muito maior, reduza.",
      },
      {
        parameter: "Barra estabilizadora dianteira",
        adjustment: "−2 a −4 pontos",
        reason: "Barra mais mole na frente permite maior rotação. " +
                "É a principal alavanca para melhorar entrada de curva.",
      },
      {
        parameter: "Toe dianteiro",
        adjustment: "−0.1° (leve toe-in)",
        reason: "Leve convergência na dianteira melhora precisão de direção e resposta à entrada.",
      },
      {
        parameter: "Pressão dos pneus",
        adjustment: "−0.5 PSI (ambos os eixos)",
        reason: "Mais contato com o piso melhora grip geral. " +
                "Ensinamento: dar 2-3 voltas para o pneu esquentar antes de julgar a cambagem.",
      },
      {
        parameter: "Caster",
        adjustment: "+0.5° (aumentar)",
        reason: "Caster maior (6.5° é bom para a maioria) melhora estabilidade em linha reta " +
                "e retorno da direção após a curva.",
      },
    ],
  },

  slow_straight: {
    diagnosis:
      "O carro está lento em reta. Pode ser câmbio mal configurado, aero excessivo " +
      "ou a última marcha não está sendo totalmente utilizada na pista.",
    fixes: [
      {
        parameter: "Transmissão final (Final Drive)",
        adjustment: "Reduzir (menos aceleração, mais velocidade)",
        reason: "Ensinamento: se o carro chega a 350 km/h na pista mas você configurou para 375, " +
                "a última marcha não é usada. Reduza o final drive até a 6ª marcha ser aproveitada.",
      },
      {
        parameter: "Aero traseiro",
        adjustment: "−1 nível (ex: alto → médio)",
        reason: "Menos downforce = menos arrasto = mais velocidade em reta. " +
                "Mas atenção: reduzir aero traseiro aumenta risco de oversteer em alta velocidade.",
      },
      {
        parameter: "Aero dianteiro",
        adjustment: "−1 nível",
        reason: "Menos resistência frontal ao ar melhora velocidade máxima.",
      },
      {
        parameter: "Pressão dos pneus",
        adjustment: "+0.5 PSI",
        reason: "Mais pressão reduz resistência de rolamento.",
      },
    ],
  },

  bouncing: {
    diagnosis:
      "O carro está pulando ou rebotando porque o amortecimento está inadequado " +
      "ou a altura de suspensão está muito elevada para o terreno.",
    fixes: [
      {
        parameter: "Rebound (retorno) dianteiro e traseiro",
        adjustment: "+1.5 pontos (cada)",
        reason: "Rebound mais alto controla melhor o movimento da suspensão ao comprimir e voltar. " +
                "Fórmula base: Rebound = spring × 0.015. Se pulando, aumente em 1.5.",
      },
      {
        parameter: "Bump (compressão) dianteiro e traseiro",
        adjustment: "+0.8 pontos (cada)",
        reason: "Compressão mais rígida evita mergulho excessivo nas lombadas. " +
                "Mantenha Bump ≈ 60% do Rebound.",
      },
      {
        parameter: "Molas",
        adjustment: "+25 kgf/mm (ou +150 lbf/in)",
        reason: "Mola mais rígida reduz amplitude de oscilação. Aumente um pouco e teste.",
      },
      {
        parameter: "Altura de suspensão",
        adjustment: "Reduzir um nível",
        reason: "Menor altura reduz movimento de pitch e roll. " +
                "Para rally/cross-country, mantenha alta para não bater o chassis.",
      },
    ],
  },

  drift_loss: {
    diagnosis:
      "O carro está perdendo o drift, fechando rápido demais ou não mantém ângulo. " +
      "Pode ser diferencial muito aberto, pressão de pneu baixa ou cambagem incorreta.",
    fixes: [
      {
        parameter: "Diferencial traseiro (aceleração)",
        adjustment: "+8% a +15%",
        reason: "Mais trava no diferencial mantém as rodas girando no ângulo. " +
                "Partimos de valores altos (98%) — se ainda fecha, aumente.",
      },
      {
        parameter: "Diferencial traseiro (desaceleração)",
        adjustment: "+10% a +15%",
        reason: "Mais trava ao soltar o gás sustenta o ângulo no drift.",
      },
      {
        parameter: "Pressão dos pneus traseiros",
        adjustment: "+2 a +3 PSI",
        reason: "Mais pressão = menos contato = menos grip = mais fácil de deslizar e manter ângulo.",
      },
      {
        parameter: "Cambagem dianteira",
        adjustment: "−0.3° (mais negativa)",
        reason: "Mais cambagem dianteira melhora resposta de direção no contra-giro do drift.",
      },
      {
        parameter: "Toe dianteiro",
        adjustment: "+0.2° (toe-out, para fora)",
        reason: "Leve toe-out ajuda a manter ângulo no drift.",
      },
    ],
  },

  brake_instability: {
    diagnosis:
      "O carro está instável na frenagem: desvia de trajetória ou trava rodas traseiras. " +
      "Ensinamento: se a roda traseira trava durante frenagem pesada, mova o balanceamento para a frente.",
    fixes: [
      {
        parameter: "Balanceamento de freios",
        adjustment: "Mover para frente (+2% a +4%)",
        reason: "Ensinamento direto do vídeo: se roda traseira trava sob frenagem pesada, " +
                "mova o balanço para a dianteira. Mais frenagem dianteira = mais estabilidade.",
      },
      {
        parameter: "Pressão de frenagem",
        adjustment: "−5% a −10%",
        reason: "Menos pressão total evita bloqueio das rodas. " +
                "Se usa ABS ligado, pode tolerar mais pressão.",
      },
      {
        parameter: "Barra estabilizadora dianteira",
        adjustment: "+2 pontos",
        reason: "Mais rigidez dianteira reduz oscilação lateral durante a frenagem.",
      },
      {
        parameter: "Rebound dianteiro",
        adjustment: "+1 ponto",
        reason: "Mais controle do mergulho dianteiro na frenagem melhora estabilidade.",
      },
    ],
  },
}

function addWizardBranches(
  problem: DiagnosticProblem,
  context: DiagnosticContext,
  fixes: DiagnosticFix[],
  contextNotes: string[],
) {
  if (!context.phase && !context.behavior) return

  if (context.phase) {
    contextNotes.push(`Fase do sintoma: ${DIAGNOSTIC_PHASE_LABELS[context.phase]}.`)
  }
  if (context.behavior) {
    contextNotes.push(`Comportamento observado: ${DIAGNOSTIC_BEHAVIOR_LABELS[context.behavior]}.`)
  }

  if (problem === "understeer" && context.phase === "entry") {
    fixes.unshift({
      parameter: "Freio + barra dianteira",
      adjustment: "Frear antes; depois -2 na barra dianteira",
      reason: "Understeer de entrada costuma vir de excesso de velocidade ou frente muito rigida. Corrija tecnica primeiro, depois amacie a dianteira.",
    })
  }

  if (problem === "understeer" && context.phase === "exit") {
    fixes.unshift({
      parameter: "Diferencial dianteiro/central",
      adjustment: "Front accel -8% ou center +5% para tras",
      reason: "Se sai de frente na aceleracao, o diferencial esta puxando o carro para fora. Menos trava na frente ajuda o carro apontar.",
    })
  }

  if (problem === "oversteer" && context.phase === "entry") {
    fixes.unshift({
      parameter: "Diferencial traseiro (desaceleracao)",
      adjustment: "-6% a -12%",
      reason: "Traseira solta ao entrar geralmente e lift-off ou diff de desaceleracao travado demais.",
    })
  }

  if (problem === "oversteer" && context.phase === "mid") {
    fixes.unshift({
      parameter: "Barra estabilizadora traseira",
      adjustment: "-3 pontos",
      reason: "No meio da curva, barra traseira rigida demais tira carga do pneu traseiro externo e deixa a traseira viva.",
    })
  }

  if ((problem === "oversteer" || problem === "wheelspin") && context.phase === "exit") {
    fixes.unshift({
      parameter: "Diferencial traseiro (aceleracao)",
      adjustment: "-10% primeiro",
      reason: "Saida de curva solta ou patinando quase sempre responde melhor a diferencial do que a grandes mudancas de mola.",
    })
  }

  if (context.phase === "high_speed" && (problem === "oversteer" || problem === "brake_instability")) {
    fixes.unshift({
      parameter: "Aero traseiro",
      adjustment: "+1 nivel",
      reason: "Instabilidade em alta e um caso classico para mais downforce traseiro antes de endurecer suspensao.",
    })
  }

  if (context.phase === "bumps" || problem === "bouncing") {
    fixes.unshift({
      parameter: "Bump e altura",
      adjustment: "Bump -0.5 se quica; altura +1 se bate no chassi",
      reason: "Em piso irregular, quicar e bater no chassi parecem iguais no volante, mas pedem ajustes opostos. Teste um de cada vez.",
    })
  }

  if (context.behavior === "sudden" && (problem === "oversteer" || problem === "wheelspin")) {
    fixes.unshift({
      parameter: "Pneu traseiro + diferencial",
      adjustment: "Rear tire -0.7 PSI e rear accel -8%",
      reason: "Perda repentina indica pico de torque ou pneu traseiro sem janela. A combinacao deixa a transicao menos brusca.",
    })
  }

  if (context.behavior === "progressive" && (problem === "understeer" || problem === "slow_cornering")) {
    fixes.unshift({
      parameter: "Cambagem e pressao dianteira",
      adjustment: "Camber -0.2 e front tire -0.5 PSI",
      reason: "Quando a perda e progressiva, normalmente falta grip sustentado na frente em vez de um erro isolado de entrada.",
    })
  }

  if (context.behavior === "braking" || problem === "brake_instability") {
    fixes.unshift({
      parameter: "Balanceamento de freio",
      adjustment: "+2% para frente",
      reason: "Se o sintoma aparece freando, estabilize a frente antes de mexer em barras ou diferencial.",
    })
  }

  if (context.behavior === "on_throttle" && problem !== "slow_straight") {
    fixes.unshift({
      parameter: "Acelerador e relacao de 1a/2a",
      adjustment: "Alongar 1a/2a ou reduzir final drive 0.05",
      reason: "Sintoma ao acelerar pode ser torque chegando rapido demais. Uma marcha menos curta deixa o carro mais limpo.",
    })
  }
}

export function diagnose(problem: DiagnosticProblem, context: DiagnosticContext = {}): DiagnosticResult {
  const data  = FIXES[problem]
  const fixes = [...data.fixes]
  const contextNotes: string[] = []

  addWizardBranches(problem, context, fixes, contextNotes)

  if (context.car) {
    const label = `${context.car.brand} ${context.car.model} ${context.car.year}`

    contextNotes.push(
      `Contexto: ${label} — ${context.car.drivetrain}, ${context.car.weight_kg} kg, ${context.car.power_hp} HP.`
    )

    // Carro pesado + problemas de frenagem/curva → redução de peso é prioridade
    if (context.car.weight_kg > 1800 && ["understeer", "slow_cornering", "brake_instability"].includes(problem)) {
      contextNotes.push(
        "⚠️ Carro pesado detectado. Priorize redução de peso máxima antes de qualquer ajuste de suspensão. " +
        "Ensinamento: peso reduzido melhora tudo — frenagem, entrada de curva e aceleração."
      )
      fixes.push({
        parameter: "Redução de peso",
        adjustment: "Upgrade máximo disponível",
        reason: "Ensinamento: carro com 1700 kg foi para 1469 kg com redução de peso de corrida. " +
                "Impacto na manobra é imediato e compensa muito mais que upgrades de motor em PI.",
      })
    }

    // Carro muito potente → câmbio curto causa wheelspin
    if (context.car.power_hp > 650 && ["wheelspin", "oversteer"].includes(problem)) {
      contextNotes.push(
        "⚠️ Alta potência detectada. Ensinamento: ajuste o final drive para a marcha não cortar giro " +
        "e use o diferencial como principal controle de wheelspin — não a suspensão."
      )
      fixes.push({
        parameter: "Transmissão final (Final Drive)",
        adjustment: "Aumentar (menos aceleração na 1ª marcha)",
        reason: "Com muita potência, a 1ª marcha curta causa corte de giro imediato. " +
                "Ensinamento: puxe o final drive para trás até a saída ficar limpa.",
      })
    }

    // FWD com problemas de understeer
    if (context.car.drivetrain === "FWD" && ["understeer", "slow_cornering"].includes(problem)) {
      contextNotes.push(
        "FWD detectado: o diferencial dianteiro é crítico. " +
        "Aceleração muito alta empurra o carro para fora na saída."
      )
      fixes.push({
        parameter: "Diferencial dianteiro (aceleração)",
        adjustment: "−5% a −10%",
        reason: "FWD com diferencial muito travado causa push ao sair de curva. " +
                "Reduza para dar mais liberdade às rodas dianteiras.",
      })
    }

    // RWD + drift_loss → pode precisar de mais pressão no pneu traseiro
    if (context.car.drivetrain === "RWD" && problem === "drift_loss") {
      contextNotes.push(
        "RWD: verifique a pressão traseira. Pneu de drift com mais pressão (30-38 PSI traseiro) " +
        "reduz grip e facilita manter o ângulo."
      )
    }
  }

  // Ajustes específicos por tipo de tune
  if ((context.tuneType === "rally" || context.tuneType === "cross_country") &&
      (problem === "bouncing" || problem === "brake_instability")) {
    contextNotes.push(
      "Tune off-road detectada: as correções priorizam absorção e estabilidade em piso irregular. " +
      "Não reduza demais a altura de suspensão."
    )
    fixes.push({
      parameter: "Altura de suspensão + Bump",
      adjustment: "Manter altura. Aumentar bump em 0.5",
      reason: "Em off-road, altura é necessária. Aumente o bump para evitar batida no chassis " +
              "sem reduzir a altura que protege o carro.",
    })
  }

  if (context.tuneType === "drift" && problem === "drift_loss") {
    contextNotes.push(
      "Tune de drift: diferencial e pressão de pneu traseiro são as principais alavancas. " +
      "Use 3ª marcha como marcha principal. Controle ângulo pelo acelerador, não pelo volante."
    )
  }

  if (context.tuneType === "drag" && problem === "wheelspin") {
    contextNotes.push(
      "Tune de drag: na largada, solte o acelerador progressivamente (não 100% instantâneo). " +
      "A tune pode estar correta — a técnica de largada influencia muito."
    )
  }

  if (context.intent === "control" && ["oversteer", "brake_instability", "bouncing"].includes(problem)) {
    contextNotes.push(
      "Meta de controle: reduza agressividade de diferencial e barras antes de buscar mais potencia. A prioridade e previsibilidade."
    )
  }

  if (context.intent === "speed" && problem === "slow_straight") {
    contextNotes.push(
      "Meta de velocidade: ajuste o final drive para chegar perto do corte no fim da maior reta usada no seu teste."
    )
  }

  if (context.intent === "cornering" && ["understeer", "slow_cornering"].includes(problem)) {
    contextNotes.push(
      "Meta de curvas: valide cambagem com telemetria depois de algumas voltas. Se o pneu interno estiver muito mais quente, reduza cambagem negativa."
    )
  }

  return {
    problem,
    diagnosis:     data.diagnosis,
    fixes,
    context_notes: contextNotes,
  }
}

export const PROBLEM_LABELS: Record<DiagnosticProblem, string> = {
  understeer:        "Carro sai muito de frente (understeer)",
  oversteer:         "Carro escapa de traseira (oversteer)",
  wheelspin:         "Carro patina muito na saída",
  slow_cornering:    "Carro não faz curva / lento em curva",
  slow_straight:     "Carro está lento em reta",
  bouncing:          "Carro pula / rebota demais",
  drift_loss:        "Carro não segura o drift",
  brake_instability: "Carro instável na frenagem",
}
export const DIAGNOSTIC_PHASE_LABELS: Record<DiagnosticPhase, string> = {
  entry: "Entrada de curva",
  mid: "Meio da curva",
  exit: "Saida de curva",
  high_speed: "Alta velocidade",
  low_speed: "Baixa velocidade",
  bumps: "Ondulacao / salto",
}

export const DIAGNOSTIC_BEHAVIOR_LABELS: Record<DiagnosticBehavior, string> = {
  progressive: "Perda progressiva",
  sudden: "Perda repentina",
  on_throttle: "Acontece acelerando",
  off_throttle: "Acontece sem acelerar",
  braking: "Acontece freando",
}
