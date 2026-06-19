import type { CarClass, PartInsight, Parts } from "@/types"

export type PartKnowledgeCategoryId = "conversions" | keyof Parts

export interface PartKnowledgeEntry {
  id: string
  category: PartKnowledgeCategoryId
  portugueseName: string
  englishName: string
  piImpact: string
  observation: string
  aliases: string[]
}

export interface PartKnowledgeCategory {
  id: PartKnowledgeCategoryId
  title: string
  entries: PartKnowledgeEntry[]
}

export interface ClassOptimizationGuide {
  id: string
  title: string
  description: string
  bullets: { label: string; text: string }[]
}

export const PART_KNOWLEDGE_CATEGORIES: PartKnowledgeCategory[] = [
  {
    id: "conversions",
    title: "Conversoes (Conversions)",
    entries: [
      {
        id: "engine_swap",
        category: "conversions",
        portugueseName: "Troca de Motor",
        englishName: "Engine Swap",
        piImpact: "Variavel (Alto)",
        observation: "Usar apenas para subir de classe ou mudar drasticamente o desempenho.",
        aliases: [
          "engine swap",
          "motor swap",
          "2jz-gte turbocharged inline-6",
          "rb26dett turbocharged inline-6",
          "7.0l chevrolet ls7 v8",
          "dodge 8.3l v10 (srt viper)",
          "5.0l ford coyote v8",
          "bmw s54b32 inline-6",
          "bmw s65b40 v8",
          "ej25 flat-4 turbocharged (wrx sti)",
          "4b11t turbocharged inline-4 (lancer evo)",
          "sr20det turbocharged inline-4",
          "6.2l chevrolet ls3 v8",
          "5.2l lamborghini v10",
        ],
      },
      {
        id: "drivetrain_swap",
        category: "conversions",
        portugueseName: "Troca de Tracao",
        englishName: "Drivetrain Swap",
        piImpact: "Variavel",
        observation: "AWD geralmente aumenta PI, mas pode diminuir em S1/S2 para permitir mais potencia. RWD pode diminuir.",
        aliases: ["drivetrain swap", "awd conversion", "rwd conversion", "fwd conversion"],
      },
      {
        id: "aspiration",
        category: "conversions",
        portugueseName: "Aspiracao",
        englishName: "Aspiration (Turbo/Supercharger)",
        piImpact: "Variavel",
        observation: "Grande ganho de potencia, mas adiciona peso e PI.",
        aliases: [
          "aspiration",
          "race supercharger",
          "sport supercharger",
          "street supercharger",
          "supercharger",
        ],
      },
      {
        id: "body_kit",
        category: "conversions",
        portugueseName: "Kit de Carroceria",
        englishName: "Body Kit",
        piImpact: "Medio/Alto",
        observation: "Afeta aerodinamica e largura dos pneus. Pode ser usado para baixar PI em alguns casos.",
        aliases: ["body kit", "wide body kit"],
      },
    ],
  },
  {
    id: "engine",
    title: "Motor (Engine)",
    entries: [
      {
        id: "intake",
        category: "engine",
        portugueseName: "Coletor de Admissao",
        englishName: "Intake",
        piImpact: "Baixo",
        observation: "Bom para ajustes finos de PI.",
        aliases: ["intake", "race intake", "sport intake", "street intake"],
      },
      {
        id: "air_filter",
        category: "engine",
        portugueseName: "Filtro de Ar",
        englishName: "Air Filter",
        piImpact: "Baixo",
        observation: "Frequentemente a primeira peca a adicionar.",
        aliases: ["air filter", "race air filter", "sport air filter", "street air filter"],
      },
      {
        id: "fuel_system",
        category: "engine",
        portugueseName: "Sistema de Combustivel",
        englishName: "Fuel System",
        piImpact: "Medio",
        observation: "Aumenta potencia de forma constante.",
        aliases: ["fuel system", "race fuel system", "sport fuel system"],
      },
      {
        id: "ignition",
        category: "engine",
        portugueseName: "Ignicao",
        englishName: "Ignition",
        piImpact: "Baixo/Medio",
        observation: "Melhora a resposta do motor.",
        aliases: ["ignition", "race ignition", "sport ignition"],
      },
      {
        id: "exhaust",
        category: "engine",
        portugueseName: "Escapamento",
        englishName: "Exhaust",
        piImpact: "Medio",
        observation: "Reduz peso e aumenta potencia.",
        aliases: ["exhaust", "race exhaust", "sport exhaust", "street exhaust"],
      },
      {
        id: "camshaft",
        category: "engine",
        portugueseName: "Comando de Valvulas",
        englishName: "Camshaft",
        piImpact: "Muito Alto",
        observation: "Evitar se o foco for manter a classe, pois o custo de PI e elevado.",
        aliases: ["camshaft", "race camshaft", "sport camshaft", "race cam", "sport cam"],
      },
      {
        id: "valves",
        category: "engine",
        portugueseName: "Valvulas",
        englishName: "Valves",
        piImpact: "Medio",
        observation: "Aumenta o limite de RPM.",
        aliases: ["valves", "race valves", "sport valves"],
      },
      {
        id: "displacement",
        category: "engine",
        portugueseName: "Cilindrada",
        englishName: "Displacement",
        piImpact: "Alto",
        observation: "Aumenta torque e potencia bruta.",
        aliases: ["displacement", "race displacement", "sport displacement", "race engine block"],
      },
      {
        id: "pistons",
        category: "engine",
        portugueseName: "Pistoes e Compressao",
        englishName: "Pistons/Compression",
        piImpact: "Medio/Alto",
        observation: "Melhora a eficiencia termica.",
        aliases: ["pistons", "pistons/compression", "race pistons", "sport pistons"],
      },
      {
        id: "turbocharger",
        category: "engine",
        portugueseName: "Turbocompressor",
        englishName: "Turbocharger",
        piImpact: "Variavel",
        observation: "Grande ganho de potencia, mas adiciona peso.",
        aliases: ["turbocharger", "race turbo", "sport turbo", "street turbo", "turbo"],
      },
      {
        id: "intercooler",
        category: "engine",
        portugueseName: "Intercooler",
        englishName: "Intercooler",
        piImpact: "Baixo/Medio",
        observation: "Adiciona peso, pode ajudar a baixar o PI se necessario.",
        aliases: ["intercooler", "race intercooler", "sport intercooler"],
      },
      {
        id: "oil_cooling",
        category: "engine",
        portugueseName: "Sistema de Resfriamento",
        englishName: "Oil/Cooling",
        piImpact: "Baixo",
        observation: "Quase zero impacto no PI, bom para realismo.",
        aliases: ["oil/cooling", "oil cooling", "race oil cooling", "sport oil cooling"],
      },
      {
        id: "flywheel",
        category: "engine",
        portugueseName: "Volante de Motor",
        englishName: "Flywheel",
        piImpact: "Baixissimo",
        observation: "Excelente para gastar os ultimos 1 ou 2 pontos de PI.",
        aliases: ["flywheel", "race flywheel", "sport flywheel"],
      },
    ],
  },
  {
    id: "platform",
    title: "Plataforma e Direcao (Platform & Handling)",
    entries: [
      {
        id: "brakes",
        category: "platform",
        portugueseName: "Freios",
        englishName: "Brakes",
        piImpact: "Medio",
        observation: "Essencial para classes altas (A, S1, S2).",
        aliases: ["brakes", "race brakes", "sport brakes", "street brakes"],
      },
      {
        id: "springs_dampers",
        category: "platform",
        portugueseName: "Molas e Amortecedores",
        englishName: "Springs & Dampers",
        piImpact: "Alto",
        observation: "Use Corrida para desbloquear ajustes de suspensao.",
        aliases: [
          "springs & dampers",
          "race springs & dampers",
          "sport springs & dampers",
          "race suspension",
          "sport suspension",
          "street suspension",
          "rally suspension",
          "drift suspension",
          "off-road suspension",
          "drag suspension",
        ],
      },
      {
        id: "front_antiroll_bars",
        category: "platform",
        portugueseName: "Barras Estabilizadoras Diant.",
        englishName: "Front Anti-roll Bars",
        piImpact: "Baixo",
        observation: "Obrigatorio para tunagem. 0 PI em muitos casos.",
        aliases: ["front anti-roll bars", "front anti roll bars"],
      },
      {
        id: "rear_antiroll_bars",
        category: "platform",
        portugueseName: "Barras Estabilizadoras Tras.",
        englishName: "Rear Anti-roll Bars",
        piImpact: "Baixo",
        observation: "Obrigatorio para tunagem. 0 PI em muitos casos.",
        aliases: [
          "rear anti-roll bars",
          "rear anti roll bars",
          "race anti-roll bars",
          "sport anti-roll bars",
          "street anti-roll bars",
          "drift anti-roll bars",
          "rally anti-roll bars",
          "off-road anti-roll bars",
        ],
      },
      {
        id: "roll_cage",
        category: "platform",
        portugueseName: "Reforco de Chassi/Gaiola",
        englishName: "Roll Cage",
        piImpact: "Medio",
        observation: "Adiciona peso e rigidez. Pode baixar o PI.",
        aliases: ["roll cage", "race roll cage", "race rollcage", "sport rollcage"],
      },
      {
        id: "weight_reduction",
        category: "platform",
        portugueseName: "Reducao de Peso",
        englishName: "Weight Reduction",
        piImpact: "Extremo",
        observation: "Peca mais importante para performance geral.",
        aliases: [
          "weight reduction",
          "race weight reduction",
          "sport weight reduction",
          "street weight reduction",
        ],
      },
    ],
  },
  {
    id: "drivetrain",
    title: "Transmissao (Drivetrain)",
    entries: [
      {
        id: "clutch",
        category: "drivetrain",
        portugueseName: "Embreagem",
        englishName: "Clutch",
        piImpact: "Baixo",
        observation: "Melhora o tempo de troca.",
        aliases: ["clutch", "race clutch", "sport clutch", "street clutch"],
      },
      {
        id: "transmission",
        category: "drivetrain",
        portugueseName: "Transmissao/Cambio",
        englishName: "Transmission",
        piImpact: "Medio",
        observation: "Corrida permite ajustar as marchas (Essencial). Aumentar marchas pode baixar o PI.",
        aliases: ["transmission", "race transmission", "sport transmission", "street transmission"],
      },
      {
        id: "driveline",
        category: "drivetrain",
        portugueseName: "Linha de Transmissao",
        englishName: "Driveline",
        piImpact: "Baixo",
        observation: "Reduz massa rotacional. Ajuste fino de PI.",
        aliases: ["driveline", "race driveline", "sport driveline"],
      },
      {
        id: "differential",
        category: "drivetrain",
        portugueseName: "Diferencial",
        englishName: "Differential",
        piImpact: "Zero",
        observation: "Sempre use Corrida para desbloquear o ajuste.",
        aliases: ["differential", "race differential", "sport differential", "drift differential"],
      },
    ],
  },
  {
    id: "tires",
    title: "Pneus e Rodas (Tires & Rims)",
    entries: [
      {
        id: "tire_compound",
        category: "tires",
        portugueseName: "Composto de Pneu",
        englishName: "Tire Compound",
        piImpact: "Altissimo",
        observation: "Define o teto de performance do carro. Pneus de Rally sao PI eficientes para S1/A.",
        aliases: [
          "tire compound",
          "street tires",
          "sport tires",
          "semi-slick tires",
          "semi-slick tires",
          "race tires",
          "drag tires",
          "drift tires",
          "rally tires",
          "off-road tires",
        ],
      },
      {
        id: "front_tire_width",
        category: "tires",
        portugueseName: "Largura do Pneu Dianteiro",
        englishName: "Front Tire Width",
        piImpact: "Baixo",
        observation: "Ajuda a reduzir o subesterco.",
        aliases: [
          "front tire width",
          "+1 front tire width",
          "front tire width +1",
          "front tire width +2",
          "max width front tires",
          "max front tire width",
          "stock front tire width",
        ],
      },
      {
        id: "rear_tire_width",
        category: "tires",
        portugueseName: "Largura do Pneu Traseiro",
        englishName: "Rear Tire Width",
        piImpact: "Medio",
        observation: "Essencial para tracao em RWD. Aumentar largura em FWD/AWD pode baixar o PI.",
        aliases: [
          "rear tire width",
          "+1 rear tire width",
          "rear tire width +1",
          "rear tire width +2",
          "max width rear tires",
          "max rear tire width",
        ],
      },
      {
        id: "rims",
        category: "tires",
        portugueseName: "Estilo de Roda (Aros)",
        englishName: "Rims",
        piImpact: "Variavel",
        observation: "Rodas mais pesadas podem baixar o PI.",
        aliases: ["rims", "heavier rims", "lightweight rims"],
      },
      {
        id: "rim_size",
        category: "tires",
        portugueseName: "Tamanho do Aro",
        englishName: "Rim Size",
        piImpact: "Baixo",
        observation: "Geralmente aumenta o peso e baixa o PI.",
        aliases: ["rim size", "rim size +1"],
      },
      {
        id: "wheel_track",
        category: "tires",
        portugueseName: "Espacamento das Rodas",
        englishName: "Wheel Track",
        piImpact: "Zero",
        observation: "Melhora a estabilidade lateral sem custo de PI.",
        aliases: ["wheel track", "front track width +1", "rear track width +1", "max front track width", "max rear track width"],
      },
      {
        id: "tire_profile",
        category: "tires",
        portugueseName: "Perfil do Pneu",
        englishName: "Tire Profile",
        piImpact: "Variavel",
        observation: "Impacto no PI e na estetica.",
        aliases: ["tire profile"],
      },
    ],
  },
  {
    id: "aero",
    title: "Aerodinamica e Aparencia (Aero and Appearance)",
    entries: [
      {
        id: "front_splitter",
        category: "aero",
        portugueseName: "Splitter Dianteiro",
        englishName: "Front Splitter",
        piImpact: "Variavel",
        observation: "Pode baixar o PI em classes baixas (C/D).",
        aliases: [
          "front splitter",
          "front splitter (low)",
          "front splitter (high)",
          "front bumper aero",
          "adjustable front bumper",
          "race front bumper",
          "sport front bumper",
          "street front bumper",
        ],
      },
      {
        id: "rear_wing",
        category: "aero",
        portugueseName: "Aerofolio Traseiro",
        englishName: "Rear Wing",
        piImpact: "Variavel",
        observation: "O ajustavel pode reduzir o PI em S1/S2.",
        aliases: [
          "rear wing",
          "rear wing (low)",
          "adjustable rear wing",
          "adjustable rear wing (medium)",
          "rear spoiler (low)",
          "race rear bumper",
        ],
      },
    ],
  },
]

