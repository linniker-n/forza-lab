/**
 * Fetches the FH6 community tune data from Google Sheets and regenerates
 * src/data/community-tunes.ts automatically.
 *
 * Usage:
 *   node scripts/sync-sheets.mjs
 *
 * Requires the sheet to be shared as "Anyone with the link can view".
 */

import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dir = path.dirname(fileURLToPath(import.meta.url))
const ROOT    = path.resolve(__dir, "..")
const OUT     = path.resolve(ROOT, "src/data/community-tunes.ts")

// ── Config ────────────────────────────────────────────────────────────────────
const SHEET_ID  = "1DeT8nn8UMrI4ZeAHMcfZH4TzzL9E-fM6_ath5z2v9F8"
const TUNES_GID = ""    // "Tunagens V2" (primeira aba — sem GID exporta a padrão)

const VALID_CLASSES = new Set(["C", "B", "A", "S1", "S2", "R"])

// ── CSV parser ────────────────────────────────────────────────────────────────
function parseCsv(text) {
  const rows = []
  let row = [], field = "", inQ = false
  const n = text.length

  for (let i = 0; i < n; i++) {
    const ch = text[i]
    if (inQ) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (ch === '"') inQ = false
      else field += ch
    } else {
      if (ch === '"') { inQ = true }
      else if (ch === ',') { row.push(field.trim() || null); field = "" }
      else if (ch === '\n' || ch === '\r') {
        row.push(field.trim() || null)
        if (row.some(Boolean)) rows.push(row)
        row = []; field = ""
        if (ch === '\r' && text[i + 1] === '\n') i++
      } else field += ch
    }
  }
  row.push(field.trim() || null)
  if (row.some(Boolean)) rows.push(row)
  return rows
}

function cell(row, i) { return row?.[i]?.trim() || null }

