import fs from "node:fs/promises"
import path from "node:path"

const API = "https://forza.fandom.com/api.php"
const LIST_PAGE = "Forza_Horizon_6/Cars"
const SOURCE_URL = "https://forza.fandom.com/wiki/Forza_Horizon_6/Cars"
const OUT_FILE = path.resolve("src/data/cars.generated.json")
const CONCURRENCY = 10

const JAPANESE_BRANDS = new Set(["Acura", "Honda", "Lexus", "Mazda", "Mitsubishi", "Nissan", "Subaru", "Toyota"])

function decodeEntities(input = "") {
  const named = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
    ndash: "-",
    mdash: "-",
    hellip: "...",
  }

  return input
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number.parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (match, name) => named[name] ?? match)
}

function clean(input = "") {
  return decodeEntities(
    input
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]*>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim()
}

function numberFrom(input) {
  if (!input) return undefined
  const value = String(input).replace(/,/g, "").match(/-?\d+(\.\d+)?/)
  return value ? Number(value[0]) : undefined
}

function slugify(input) {
  return decodeEntities(input)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

function escapeRegExp(input) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

async function fetchJson(params, attempt = 1) {
  const url = `${API}?${new URLSearchParams({
    origin: "*",
    format: "json",
    ...params,
  })}`

  const response = await fetch(url, {
    headers: {
      "user-agent": "ForzaTuneLabDataSync/1.0 (local development)",
    },
  })

  if (!response.ok) {
    if (attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt))
      return fetchJson(params, attempt + 1)
    }
    throw new Error(`Fandom API returned ${response.status} for ${params.page ?? params.titles}`)
  }

  return response.json()
}

async function parseWikiPage(page) {
  const json = await fetchJson({
    action: "parse",
    page,
    prop: "text|categories",
  })

  if (!json.parse?.text?.["*"]) {
    throw new Error(`Could not parse wiki page: ${page}`)
  }

  return {
    html: json.parse.text["*"],
    categories: json.parse.categories?.map((category) => category["*"]) ?? [],
  }
}

function getTableRows(html) {
  const start = html.indexOf('<table class="table sortable"')
  const end = html.indexOf("</table>", start)
  if (start === -1 || end === -1) {
    throw new Error("Could not find the FH6 cars table in the Fandom page.")
  }

  const table = html.slice(start, end + "</table>".length)
  return [...table.matchAll(/<tr[\s\S]*?<\/tr>/g)].map((match) => match[0]).slice(1)
}