export const CLASS_OPTIMIZATION_GUIDE: ClassOptimizationGuide[] = [
  {
    id: "dcb",
    title: "Classes D, C e B (Iniciante a Intermediario)",
    description: "Nestas classes, o foco principal e a potencia e a tracao, com menor enfase em aerodinamica avancada, que pode adicionar arrasto desnecessario. A reducao de peso e sempre benefica, mas pode ser menos prioritaria que o motor em classes mais baixas.",
    bullets: [
      {
        label: "Pneus",
        text: "Utilize Compostos de Pneu de Rua ou Vintage para manter o PI baixo. Aumentar a Largura do Pneu Traseiro e crucial para tracao em carros RWD, e pode ate baixar o PI em FWD/AWD, sendo uma excelente opcao.",
      },
      {
        label: "Motor",
        text: "Invista em upgrades de motor que oferecam bom ganho de potencia por PI, como Filtro de Ar, Coletor de Admissao, Escapamento e Sistema de Combustivel. Evite Comando de Valvulas devido ao alto custo de PI.",
      },
      {
        label: "Transmissao",
        text: "A Transmissao de Corrida e essencial para ajustar as marchas, mas em classes mais baixas, uma Transmissao Esportiva pode ser suficiente para economizar PI.",
      },
      {
        label: "Plataforma e Direcao",
        text: "Molas e Amortecedores de Corrida sao importantes para desbloquear ajustes, mas em classes D e C, Molas e Amortecedores Esportivos podem ser uma alternativa mais barata em PI. Barras Estabilizadoras (dianteira e traseira) sao upgrades de baixo PI e essenciais para o ajuste fino da dirigibilidade.",
      },
      {
        label: "Aerodinamica",
        text: "Geralmente, evite aerofolios nestas classes para economizar PI, pois a velocidade maxima e menor e o arrasto e mais prejudicial. O Splitter Dianteiro pode ocasionalmente baixar o PI em classes C e D, sendo uma opcao a ser considerada.",
      },
      {
        label: "Reducao de Peso",
        text: "Priorize a Reducao de Peso maxima, mas se o PI estiver apertado, pode-se sacrificar um pouco para mais potencia.",
      },
    ],
  },
  {
    id: "a",
    title: "Classe A (Intermediario a Avancado)",
    description: "A Classe A exige um equilibrio entre potencia e dirigibilidade. A eficiencia de PI torna-se mais critica, e a selecao de pecas deve ser mais estrategica.",
    bullets: [
      {
        label: "Pneus",
        text: "Compostos de Pneu de Rally sao altamente eficientes em PI para a Classe A, oferecendo excelente aderencia lateral com um custo de PI menor que os pneus de corrida.",
      },
      {
        label: "Aerodinamica",
        text: "Instalar apenas o Aerofolio Traseiro Ajustavel e uma tatica comum para reduzir o PI e permitir mais upgrades de potencia, especialmente em carros com foco em velocidade.",
      },
      {
        label: "Tracao",
        text: "A Troca de Tracao para AWD pode ser benefica para a maioria dos carros, mas avalie o impacto no PI. Em alguns casos, manter RWD e focar em potencia pode ser mais eficiente.",
      },
      {
        label: "Plataforma e Direcao",
        text: "Freios de Corrida tornam-se essenciais. Molas e Amortecedores de Corrida e Barras Estabilizadoras de Corrida sao padrao para ajustes finos.",
      },
    ],
  },
  {
    id: "s",
    title: "Classes S1 e S2 (Avancado a Elite)",
    description: "Nestas classes de alto desempenho, a busca pela maxima performance e o objetivo. A gestao do PI e crucial para espremer cada ponto de desempenho.",
    bullets: [
      {
        label: "Tracao",
        text: "A conversao para AWD em muitos carros S2 e alguns S1 pode diminuir o PI, permitindo adicionar mais potencia e ser uma estrategia eficaz.",
      },
      {
        label: "Aerodinamica",
        text: "O Aerofolio Traseiro Ajustavel e fundamental e pode reduzir o PI em carros RWD e AWD, liberando espaco para outros upgrades.",
      },
      {
        label: "Pneus",
        text: "Pneus de Corrida (Slicks) sao o padrao para S2. Para S1, os Pneus de Rally continuam sendo muito eficientes em PI, oferecendo bom grip com menor custo de PI que os de corrida.",
      },
      {
        label: "Reducao de Peso",
        text: "A Reducao de Peso maxima e quase sempre obrigatoria para maximizar o desempenho.",
      },
      {
        label: "Motor",
        text: "Priorize upgrades de motor que oferecam o maior ganho de potencia por PI, como Turbocompressores ou Aspiracao (se nao for o motor original).",
      },
    ],
  },
  {
    id: "x",
    title: "Classe X (Extremo)",
    description: "Na Classe X, nao ha limite de PI, entao o objetivo e simplesmente instalar as melhores pecas disponiveis para maximizar todas as estatisticas de desempenho.",
    bullets: [
      {
        label: "Foco",
        text: "Instale todos os upgrades de Motor de corrida, Composto de Pneu de Corrida, Reducao de Peso maxima, Aerodinamica completa e Troca de Tracao AWD (se disponivel e benefica). O foco e o desempenho absoluto.",
      },
    ],
  },
]

