// AUTO-GENERATED — do not edit by hand. Run: npm run sync:sheets
// Last sync: 2026-06-05T16:07:42.955Z | Adicionados: 04/06

export type TuneClass = "C" | "B" | "A" | "S1" | "S2" | "R"
export type TuneTag = "pista" | "sprint" | "circuito" | "rally" | "cross" | "allround"

export interface SpreadsheetTune {
  id: string
  car: string
  class: TuneClass
  raceType: string
  tags: TuneTag[]
  shareCode: string
  tuner: string
  description?: string
  isPB: boolean
  isOmega: boolean
  isNew: boolean
  isUnavailable?: boolean
}

function tags(raw: string): TuneTag[] {
  const r = raw.toLowerCase()
  const result: TuneTag[] = []
  if (r.includes("pista")) result.push("pista")
  if (r.includes("sprint")) result.push("sprint")
  if (r.includes("circuito")) result.push("circuito")
  if (r.includes("rally")) result.push("rally")
  if (r.includes("cross")) result.push("cross")
  if (r.includes("allround") || r.includes("tudo")) result.push("allround")
  return result
}

function tune(
  id: string,
  car: string,
  cls: TuneClass,
  raceType: string,
  shareCode: number | string,
  tuner: string,
  description?: string,
  flags: { isNew?: boolean; isUnavailable?: boolean } = {}
): SpreadsheetTune {
  const desc = typeof description === "string" ? description.trim() : undefined
  const isPB = !!desc && desc.startsWith("PB")
  const isOmega = car.includes("Ω")
  const cleanDesc = isPB ? desc?.replace(/^PB\s*/, "") : desc
  return {
    id,
    car: car.trim(),
    class: cls,
    raceType,
    tags: tags(raceType),
    shareCode: String(shareCode),
    tuner: tuner.trim(),
    description: cleanDesc || undefined,
    isPB,
    isOmega,
    isNew: flags.isNew ?? false,
    isUnavailable: flags.isUnavailable,
  }
}