function parseListRow(row) {
  const cells = [...row.matchAll(/<td\b[\s\S]*?<\/td>/g)].map((match) => match[0])
  if (cells.length < 13) return undefined

  const firstLine = cells[0].match(/<div style="line-height: 16px;[\s\S]*?<\/div>/)?.[0] ?? cells[0]
  const link = firstLine.match(/<a\s+[^>]*href="([^"]+)"[^>]*title="([^"]+)"[^>]*>([\s\S]*?)<\/a>/)
  const missingPage = firstLine.match(/<span class="new" title="([^"]+?) \(page does not exist\)"[^>]*>([\s\S]*?)<\/span>/)
  if (!link && !missingPage) return undefined

  const href = link ? decodeEntities(link[1]) : `/wiki/${missingPage[1].replace(/\s+/g, "_")}`
  const pageTitle = link
    ? decodeEntities(decodeURIComponent(href.replace(/^\/wiki\//, "")))
    : missingPage[1].replace(/\s+/g, "_")
  const vehicleName = clean(link ? link[3] : missingPage[2])
  const year = numberFrom(cells[3].match(/data-sort-value="([^"]+)"/)?.[1]) ?? numberFrom(clean(cells[0]))
  const unlock = clean(cells[0].slice(cells[0].indexOf(firstLine) + firstLine.length))
  const valueCr = numberFrom(cells[5].match(/data-sort-value="([^"]+)"/)?.[1])
  const rarity = clean(cells[5].match(/>(COMMON|RARE|EPIC|LEGENDARY|BARN FIND|TREASURE CAR|FORZA EDITION)</i)?.[1] ?? "")
  const basePi = numberFrom(cells[12].match(/data-sort-value="([^"]+)"/)?.[1]) ?? 100
  const baseClass = clean(cells[12].match(/<span[^>]*>([^<]+)<\/span>/)?.[1] ?? classFromPi(basePi))

  return {
    page_title: pageTitle,
    source_url: `https://forza.fandom.com${href}`,
    vehicle_name: vehicleName,
    year: year ?? 0,
    unlock,
    value_cr: valueCr,
    rarity,
    base_class: baseClass,
    base_pi: basePi,
    performance: {
      speed: numberFrom(clean(cells[6])) ?? 0,
      handling: numberFrom(clean(cells[7])) ?? 0,
      acceleration: numberFrom(clean(cells[8])) ?? 0,
      launch: numberFrom(clean(cells[9])) ?? 0,
      braking: numberFrom(clean(cells[10])) ?? 0,
      offroad: numberFrom(clean(cells[11])) ?? 0,
    },
  }
}

function classFromPi(pi) {
  if (pi >= 951) return "R"
  if (pi >= 901) return "S2"
  if (pi >= 801) return "S1"
  if (pi >= 701) return "A"
  if (pi >= 601) return "B"
  if (pi >= 501) return "C"
  return "D"
}

function extractSections(aside) {
  return [...aside.matchAll(/<section class="pi-item pi-group[\s\S]*?<\/section>/g)].map((match) => {
    const html = match[0]
    const header = clean(html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1] ?? "")
    const values = [...html.matchAll(/<div class="pi-data-value pi-font">([\s\S]*?)<\/div>/g)].map((value) => clean(value[1]))
    return { header, values }
  })
}

function parseImageUrl(aside) {
  const fh6Anchor = aside.match(/<a href="(https:\/\/static\.wikia\.nocookie\.net\/forzamotorsport\/images\/[^"]*FH6[^"]*\/revision\/latest\?cb=\d+)"/i)
  if (fh6Anchor) return decodeEntities(fh6Anchor[1])

  const currentImage = aside.match(/<div class="wds-tab__content wds-is-current">[\s\S]*?<a href="([^"]+)"/)
  if (currentImage?.[1]?.includes("static.wikia.nocookie.net")) {
    return decodeEntities(currentImage[1])
  }

  return ""
}

function parseDetails(html, categories) {
  const asideStart = html.indexOf("<aside")
  const asideEnd = html.indexOf("</aside>", asideStart)
  const aside = asideStart >= 0 && asideEnd >= 0 ? html.slice(asideStart, asideEnd + "</aside>".length) : ""
  const sections = extractSections(aside)
  const general = sections.find((section) => !section.header)?.values ?? []
  const engine = sections.find((section) => section.header === "Engine")?.values ?? []
  const layout = sections.find((section) => section.header === "Layout")?.values ?? []
  const weight = sections.find((section) => section.header === "Weight")?.values ?? []
  const output = engine[1] ?? ""
  const layoutText = layout[0] ?? ""
  const weightText = weight[0] ?? ""
  const carType = clean(html.match(/<b>Car Type:<\/b><\/div><div[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? "")

  const lbFt = numberFrom(output.match(/([\d,.]+)\s*lb/i)?.[1])
  const torqueNm = numberFrom(output.match(/\(([\d,.]+)\s*N[^)]*m\)/i)?.[1])

  return {
    brand: general[0] || undefined,
    description: general[1] || undefined,
    country: general[2] || undefined,
    engine: engine[0] || undefined,
    power_hp: numberFrom(output.match(/([\d,.]+)\s*bhp/i)?.[1]),
    torque_nm: torqueNm ?? (lbFt ? Math.round(lbFt * 1.356) : undefined),
    drivetrain: parseDrivetrain(layoutText),
    transmission: layout[1] || undefined,
    weight_kg: numberFrom(weightText.match(/\(([\d,.]+)\s*kg\)/i)?.[1])
      ?? Math.round((numberFrom(weightText.match(/([\d,.]+)\s*lbs/i)?.[1]) ?? 3300) * 0.453592),
    fandom_car_type: carType,
    image_url: parseImageUrl(aside),
    categories,
  }
}

function parseDrivetrain(layoutText) {
  if (/front-wheel drive/i.test(layoutText)) return "FWD"
  if (/rear-wheel drive/i.test(layoutText)) return "RWD"
  if (/(all|four)-wheel drive/i.test(layoutText)) return "AWD"
  return undefined
}

function parseAspiration(engine = "") {
  if (/electric|battery|motor/i.test(engine)) return "Electric"
  if (/supercharged/i.test(engine)) return "Supercharged"
  if (/turbo/i.test(engine)) return "Turbo"
  return "NA"
}

function mapCarCategories({ brand, country, fandomType, categories }) {
  const tags = new Set()
  const haystack = (fandomType || categories.join(" ")).toLowerCase()

  if (JAPANESE_BRANDS.has(brand) || country === "Japan") tags.add("jdm")
  if (/muscle|rod|custom/.test(haystack)) tags.add("muscle")
  if (/hypercar/.test(haystack)) tags.add("hypercar")
  if (/super car|supercar|super gt|gt cars|track toys|extreme track/.test(haystack)) tags.add("supercar")
  if (/sports|saloon|hatch|cult|eclectic|racer|gt|track/.test(haystack)) tags.add("sport")
  if (/suv|sports utility|utility heroes/.test(haystack)) tags.add("suv")
  if (/pickup|4x4|truck/.test(haystack)) tags.add("truck")
  if (/offroad|off-road|rally|buggy|utv/.test(haystack)) tags.add("offroad")
  if (/buggy|utv/.test(haystack)) tags.add("buggy")
  if (/classic|retro|vintage|rare classic/.test(haystack)) tags.add("classic")

  if (tags.size === 0) tags.add("sport")
  return [...tags]
}

function score(value) {
  return Math.max(0, Math.min(10, Number(value.toFixed(1))))
}

function buildMetaScore(performance, drivetrain, carType) {
  const typeText = carType.toLowerCase()
  const street = score(performance.handling * 0.35 + performance.acceleration * 0.22 + performance.braking * 0.2 + performance.speed * 0.23)
  const drag = score(performance.acceleration * 0.35 + performance.launch * 0.35 + performance.speed * 0.3)
  const rally = score(performance.offroad * 0.45 + performance.handling * 0.25 + performance.acceleration * 0.2 + performance.braking * 0.1 + (/rally/.test(typeText) ? 0.7 : 0))
  const crossCountry = score(performance.offroad * 0.58 + performance.launch * 0.14 + performance.acceleration * 0.14 + performance.speed * 0.14 + (/offroad|4x4|truck|buggy|utv|utility/.test(typeText) ? 0.8 : 0))
  const topSpeed = score(performance.speed)
  const driftBase = performance.handling * 0.28 + performance.acceleration * 0.18 + performance.speed * 0.14 + (drivetrain === "RWD" ? 1.8 : drivetrain === "AWD" ? 0.7 : 0.1)
  const drift = score(driftBase + (/drift|muscle|jdm|sports/.test(typeText) ? 0.7 : 0))

  return { street, drag, drift, rally, cross_country: crossCountry, top_speed: topSpeed }
}

function inferRecommendedUse(metaScore, carType) {
  const typeText = carType.toLowerCase()
  const ranked = Object.entries(metaScore)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key)

  if (/drift/.test(typeText) && !ranked.includes("drift")) ranked.unshift("drift")
  if (/rally/.test(typeText) && !ranked.includes("rally")) ranked.unshift("rally")
  if (/offroad|4x4|truck|buggy|utv|utility/.test(typeText) && !ranked.includes("cross_country")) ranked.unshift("cross_country")
  if (/hypercar/.test(typeText) && !ranked.includes("top_speed")) ranked.unshift("top_speed")

  return [...new Set(ranked)].slice(0, 4)
}

function inferConversions(drivetrain, categories) {
  const tags = new Set(categories)
  const conversions = new Set()

  if (!tags.has("offroad") && !tags.has("buggy")) {
    if (drivetrain !== "AWD") conversions.add("AWD")
    if (drivetrain !== "RWD") conversions.add("RWD")
  }

  if ((tags.has("sport") || tags.has("jdm")) && drivetrain !== "FWD") {
    conversions.add("FWD")
  }

  return [...conversions]
}

function buildCar(row, details) {
  const brand = details.brand || row.vehicle_name.split(" ")[0]
  const model = row.vehicle_name
    .replace(new RegExp(`^${escapeRegExp(brand)}\\s+`, "i"), "")
    .trim() || row.vehicle_name
  const categories = mapCarCategories({
    brand,
    country: details.country,
    fandomType: details.fandom_car_type,
    categories: details.categories,
  })
  const drivetrain = details.drivetrain ?? (categories.includes("offroad") ? "AWD" : categories.includes("sport") ? "RWD" : "AWD")
  const powerHp = details.power_hp ?? Math.round(120 + row.performance.speed * 55 + row.performance.acceleration * 18)
  const weightKg = details.weight_kg ?? Math.round(900 + (10 - row.performance.handling) * 110 + (categories.includes("truck") ? 700 : 0))
  const torqueNm = details.torque_nm ?? Math.round(powerHp * 1.32)
  const metaScore = buildMetaScore(row.performance, drivetrain, details.fandom_car_type)
  const sourceId = slugify(`${row.page_title}_${row.year}`)

  return {
    id: sourceId,
    game: "FH6",
    brand,
    model,
    year: row.year,
    base_class: row.base_class,
    base_pi: row.base_pi,
    drivetrain,
    weight_kg: weightKg,
    power_hp: powerHp,
    torque_nm: torqueNm,
    aspiration: parseAspiration(details.engine),
    car_type: categories,
    recommended_use: inferRecommendedUse(metaScore, details.fandom_car_type),
    available_conversions: inferConversions(drivetrain, categories),
    meta_score: metaScore,
    notes: `${details.fandom_car_type || "FH6 car"} oficial do Forza Wiki. ${row.unlock ? `Disponibilidade: ${row.unlock}.` : ""}`.trim(),
    source_url: row.source_url,
    image_url: details.image_url,
    fandom_car_type: details.fandom_car_type,
    country: details.country,
    unlock: row.unlock,
    rarity: row.rarity,
    value_cr: row.value_cr,
    performance: row.performance,
  }
}

async function mapLimit(items, limit, mapper) {
  const output = new Array(items.length)
  let cursor = 0

  async function worker(workerIndex) {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      output[index] = await mapper(items[index], index, workerIndex)
    }
  }

  await Promise.all(Array.from({ length: limit }, (_, index) => worker(index)))
  return output
}