export const PI_MANAGEMENT_TIPS = [
  {
    label: "Ajustes Finos de PI",
    text: "Para diminuir levemente o PI e liberar espaco para outras pecas, considere aumentar o Tamanho do Aro, usar Rodas mais pesadas, adicionar mais marchas na Transmissao ou instalar a Gaiola de Protecao. Para aumentar levemente o PI, instale Linha de Transmissao leve, Rodas leves ou Volante do Motor leve.",
  },
  {
    label: "Priorize o que importa",
    text: "Concentre-se em upgrades que impactam diretamente a performance desejada para a classe. Por exemplo, para carros de velocidade, priorize potencia e aerodinamica de baixo arrasto. Para carros de pista, priorize dirigibilidade e aderencia.",
  },
  {
    label: "Teste e Ajuste",
    text: "Sempre teste o carro no modo Rivais ou em pistas conhecidas. Ajuste um parametro por vez para entender o impacto de cada mudanca.",
  },
]

export const PI_SYSTEM_SUMMARY = [
  "O PI e um valor numerico que representa o desempenho geral de um carro no Forza Horizon.",
  "Cada upgrade de peca afeta o PI, e o objetivo de uma tunagem eficiente e maximizar o desempenho dentro do limite de PI de uma classe especifica.",
  "Nem sempre a peca mais cara ou com maior aumento de estatisticas e a mais eficiente em termos de PI.",
]