// ── Fetch ─────────────────────────────────────────────────────────────────────
async function fetchCsv(gid) {
  const params = gid ? `format=csv&gid=${gid}` : `format=csv`
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?${params}`
  const res = await fetch(url, { redirect: "follow" })
  if (!res.ok) throw new Error(`Sheets export failed: HTTP ${res.status}\nURL: ${url}\n\nVerifique se a planilha está compartilhada como "Qualquer pessoa com o link pode ver".`)
  return res.text()
}

// ── Normalize ─────────────────────────────────────────────────────────────────
function normalizeCode(raw) {
  if (!raw) return null
  const n = Number(String(raw).replace(/,/g, ""))
  if (!isFinite(n) || n <= 0) return null
  return String(Math.round(n))
}

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/ω/g, "")
    .replace(/\s+(ef|wtac|pbv)\b/gi, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

// ── Parse "Adicionados" legend ────────────────────────────────────────────────
function parseNewlyAdded(rows) {
  // The legend lives in rows before the first "CLASSE X" header.
  // "Adicionados DD/MM" appears in column 8 (I), followed by car names like
  // "Ferrari Laferrari S1" or "Datsun Roadster B". Column 10 (K) may also
  // contain extra entries on the same rows.
  const ADD_COLS = [8, 10]
  let addDate = null
  const newSet = new Set() // "normalized car name|CLASS"

  for (const row of rows) {
    const a = cell(row, 0)
    if (a && /^CLASSE\s+(C|B|A|S1|S2|R)$/i.test(a)) break

    for (const col of ADD_COLS) {
      const val = cell(row, col)
      if (!val) continue

      if (/^Adicionados/i.test(val)) {
        addDate = val.replace(/^Adicionados\s*/i, "").trim()
        continue
      }

      // "Koenisegg Agera S1" → car="Koenisegg Agera", class="S1"
      const parts = val.trim().split(/\s+/)
      const last  = parts[parts.length - 1]
      if (VALID_CLASSES.has(last)) {
        const carName = parts.slice(0, -1).join(" ")
        newSet.add(`${normalizeName(carName)}|${last}`)
      }
    }
  }

  return { addDate: addDate ?? "?", newSet }
}

// ── Parse tunes ───────────────────────────────────────────────────────────────
function parseTunes(rows, newSet) {
  const tunes = []
  let currentClass = null

  for (const row of rows) {
    const a = cell(row, 0)
    if (!a) continue

    const classMatch = a.match(/^CLASSE\s+(C|B|A|S1|S2|R)$/i)
    if (classMatch) { currentClass = classMatch[1].toUpperCase(); continue }
    if (!currentClass) continue

    const raceType    = cell(row, 2)
    const tuner       = cell(row, 4)
    const shareCode   = normalizeCode(cell(row, 3))
    if (!raceType || !tuner || !shareCode) continue

    const description   = cell(row, 5)
    const isNew         = newSet.has(`${normalizeName(a)}|${currentClass}`)
    const isUnavailable = !!description?.toLowerCase().includes("não dá pra conseguir")

    tunes.push({ car: a, class: currentClass, raceType, shareCode, tuner, description, isNew, isUnavailable })
  }

  return tunes
}

// ── TypeScript generator ──────────────────────────────────────────────────────
function q(str) { return JSON.stringify(str) }

function renderTuneLine(t) {
  const hasDesc  = !!t.description
  const hasFlags = t.isNew || t.isUnavailable
  const flags    = [t.isNew && "isNew: true", t.isUnavailable && "isUnavailable: true"].filter(Boolean).join(", ")

  let args = `${q(t._id)}, ${q(t.car)}, ${q(t.class)}, ${q(t.raceType)}, ${q(t.shareCode)}, ${q(t.tuner)}`
  if (hasDesc && hasFlags)  args += `, ${q(t.description)}, { ${flags} }`
  else if (hasDesc)         args += `, ${q(t.description)}`
  else if (hasFlags)        args += `, undefined, { ${flags} }`
  return `  tune(${args}),`
}

function generateTs(tunes, addDate) {
  // Assign IDs per class
  const counter = {}
  for (const t of tunes) {
    const k = t.class
    counter[k] = (counter[k] || 0) + 1
    const prefix = k.toLowerCase().replace(/\d/, (d) => `_${d}`)
    t._id = `${prefix}${String(counter[k]).padStart(2, "0")}`
  }

  const CLASS_ORDER = ["C", "B", "A", "S1", "S2", "R"]
  const byClass = {}
  for (const t of tunes) {
    ;(byClass[t.class] ??= []).push(t)
  }

  const sections = CLASS_ORDER.flatMap((cls) => {
    const items = byClass[cls] ?? []
    if (!items.length) return []
    const bar = "─".repeat(Math.max(0, 72 - cls.length))
    return [`\n  // ── CLASSE ${cls} ${bar}`, ...items.map(renderTuneLine)]
  })

  return `// AUTO-GENERATED — do not edit by hand. Run: npm run sync:sheets
// Last sync: ${new Date().toISOString()} | Adicionados: ${addDate}

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
  const cleanDesc = isPB ? desc?.replace(/^PB\\s*/, "") : desc
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

export const COMMUNITY_TUNES: SpreadsheetTune[] = [${sections.join("\n")}
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
`
}

