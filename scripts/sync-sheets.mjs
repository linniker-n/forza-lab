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

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("⏳ Fetching Tunagens V2 from Google Sheets...")
  const csv = await fetchCsv(TUNES_GID)

  const rows = parseCsv(csv)
  console.log(`📄 ${rows.length} CSV rows parsed`)

  const { addDate, newSet } = parseNewlyAdded(rows)
  console.log(`⚡ Adicionados ${addDate}: ${newSet.size} car(s) → [${[...newSet].join(", ")}]`)

  const tunes = parseTunes(rows, newSet)
  console.log(`🎮 ${tunes.length} tunes found`)

  const ts = generateTs(tunes, addDate)
  await fs.writeFile(OUT, ts, "utf-8")
  console.log(`✅ Written: ${OUT}`)
}

main().catch((err) => { console.error("❌", err.message); process.exitCode = 1 })