const PART_ENTRY_BY_ALIAS = new Map<string, PartKnowledgeEntry>()

for (const category of PART_KNOWLEDGE_CATEGORIES) {
  for (const entry of category.entries) {
    PART_ENTRY_BY_ALIAS.set(normalizePartName(entry.englishName), entry)
    PART_ENTRY_BY_ALIAS.set(normalizePartName(entry.portugueseName), entry)
    for (const alias of entry.aliases) {
      PART_ENTRY_BY_ALIAS.set(normalizePartName(alias), entry)
    }
  }
}

function normalizePartName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, " ").trim()
}

function findFallbackEntry(category: keyof Parts, partName: string): PartKnowledgeEntry {
  return {
    id: `fallback_${category}_${normalizePartName(partName).replace(/\W+/g, "_")}`,
    category,
    portugueseName: partName,
    englishName: partName,
    piImpact: "Variavel",
    observation: "Peca fora do mapeamento dos documentos. Valide o PI no jogo antes de fechar a build.",
    aliases: [partName],
  }
}

export function getPartKnowledgeEntry(partName: string): PartKnowledgeEntry | undefined {
  const normalized = normalizePartName(partName)
  const direct = PART_ENTRY_BY_ALIAS.get(normalized)
  if (direct) return direct

  if (normalized.includes("conversion")) return PART_ENTRY_BY_ALIAS.get("drivetrain swap")
  if (normalized.includes("supercharger")) return PART_ENTRY_BY_ALIAS.get("aspiration")
  if (normalized.includes("turbo")) return PART_ENTRY_BY_ALIAS.get("turbocharger")
  if (normalized.includes("intake")) return PART_ENTRY_BY_ALIAS.get("intake")
  if (normalized.includes("exhaust")) return PART_ENTRY_BY_ALIAS.get("exhaust")
  if (normalized.includes("fuel")) return PART_ENTRY_BY_ALIAS.get("fuel system")
  if (normalized.includes("ignition")) return PART_ENTRY_BY_ALIAS.get("ignition")
  if (normalized.includes("valves")) return PART_ENTRY_BY_ALIAS.get("valves")
  if (normalized.includes("displacement") || normalized.includes("engine block")) return PART_ENTRY_BY_ALIAS.get("displacement")
  if (normalized.includes("pistons")) return PART_ENTRY_BY_ALIAS.get("pistons/compression")
  if (normalized.includes("intercooler")) return PART_ENTRY_BY_ALIAS.get("intercooler")
  if (normalized.includes("oil cooling")) return PART_ENTRY_BY_ALIAS.get("oil/cooling")
  if (normalized.includes("flywheel")) return PART_ENTRY_BY_ALIAS.get("flywheel")
  if (normalized.includes("brake")) return PART_ENTRY_BY_ALIAS.get("brakes")
  if (normalized.includes("spring") || normalized.includes("suspension")) return PART_ENTRY_BY_ALIAS.get("springs & dampers")
  if (normalized.includes("anti-roll") || normalized.includes("anti roll")) return PART_ENTRY_BY_ALIAS.get("rear anti-roll bars")
  if (normalized.includes("roll cage") || normalized.includes("rollcage")) return PART_ENTRY_BY_ALIAS.get("roll cage")
  if (normalized.includes("weight reduction")) return PART_ENTRY_BY_ALIAS.get("weight reduction")
  if (normalized.includes("clutch")) return PART_ENTRY_BY_ALIAS.get("clutch")
  if (normalized.includes("transmission")) return PART_ENTRY_BY_ALIAS.get("transmission")
  if (normalized.includes("driveline")) return PART_ENTRY_BY_ALIAS.get("driveline")
  if (normalized.includes("differential")) return PART_ENTRY_BY_ALIAS.get("differential")
  if (normalized.includes("tires")) return PART_ENTRY_BY_ALIAS.get("tire compound")
  if (normalized.includes("front tire width")) return PART_ENTRY_BY_ALIAS.get("front tire width")
  if (normalized.includes("rear tire width")) return PART_ENTRY_BY_ALIAS.get("rear tire width")
  if (normalized.includes("rim size")) return PART_ENTRY_BY_ALIAS.get("rim size")
  if (normalized.includes("rims")) return PART_ENTRY_BY_ALIAS.get("rims")
  if (normalized.includes("track width")) return PART_ENTRY_BY_ALIAS.get("wheel track")
  if (normalized.includes("front splitter") || normalized.includes("front bumper")) return PART_ENTRY_BY_ALIAS.get("front splitter")
  if (normalized.includes("rear wing") || normalized.includes("rear spoiler") || normalized.includes("rear bumper")) return PART_ENTRY_BY_ALIAS.get("rear wing")

  return undefined
}