// ── Supplemental tunes ────────────────────────────────────────────────────────
// Curated from a second community spreadsheet. Persists across syncs.
// Main spreadsheet wins on share-code conflicts.
const SUPPLEMENTAL_TUNES = [
  // ── "Best B Cars" section ───────────────────────────────────────────────────
  { car: "Acura Integra Type R 2001",   class: "B", raceType: "Pista",    shareCode: "522769491",  tuner: "Papa Josh1591" },
  { car: "Dodge Dart 1968",             class: "B", raceType: "Pista",    shareCode: "127326115",  tuner: "VNX Codcaos" },
  { car: "Holden Torana A9X",           class: "B", raceType: "Pista",    shareCode: "249407066",  tuner: "ThankfulBard261" },
  { car: "Honda Civic RS 1974",         class: "B", raceType: "Allround", shareCode: "112404508",  tuner: "ESV Mars" },
  { car: "Honda Civic RS 1974",         class: "B", raceType: "Allround", shareCode: "100056885",  tuner: "Rexazr" },
  { car: "Honda Civic Type R 1997",     class: "B", raceType: "Pista",    shareCode: "136399449",  tuner: "EMW Dave" },
  { car: "Shelby Daytona",              class: "B", raceType: "Allround", shareCode: "151488877",  tuner: "Inayamei" },
  { car: "International Scout 800A 1970", class: "B", raceType: "Rally",  shareCode: "840347205",  tuner: "Cast Haste" },
  { car: "RAM 2500 Power Wagon",        class: "B", raceType: "Rally",    shareCode: "181630398",  tuner: "GhostMan2117" },
  { car: "Toyota FJ40",                 class: "B", raceType: "Rally",    shareCode: "154652753",  tuner: "Korrrupt EU" },
  { car: "International Scout 800A 1970", class: "B", raceType: "Cross",  shareCode: "178406104",  tuner: "Rocklxd" },
  { car: "RAM 2500 Power Wagon",        class: "B", raceType: "Cross",    shareCode: "744406104",  tuner: "Nep0sha" },
  { car: "Honda Civic Type R 1997",     class: "B", raceType: "Allround", shareCode: "112489433",  tuner: "Grandma Driving" },
  { car: "Honda S2000",                 class: "B", raceType: "Allround", shareCode: "798920769",  tuner: "ThankfulBard261" },
  { car: "Subaru Impreza 22B STI",      class: "B", raceType: "Allround", shareCode: "255323448",  tuner: "ThankfulBard261" },
  { car: "Jeep CJ5",                    class: "B", raceType: "Rally",    shareCode: "133421194",  tuner: "GhostMan2117" },
  { car: "Nissan Pulsar GTI-R 1990",    class: "B", raceType: "Rally",    shareCode: "126773170",  tuner: "Korrrupt EU" },
  // ── SepiSP4 / community collection ─────────────────────────────────────────
  { car: "Dodge Dart 1968",             class: "B", raceType: "Pista",    shareCode: "350387335",  tuner: "SepiSP4" },
  { car: "Ford De Luxe Coupe 1932",     class: "B", raceType: "Pista",    shareCode: "181192570",  tuner: "Egao no hana" },
  { car: "Holden Torana A9X",           class: "B", raceType: "Pista",    shareCode: "126495330",  tuner: "SepiSP4" },
  { car: "Holden Torana A9X",           class: "B", raceType: "Pista",    shareCode: "758142846",  tuner: "Egao no hana" },
  { car: "Honda Civic RS 1974",         class: "B", raceType: "Pista",    shareCode: "363966198",  tuner: "SepiSP4" },
  { car: "Honda Civic RS 1974",         class: "B", raceType: "Pista",    shareCode: "171916434",  tuner: "Akumanozero" },
  { car: "International Scout 800A 1970", class: "B", raceType: "Pista",  shareCode: "131879247",  tuner: "Akumanozero" },
  { car: "Nissan Pulsar GTI-R 1990",    class: "B", raceType: "Allround", shareCode: "182428587",  tuner: "SepiSP4" },
  { car: "Shelby Daytona",              class: "B", raceType: "Pista",    shareCode: "180472249",  tuner: "SepiSP4" },
  { car: "Shelby Daytona",              class: "B", raceType: "Pista",    shareCode: "660779402",  tuner: "SepiSP4" },
  { car: "International Scout 800A 1970", class: "B", raceType: "Rally",  shareCode: "971039236",  tuner: "SepiSP4" },
  { car: "International Scout 800A 1970", class: "B", raceType: "Rally",  shareCode: "678698218",  tuner: "SepiSP4" },
  { car: "International Scout 800A 1970", class: "B", raceType: "Cross",  shareCode: "422114880",  tuner: "SepiSP4" },
  { car: "RAM 2500 Power Wagon",        class: "B", raceType: "Cross",    shareCode: "142545394",  tuner: "SepiSP4" },
  { car: "Acura Integra Type R 2001",   class: "B", raceType: "Pista",    shareCode: "109616165",  tuner: "SepiSP4" },
  { car: "Chevrolet Chevelle SS 1970",  class: "B", raceType: "Pista",    shareCode: "131114657",  tuner: "SepiSP4" },
  { car: "Lamborghini Miura 1967",      class: "B", raceType: "Pista",    shareCode: "464578200",  tuner: "Akumanozero" },
  { car: "Mini Cooper S 1965",          class: "B", raceType: "Pista",    shareCode: "142211005",  tuner: "SepiSP4" },
  { car: "Mitsubishi Eclipse 1995",     class: "B", raceType: "Allround", shareCode: "837846590",  tuner: "SepiSP4" },
  { car: "Nissan Skyline GT-R 1993",    class: "B", raceType: "Allround", shareCode: "129233198",  tuner: "Mustuff124" },
  { car: "Plymouth Barracuda Hemi 1971", class: "B", raceType: "Pista",   shareCode: "944053942",  tuner: "VNX Codcaos" },
  { car: "Renault Clio Williams 1993",  class: "B", raceType: "Allround", shareCode: "130092829",  tuner: "SepiSP4" },
  { car: "Shelby Daytona",              class: "B", raceType: "Pista",    shareCode: "401358590",  tuner: "Egao no hana" },
  { car: "Datsun 510 1970",             class: "B", raceType: "Rally",    shareCode: "142696843",  tuner: "SepiSP4" },
  { car: "Ford Bronco 1975",            class: "B", raceType: "Rally",    shareCode: "621070704",  tuner: "yeetlur" },
  { car: "Ford Bronco 1975",            class: "B", raceType: "Rally",    shareCode: "512135056",  tuner: "SepiSP4" },
  { car: "Ford F-100 1956",             class: "B", raceType: "Rally",    shareCode: "543873563",  tuner: "Mustuff124" },
  { car: "Ford F-100 1956",             class: "B", raceType: "Rally",    shareCode: "150426978",  tuner: "Egao no hana" },
  { car: "Honda Civic RS 1974",         class: "B", raceType: "Rally",    shareCode: "395944030",  tuner: "SepiSP4" },
  { car: "Lamborghini Miura 1967",      class: "B", raceType: "Rally",    shareCode: "252174621",  tuner: "Korrrupt EU" },
  { car: "Mini Cooper S 1965",          class: "B", raceType: "Rally",    shareCode: "126741880",  tuner: "Ausax" },
  { car: "Nissan Pulsar GTI-R 1990",    class: "B", raceType: "Rally",    shareCode: "842451514",  tuner: "Korrrupt EU" },
  { car: "Toyota FJ40",                 class: "B", raceType: "Rally",    shareCode: "175276920",  tuner: "yeetlur" },
  { car: "Ford Super Duty F-450",       class: "B", raceType: "Cross",    shareCode: "682007551",  tuner: "SepiSP4" },
  { car: "Toyota FJ40",                 class: "B", raceType: "Cross",    shareCode: "157141010",  tuner: "SepiSP4" },
  { car: "Ford Bronco 1975",            class: "B", raceType: "Cross",    shareCode: "177322128",  tuner: "SepiSP4" },
]

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("⏳ Fetching Tunagens V2 from Google Sheets...")
  const csv = await fetchCsv(TUNES_GID)

  const rows = parseCsv(csv)
  console.log(`📄 ${rows.length} CSV rows parsed`)

  const { addDate, newSet } = parseNewlyAdded(rows)
  console.log(`⚡ Adicionados ${addDate}: ${newSet.size} car(s) → [${[...newSet].join(", ")}]`)

  const tunes = parseTunes(rows, newSet)
  console.log(`🎮 ${tunes.length} tunes from main sheet`)

  const existingCodes = new Set(tunes.map(t => t.shareCode))
  const extras = SUPPLEMENTAL_TUNES
    .filter(t => !existingCodes.has(t.shareCode))
    .map(t => ({ ...t, isNew: t.isNew ?? false, isUnavailable: t.isUnavailable ?? false, description: t.description ?? null }))
  console.log(`➕ ${extras.length} supplemental tunes added (${SUPPLEMENTAL_TUNES.length - extras.length} skipped as duplicates)`)
  const allTunes = [...tunes, ...extras]

  const ts = generateTs(allTunes, addDate)
  await fs.writeFile(OUT, ts, "utf-8")
  console.log(`✅ Written: ${OUT}`)
}

main().catch((err) => { console.error("❌", err.message); process.exitCode = 1 })