export const COMMUNITY_TUNES: SpreadsheetTune[] = [
  // ── CLASSE C ───────────────────────────────────────────────────────────────────────
  tune("c01", "Acura Integra Type R 2001", "C", "Pista/Allround", "722713036", "TDR THROTTLE"),
  tune("c02", "Ford Super Duty F-450", "C", "Cross", "161652371", "Helmitis", "Melhor Cross da C na maioria das corridas"),
  tune("c03", "GMC Jimmy", "C", "Rally/Cross", "718851410", "LogikJ"),
  tune("c04", "Honda Civic RS 1974", "C", "Pista/Allround", "682691661", "derbiFix"),
  tune("c05", "Honda Civic SI 1986", "C", "Rally", "108829124", "Zigzack123"),
  tune("c06", "Honda Civic Type R 1997", "C", "Pista/Allround", "768406218", "KansukeKTS"),
  tune("c07", "Jeep Wrangler Rubicon", "C", "Rally", "663276779", "AnbuLeandro"),
  tune("c08", "Mercedes-Benz X-Class", "C", "Cross", "146382130", "Zigzack123"),
  tune("c09", "Mitisubishi Montero Evo Ω", "C", "Cross", "146976560", "JustKejmil"),
  tune("c10", "Peel P50", "C", "Pista/Sprint", "427541503", "JeroenB032397", "PB Controle de tração obrigatorio"),
  tune("c11", "Reliant Supervan III", "C", "Tudo", "334326434", "zombiejesus52", "PB O mais forte em tudo na C mas um inferno pra dirigir"),
  tune("c12", "Toyota Celica 2003", "C", "Pista/Allround", "398341742", "KansukeKTS"),

  // ── CLASSE B ───────────────────────────────────────────────────────────────────────
  tune("b01", "Acura Integra Type R 2001", "B", "Pista/Allround", "435851879", "pyrtti", "Talvez o melhor overall B pra pista"),
  tune("b02", "Cadillac Limousine", "B", "Pista/Allround", "113062259", "ZVTCJAU", "Não recomendado pra pista molhada"),
  tune("b03", "Chevrolet K-10", "B", "Rally", "156253027", "ZVTCJAU"),
  tune("b04", "Chevrolet K-10", "B", "Cross", "655446407", "Spike5483", "Precisa de transmissão manual com embreagem"),
  tune("b05", "Chevrolet Silverado 2020", "B", "Cross", "385451454", "Spike5483"),
  tune("b06", "Datsun Roadster", "B", "Rally", "490269753", "Noa Miyako", undefined, { isNew: true }),
  tune("b07", "Dodge Charger  R/T 1969 Ω", "B", "Rally", "108276171", "ShaggyScroll660", "Talvez o melhor overall B para rally"),
  tune("b08", "Dodge Dart Ω", "B", "Pista/Sprint", "144655499", "Noa Miyako", "PB"),
  tune("b09", "Ford Coupe", "B", "Pista/Sprint", "125950218", "Shinnosuke", "PB"),
  tune("b10", "Ford Mustang 1968", "B", "Rally/Cross", "811732620", "ZVTCJAU", "Mais forte classe B para trechos de terra, difícil no asfalto"),
  tune("b11", "Ford Raptor PBV Ω", "B", "Cross", "183394129", "ESV Mars"),
  tune("b12", "Ford Super Duty F-450", "B", "Cross/Rally", "108976632", "TheDannny", "Muito forte tanto pra rally quanto cross"),
  tune("b13", "Holden Torana", "B", "Pista/Sprint", "152543472", "SilvaSUPERBEE", "PB Mais forte classe B pra sprint de velocidade"),
  tune("b14", "Honda Acty", "B", "Rally", "584994637", "Noa Miyako", "Talvez o melhor overall B para rally"),
  tune("b15", "Honda City E II", "B", "Pista/Allround", "651267930", "AIONS580Pio", "Não recomendado pra pista molhada"),
  tune("b16", "Honda Civic 2004", "B", "Pista/Allround", "558364419", "PTW JuHan"),
  tune("b17", "Honda Civic CRX Mugen 1984 Ω", "B", "Rally", "736170183", "ZVTCJAU"),
  tune("b18", "Honda Civic CRX Mugen 1984 Ω", "B", "Pista/Allround", "172755202", "Tasiyu Tanka", "Talvez o melhor overall B para pista"),
  tune("b19", "Honda Civic RS 1974", "B", "Pista/Sprint", "150374995", "LetzeLU", "Não recomendado pra pista molhada"),
  tune("b20", "Honda Civic SI 1986", "B", "Rally", "102689759", "Cast Haste", "Extremamente fácil de dirigir"),
  tune("b21", "Honda CR-X SIR Ω", "B", "Pista/Allround", "603731395", "ICEBAN"),
  tune("b22", "Honda CR-X SIR Ω", "B", "Rally", "322820677", "SR1 Rain"),
  tune("b23", "Honda NSX 1992", "B", "Pista/Allround", "933910847", "JSR Chronic", "Não recomendado pra pista molhada"),
  tune("b24", "Jeep Wrangler Rubicon", "B", "Rally", "145332043", "AtomicSilure"),
  tune("b25", "Mercedes-Benz X-Class", "B", "Cross", "144564081", "TheDannny", "Precisa de transmissão manual com embreagem"),
  tune("b26", "Mitisubishi Montero Evo Ω", "B", "Cross", "157856498", "MoparTrox"),
  tune("b27", "Mitsubishi Lancer 2001", "B", "Rally", "170581347", "Sir BrandyA1"),
  tune("b28", "Nissan Safari Ω", "B", "Cross", "360140869", "SlowBakedPanda", "Se forçar nas curvas ele capota"),
  tune("b29", "Ram 1500TRX", "B", "Cross", "142415860", "TheDannny", "Precisa de transmissão manual com embreagem"),
  tune("b30", "Subaru Vivio RX-R", "B", "Pista/Allround", "437163803", "ZVTCJAU"),
  tune("b31", "Toyota Celica 1994", "B", "Rally", "676774693", "ruimarques3"),
  tune("b32", "Toyota Celica 2003", "B", "Rally", "143897615", "ZVTCJAU"),
  tune("b33", "Toyota FJ40", "B", "Rally", "905791482", "Errorn2025"),
  tune("b34", "Toyota GR86", "B", "Pista/Allround", "302087287", "Sevensynycal", "Não recomendado pra pista molhada"),
  tune("b35", "Toyota Sera", "B", "Pista/Circuito", "740740415", "xPiNK FM"),
  tune("b36", "Volkswagen Golf R 2014", "B", "Rally", "174508013", "ShaggyScroll660"),
  tune("b37", "Volkswagen Golf R 2021", "B", "Pista/Allround", "470291131", "Frederick637"),

  // ── CLASSE A ───────────────────────────────────────────────────────────────────────
  tune("a01", "Alfa Romeu 155 Q4", "A", "Pista/Allround", "163635872", "SlowBakedPanda"),
  tune("a02", "Alfa Romeu 155 Q4", "A", "Pista/Allround", "412966099", "ZVTCJAU", "Não recomendado para pista molhada"),
  tune("a03", "Alfa Romeu 33s", "A", "Rally", "174880415", "KapienPL"),
  tune("a04", "AMG M12S Warthog", "A", "Cross", "338962541", "ShaggyScroll660", "Só pelo meme, não é competitivo"),
  tune("a05", "Aston Martin DBX Ω", "A", "Cross/Circuito", "151089591", "RealFrezzer8"),
  tune("a06", "Audi RS 3 Sedan", "A", "Pista", "500373614", "ZHTBILBILI"),
  tune("a07", "BMW M2 Competition Ω", "A", "Pista/Allround", "105923026", "Mogokorp"),
  tune("a08", "Camaro ZL1 2017", "A", "Pista/Sprint", "587187546", "Cirno1X", "Não recomendado para pista molhada"),
  tune("a09", "Chevrolet Silverado 2020", "A", "Cross", "332643726", "Iphanhan", "Único real rival da Mercedes-Benz X-Class no cross"),
  tune("a10", "Corvette Stingray 2020", "A", "Pista/Allround", "174854839", "Cirno1X", "Não recomendado para pista molhada"),
  tune("a11", "Corvette Z06 2002", "A", "Pista/Sprint", "144016355", "CybrexzzZ", "Não recomendado para pista molhada"),
  tune("a12", "Dodge Coronet Super Bee", "A", "Rally", "485849446", "ZVTCJAU"),
  tune("a13", "Dodge Viper GTS EF Ω", "A", "Cross", "152361256", "MapleMayhm69", "Forte em circuitos, não tem velocidade para sprint"),
  tune("a14", "Dodge Viper SRT 2008", "A", "Pista/Sprint", "976776057", "CybrexzzZ", "Não recomendado para pista molhada"),
  tune("a15", "Ferrari F355 Berlinetta Ω", "A", "Pista/Allround", "113155885", "TTH Bagel", "Atualmente não da pra conseguir essa tunagem"),
  tune("a16", "Ford Coupe", "A", "Pista/Sprint", "165794096", "Noa Miyako", "PB"),
  tune("a17", "Ford F-450 EF Ω", "A", "Cross/Circuito", "409550829", "KapienPL", "Só é viável em circuitos"),
  tune("a18", "Ford Focus RS 2017", "A", "Pista/Circuito", "642437405", "DEX MUKA"),
  tune("a19", "Ford Mustang 2024", "A", "Pista/Allround", "139650723", "PTW SenkoSan", "Não recomendado para pista molhada"),
  tune("a20", "Ford Mustang Boss 1969", "A", "Rally", "822644843", "ZVTCJAU"),
  tune("a21", "Ford Mustang Coupe 1965", "A", "Rally", "177328322", "ZVTCJAU"),
  tune("a22", "Ford Super GT", "A", "Pista/Allround", "152010431", "TTH Bagel"),
  tune("a23", "Ford Super GT", "A", "Pista/Allround", "249850689", "Cirno1X", "Não recomendado para pista molhada"),
  tune("a24", "GMC Syclone", "A", "Rally", "832220937", "Noa Miyako"),
  tune("a25", "GMC Syclone", "A", "Pista/Allround", "231056528", "CybrexzzZ"),
  tune("a26", "Honda City E II", "A", "Pista/Circuito", "358461613", "Noa Miyako", "Somente para circuitos pequenos"),
  tune("a27", "Honda Civic 2023", "A", "Pista/Allround", "177310772", "JSR Chronic"),
  tune("a28", "Honda Civic 2023", "A", "Pista/Circuito", "154538079", "SlowBakedPanda", "Só é viável em circuitos"),
  tune("a29", "Honda NSX 2005", "A", "Pista/Allround", "942906687", "s2Matheuss"),
  tune("a30", "Honda NSX GT Ω", "A", "Pista/Allround", "180189433", "K1Z Jumpy"),
  tune("a31", "Honda Ridgeline Baja", "A", "Cross", "182880429", "Collingocray"),
  tune("a32", "Jimco Fastball 2019", "A", "Cross", "595595948", "Collingocray", "Não é excepcional em nada mas muito consistente nas corridas"),
  tune("a33", "Koenigsegg Gemera Ω", "A", "Pista/Allround", "406429186", "NeNeko Miye", "Não recomendado para pista molhada"),
  tune("a34", "Lamborghini Gallardo 2012", "A", "Pista/Sprint", "640490027", "ZVTCJAU", "Não recomendado para pista molhada"),
  tune("a35", "Lamborghini Gallardo 2012", "A", "Pista/Allround", "147075675", "THEUZZIII"),
  tune("a36", "Lamborghini Murcielago", "A", "Pista/Allround", "848745290", "THEcaioMAN"),
  tune("a37", "Lancia Stratos", "A", "Rally", "110953196", "ATK Mang0"),
  tune("a38", "Lotus Elise GT1", "A", "Pista/Allround", "493463909", "RealOwenH", "Excelente para pistas com muitas curvas"),
  tune("a39", "Lotus Emira", "A", "Pista/Allround", "641459657", "RcR StriKer", undefined, { isNew: true }),
  tune("a40", "Mercedes-Benz X-Class", "A", "Cross", "225166360", "ZVTCJAU", "É o melhor cross da classe A"),
  tune("a41", "Mitsubishi Minicab Time Attack Ω", "A", "Pista/Circuito", "135447903", "ESV Mars"),
  tune("a42", "Nissan 370Z Nismo", "A", "Pista/Allround", "223642031", "LetzeLU"),
  tune("a43", "Nissan Skyline GT-R  1997", "A", "Pista/Allround", "161529727", "xDV1m"),
  tune("a44", "Plymouth Cuda 426 HEMI", "A", "Cross", "110813885", "ZVTCJAU", "Muito forte porém instável quando aterrissa dos pulos"),
  tune("a45", "Porsche 911 GT3 2012", "A", "Pista/Allround", "676646176", "PS4player8461"),
  tune("a46", "Ram 1500 TRX", "A", "Cross", "178231366", "SlowBakedPanda"),
  tune("a47", "Rivian R1T", "A", "Cross", "142401702", "Noa Miyako"),
  tune("a48", "Shelby Cobra", "A", "Pista/Sprint", "104671695", "CYbrexzzZ", "PB"),
  tune("a49", "Shelby Daytona", "A", "Rally", "140786966", "MSR Mian"),
  tune("a50", "SRT Viper  2013", "A", "Pista/Sprint", "823265729", "ZVTCJAU", "Não recomendado para pista molhada"),
  tune("a51", "Subaru STI 2019", "A", "Pista/Allround", "115358635", "SlowBakedPanda", undefined, { isNew: true }),
  tune("a52", "Toyota 86 2013", "A", "Pista/Sprint", "147767459", "Noa Miyako", "PB Não recomendado para pista molhada"),
  tune("a53", "Toyota Sports 800", "A", "Pista/Sprint", "381108485", "Noa Miyako", "PB Não recomendado para pista molhada"),
  tune("a54", "Toyota T100 Baja", "A", "Cross", "157422404", "NEPOSHA"),
  tune("a55", "Toyota Tacoma", "A", "Cross", "589310413", "Jman Elda"),
  tune("a56", "Toyota Trueno EF Ω", "A", "Pista/Sprint", "127080468", "AzuGenerator", "PB Carro suicida"),
  tune("a57", "Toyota Trueno EF Ω", "A", "Rally", "842516241", "MSR Mian", "Muito fácil de dirigir"),

  // ── CLASSE S1 ──────────────────────────────────────────────────────────────────────
  tune("s_101", "Acura NSX Type S", "S1", "Pista/Allround", "321575270", "Nalak28"),
  tune("s_102", "Audi #2 Sport Quattro", "S1", "Rally", "180745978", "Jeppe JSV"),
  tune("s_103", "Audi R8 LMS", "S1", "Pista/Allround", "780958881", "ESV Vini"),
  tune("s_104", "BMW M4 C PBV", "S1", "Pista/Allround", "347494576", "ESV Lawrence"),
  tune("s_105", "Corvette E-Ray", "S1", "Pista/Allround", "144199108", "aTTaX Johnson"),
  tune("s_106", "Corvette Stingray 2020", "S1", "Pista/Allround", "151256432", "LetzeLU"),
  tune("s_107", "Corvette Z06 2015", "S1", "Pista/Allround", "149676532", "GRT x1Bieel"),
  tune("s_108", "Dodge Dart Ω", "S1", "Cross", "175625992", "ZVTCJAU", "Se conhecer a pista não perde pra ninguem"),
  tune("s_109", "Dodge Viper GTS EF Ω", "S1", "Cross/Rally", "991067019", "Rocklxd", "É o melhor overall Cross"),
  tune("s_110", "Dodge Viper SRT 2008", "S1", "Pista/Allround", "164415333", "BACKOFF77"),
  tune("s_111", "Dodge Viper SRT 2008", "S1", "Pista/Circuito", "155319618", "SlowBakedPanda"),
  tune("s_112", "Ferrari 296 GTB Ω", "S1", "Pista/Allround", "507860338", "LetzeLU"),
  tune("s_113", "Ferrari 458 S", "S1", "Pista/Allround", "133458941", "LetzeLU"),
  tune("s_114", "Ferrari Enzo", "S1", "Pista/Allround", "175336217", "GRT Nicck"),
  tune("s_115", "Ferrari FXX", "S1", "Pista/Sprint", "368667722", "ZVTCJAU", "Não recomendado para pista molhada"),
  tune("s_116", "Ferrari Laferrari", "S1", "Pista/Sprint", "253518947", "Nalak28", "Não recomendado para pista molhada", { isNew: true }),
  tune("s_117", "Ferrari Roma", "S1", "Pista/Allround", "140260193", "LetzeLU", undefined, { isNew: true }),
  tune("s_118", "Ferrari SF90", "S1", "Pista/Allround", "131070547", "Mustuff124"),
  tune("s_119", "Ford #25 Bronco", "S1", "Cross", "478473257", "Jeppe JSV"),
  tune("s_120", "Ford RS200", "S1", "Rally", "155847590", "GTR19945037"),
  tune("s_121", "Honda CRX WTAC Ω", "S1", "Pista/Circuito", "169608987", "F1R Hardy", "Só pra circuito de time attack"),
  tune("s_122", "Honda NSX 1992", "S1", "Pista/Allround", "166231445", "Noa Miyako"),
  tune("s_123", "Honda NSX GT Ω", "S1", "Pista/Sprint", "698727283", "CybrexzzZ", "PB"),
  tune("s_124", "Jaguar XJ220S TWR", "S1", "Rally", "240331604", "ZVTCJAU"),
  tune("s_125", "Jaguar XJR-15", "S1", "Pista/Sprint", "364860253", "Noa Miyako", "PB Mas fácil de controlar"),
  tune("s_126", "Jeep Trailcat", "S1", "Cross", "113739534", "Noa Miyako"),
  tune("s_127", "Koenisegg Agera", "S1", "Pista/Allround", "109025162", "ZVTCJAU", undefined, { isNew: true }),
  tune("s_128", "Lamborghini Centenario", "S1", "Pista/Allround", "186844511", "theEBTwarrior"),
  tune("s_129", "Lamborghini Countach 2021", "S1", "Pista/Allround", "971170140", "ESV Rapture"),
  tune("s_130", "Lamborghini Diablo GTR Ω", "S1", "Rally", "183038814", "ZVTCJAU", "Atualmente não da pra conseguir essa tunagem"),
  tune("s_131", "Lamborghini Huracan Evo Ω", "S1", "Pista/Allround", "848111494", "LetzeLU"),
  tune("s_132", "Lamborghini Huracan STO", "S1", "Pista/Allround", "174155902", "skyinfin"),
  tune("s_133", "Lamborghini Sterrato", "S1", "Rally", "167731877", "ShaggyScroll660", "Bastante instável em pistas com muitas elevações"),
  tune("s_134", "Lancia Delta S4", "S1", "Rally", "165795412", "LetzeLU"),
  tune("s_135", "Lotus Exige 2018", "S1", "Pista/Allround", "799133542", "CybrexzzZ", undefined, { isNew: true }),
  tune("s_136", "Lotus Elise GT1", "S1", "Rally", "189772072", "Noa Miyako"),
  tune("s_137", "Mazda 787B Ω", "S1", "Pista/Allround", "128172950", "RASLockRe7"),
  tune("s_138", "Mazda Miata EF Ω", "S1", "Pista/Allround", "115749728", "CybrexzzZ"),
  tune("s_139", "Mazda Miata EF Ω", "S1", "Rally", "128928248", "Rocklxd", "Mais veloz que os demais mas menos grip no asfalto"),
  tune("s_140", "Mclaren 12C", "S1", "Pista/Allround", "147708012", "SeeyeahBoss"),
  tune("s_141", "Mclaren 620R Ω", "S1", "Pista/Allround", "264811446", "TonyTKS", "S1 AWD mais forte do jogo"),
  tune("s_142", "Mclaren 650S Spider", "S1", "Pista/Allround", "120449939", "HenRSBR"),
  tune("s_143", "Mclaren 765LT", "S1", "Pista/Allround", "812139843", "TheDannny"),
  tune("s_144", "Mercedez 190 E EF Ω", "S1", "Pista/Circuito", "153897841", "pyrtti", "Só pra circuito de time attack"),
  tune("s_145", "Mercedez AMG CLK Ω", "S1", "Rally", "148068541", "Rocklxd", "O Carro de rally com mais grip tanto na terra quanto asfalto da S1"),
  tune("s_146", "Mercedez AMG CLK Ω", "S1", "Pista", "788116937", "Noa Miyako"),
  tune("s_147", "Nissan Silhouette Ω", "S1", "Rally", "334863208", "ATK Mang0"),
  tune("s_148", "Noble M600", "S1", "Pista/Allround", "179507105", "jeneies", "Forte em sprint de velocidade"),
  tune("s_149", "Porsche 917 LH", "S1", "Rally", "765834758", "Iphanhan"),
  tune("s_150", "Porshe Carrera GT Ω", "S1", "Pista/Allround", "851099248", "GRT Nicck"),
  tune("s_151", "Porshe Cayman GT3 WTAC", "S1", "Pista/Circuito", "152707701", "sepdasviech"),
  tune("s_152", "Porshe GT2 RS 2018", "S1", "Pista/Allround", "476448179", "Mustuff124"),
  tune("s_153", "Porshe GT3 2021", "S1", "Pista/Allround", "884430110", "ESV Rapture"),
  tune("s_154", "Porshe GT3 RS 2023", "S1", "Pista/Allround", "140234042", "Nalak28"),
  tune("s_155", "RJ Anderson Polaris", "S1", "Cross", "110744130", "Jeppe JSV"),
  tune("s_156", "Shelby Cobra", "S1", "Rally", "504978380", "KapienPL"),
  tune("s_157", "Subaru BRZ EF Ω", "S1", "Cross", "381012195", "Noa Miyako"),
  tune("s_158", "Toyota Supra WTAC Ω", "S1", "Pista/Circuito", "134394781", "GRT Nicck", "Só é viável em circuitos"),
  tune("s_159", "Toyota Tacoma EF Ω", "S1", "Pista/Allround", "182339831", "ZVTCJAU", "Não recomendado para pista molhada"),
  tune("s_160", "Toyota Trueno EF Ω", "S1", "Rally", "334051072", "KapienPL"),
  tune("s_161", "Toyota Trueno EF Ω", "S1", "Pista/Sprint", "929950902", "invrtebrate", "PB Ta certo mesmo ele é 795 mesmo"),

  // ── CLASSE S2 ──────────────────────────────────────────────────────────────────────
  tune("s_201", "Ferrari F40 C", "S2", "Pista/Allround", "587973766", "TonyTKS"),
  tune("s_202", "Ferrari FXX", "S2", "Pista/Allround", "111645973", "K1Z Jumpy"),
  tune("s_203", "Koenigsegg CCGT", "S2", "Pista/Allround", "966454256", "Noa Miyako"),
  tune("s_204", "Koenigsegg Gemera Ω", "S2", "Pista/Sprint", "615813756", "NeNeko Miye", "PB"),
  tune("s_205", "Lamborghini SCV12", "S2", "Pista/Allround", "521801083", "Suyunbai98", "É o melhor overall da classe"),
  tune("s_206", "Lamborghini Sesto Elemento Ω", "S2", "Pista/Allround", "787474542", "chickenlin666"),
  tune("s_207", "Lexus LFA EF Ω", "S2", "Pista/Allround", "771225930", "ESV Mars"),
  tune("s_208", "Mazda 787B Ω", "S2", "Pista/Allround", "558127738", "TonyTKS"),
  tune("s_209", "Mazda Furai Ω", "S2", "Pista/Allround", "903797630", "TheDannny"),
  tune("s_210", "Mazda Miata EF Ω", "S2", "Pista/Sprint", "131635218", "Noa Miyako", "PB"),
  tune("s_211", "Mclaren F1 GT", "S2", "Pista/Sprint", "678642145", "Noa Miyako", "PB"),
  tune("s_212", "Nissan Silhouette Ω", "S2", "Pista/Circuito", "892812852", "LetzeLU"),
  tune("s_213", "Porsche 918", "S2", "Pista/Allround", "128801038", "SZUI3I"),
  tune("s_214", "Porsche Cayman GT3 WTAC", "S2", "Pista/Circuito", "957680747", "RcR StriKer"),
  tune("s_215", "Porsche GT2 RS 2018", "S2", "Pista/Allround", "935693477", "LetzeLU"),
  tune("s_216", "Porsche GT3 RS 2023", "S2", "Pista/Allround", "625597283", "KillerBee6236"),
  tune("s_217", "Ultima Coupe", "S2", "Pista/Sprint", "179652488", "KilianFirebold", "PB Requer câmbio manual, não deixar reduzir de 3 marcha"),

  // ── CLASSE R ───────────────────────────────────────────────────────────────────────
  tune("r01", "Aston Martin Valhalla Ω", "R", "Pista/Allround", "158077963", "K1Z Jumpy"),
  tune("r02", "Aston Martin Valkyrie AMR", "R", "Pista/Allround", "323646214", "Jaba Qc", "Só é viável em corridas de baixa velocidade"),
  tune("r03", "Ferrari 599XX Evo Ω", "R", "Pista/Allround", "699687845", "Max Ph3n0m3noN"),
  tune("r04", "Ferrari F40 C", "R", "Pista/Allround", "124134056", "DEX CODCAOS"),
  tune("r05", "Ferrari F50 GT Ω", "R", "Pista/Allround", "154771525", "ESV Rapture", "Mais indicada pra sprint de velocidade"),
  tune("r06", "Ferrari FXX K Evo PBV Ω", "R", "Pista/Allround", "109463643", "SZUI3I"),
  tune("r07", "Koenisseg CCGT", "R", "Pista/Allround", "188279613", "K1Z Jumpy"),
  tune("r08", "Koenisseg Gemera Ω", "R", "Pista/Sprint", "593141894", "NeNeko Miye", "PB Suicida em curvas"),
  tune("r09", "Lamborghini SCV12", "R", "Pista/Allround", "373423595", "Martin0072624"),
  tune("r10", "Lamborghini Sesto Elemento Ω", "R", "Pista/Allround", "288514931", "trviis", "Uma alternativa um pouco mais fraca ao Mazda 787B"),
  tune("r11", "Lotus Elise WTAC Ω", "R", "Pista/Allround", "646645027", "K1Z Jeremy", "Muito forte em sprint de baixa velocidade"),
  tune("r12", "Lotus Elise WTAC Ω", "R", "Pista/Circuito", "934507867", "trviis", "Tunagem focada em circuito"),
  tune("r13", "Lotus Evija EF", "R", "Pista/Sprint", "106345415", "Keunotorrr", "PB Muito forte em corridas de alta velocidade"),
  tune("r14", "Mazda 787B Ω", "R", "Pista/Allround", "143449315", "LamaDummchen171", "Melhor overall da classe R"),
  tune("r15", "Mazda Furai Ω", "R", "Pista/Allround", "142177640", "LamaDummchen171", "Melhor da classe R para sprint e circuitos de velocidade"),
  tune("r16", "Mclaren F1 GT", "R", "Pista/Sprint", "167772756", "huondoom", "Atualmente não da pra conseguir essa tunagem"),
  tune("r17", "Mercedez AMG One", "R", "Pista/Circuito", "158273580", "BACKOFF77"),
  tune("r18", "Mitsubishi Sierra Ω", "R", "Pista/Allround", "131287772", "Nalak28", "Muito grip e velocidade razoável"),
  tune("r19", "Nissan Silvia WTAC Ω", "R", "Pista/Allround", "894456253", "trviis", "Forte em sprint de baixa velocidade"),
  tune("r20", "Nissan Skyline WTAC Ω", "R", "Pista/Allround", "434858691", "LetzeLU", "Forte em sprint de baixa velocidade"),
  tune("r21", "Pagani Huayra R Ω", "R", "Pista/Allround", "119059194", "BACKOFF77"),
  tune("r22", "Ultima Coupe", "R", "Pista/Sprint", "908296655", "KilianFirebold", "PB Requer câmbio manual, não deixar reduzir de 3 marcha"),
]