export function createPartInsight(
  name: string,
  category: keyof Parts,
  piDelta = 0,
  tier?: PartInsight["tier"],
): PartInsight {
  const entry = getPartKnowledgeEntry(name) ?? findFallbackEntry(category, name)
  return {
    name,
    category,
    englishName: entry.englishName,
    portugueseName: entry.portugueseName,
    piImpact: entry.piImpact,
    observation: entry.observation,
    piDelta,
    tier,
  }
}

export function emptyPartsDetails(): Record<keyof Parts, PartInsight[]> {
  return {
    engine: [],
    platform: [],
    drivetrain: [],
    tires: [],
    aero: [],
  }
}

export function createPartsDetailsFromParts(parts: Parts): Record<keyof Parts, PartInsight[]> {
  const details = emptyPartsDetails()
  for (const category of Object.keys(parts) as (keyof Parts)[]) {
    details[category] = parts[category].map((name) => createPartInsight(name, category))
  }
  return details
}

export function getClassGuideForClass(carClass: CarClass): ClassOptimizationGuide {
  if (carClass === "X") return CLASS_OPTIMIZATION_GUIDE[3]
  if (carClass === "S1" || carClass === "S2" || carClass === "R") return CLASS_OPTIMIZATION_GUIDE[2]
  if (carClass === "A") return CLASS_OPTIMIZATION_GUIDE[1]
  return CLASS_OPTIMIZATION_GUIDE[0]
}