async function main() {
  console.log(`Fetching ${SOURCE_URL}`)
  const listPage = await parseWikiPage(LIST_PAGE)
  const rows = getTableRows(listPage.html).map(parseListRow).filter(Boolean)
  const seenPages = new Set()
  const uniqueRows = rows.filter((row) => {
    const key = `${row.page_title}:${row.year}`
    if (seenPages.has(key)) return false
    seenPages.add(key)
    return true
  })

  console.log(`Found ${uniqueRows.length} FH6 rows. Fetching car pages...`)
  const cars = await mapLimit(uniqueRows, CONCURRENCY, async (row, index) => {
    try {
      const detailsPage = await parseWikiPage(row.page_title)
      const details = parseDetails(detailsPage.html, detailsPage.categories)
      if ((index + 1) % 50 === 0) console.log(`Parsed ${index + 1}/${uniqueRows.length}`)
      return buildCar(row, details)
    } catch (error) {
      console.warn(`Fallback for ${row.vehicle_name}: ${error.message}`)
      return buildCar(row, {
        categories: [],
        fandom_car_type: "",
        image_url: "",
      })
    }
  })

  cars.sort((a, b) => `${a.brand} ${a.model} ${a.year}`.localeCompare(`${b.brand} ${b.model} ${b.year}`))

  const payload = {
    source_url: SOURCE_URL,
    synced_at: new Date().toISOString(),
    count: cars.length,
    cars,
  }

  await fs.writeFile(OUT_FILE, `${JSON.stringify(payload, null, 2)}\n`, "utf8")
  console.log(`Wrote ${cars.length} cars to ${OUT_FILE}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