// Top Rally benchmarks — atualizar manualmente quando a aba Top Rally mudar
export interface RallyBenchmark {
  class: "A"
  car: string
  times: { track: string; time: string }[]
  shareCode: string
  tuner: string
  note?: string
}

export const TOP_RALLY_BENCHMARKS: RallyBenchmark[] = [
  {
    class: "A", car: "Shelby Daytona",
    times: [
      { track: "Floresta de Bambu", time: "1:45.560" },
      { track: "Trilha Nakubira",   time: "3:06.146" },
      { track: "Trilha Takashiro",  time: "2:07.183" },
    ],
    shareCode: "549465733", tuner: "Zookiiwi",
    note: "Top 1 na Takashiro usa essa tunagem",
  },
  {
    class: "A", car: "Shelby Daytona",
    times: [
      { track: "Floresta de Bambu", time: "1:44.739" },
      { track: "Trilha Nakubira",   time: "3:05.772" },
      { track: "Trilha Takashiro",  time: "2:06.655" },
    ],
    shareCode: "121969190", tuner: "KapienPL",
    note: "Mais rápida mas o freio trava a roda",
  },
  {
    class: "A", car: "Shelby Daytona",
    times: [
      { track: "Floresta de Bambu", time: "1:44.264" },
      { track: "Trilha Nakubira",   time: "3:04.711" },
      { track: "Trilha Takashiro",  time: "2:06.335" },
    ],
    shareCode: "140786966", tuner: "MSR Mian",
    note: "Mais consistente",
  },
]
