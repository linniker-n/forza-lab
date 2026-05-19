/**
 * Fetches image URLs for cars missing photos from the Forza Fandom wiki.
 * Uses the MediaWiki API to search for each car's file in the File namespace.
 *
 * Run:  node scripts/fetch-missing-images.mjs
 */

import { readFileSync, writeFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __dir = dirname(fileURLToPath(import.meta.url))
const DATA  = join(__dir, "../src/data/cars.generated.json")

const WIKI_API = "https://forza.fandom.com/api.php"
const DELAY_MS = 250   // polite delay between requests

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

/** Fetch JSON from a URL, return null on error */
async function fetchJSON(url) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "ForzaTuneLab/1.0 image-fetcher" } })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

/**
 * Converts "Alfa Romeo Giulia GTAm" → "FH6_Alfa_Romeo_Giulia_GTAm"
 * Mirrors the naming convention observed on the Forza Fandom wiki.
 */
function toWikiSlug(brand, model) {
  const name = `${brand} ${model}`.trim()
  return "FH6_" + name.replace(/\s+/g, "_")
}

/**
 * Try to resolve a wiki File URL via the MediaWiki imageinfo API.
 * Tries several common file extensions.
 */
async function resolveFileURL(slug) {
  for (const ext of [".png", ".jpg", ".jpeg", ".webp"]) {
    const title = `File:${slug}${ext}`
    const url = `${WIKI_API}?action=query&prop=imageinfo&titles=${encodeURIComponent(title)}&iiprop=url&format=json&origin=*`
    const data = await fetchJSON(url)
    if (!data) continue
    const pages = Object.values(data?.query?.pages ?? {})
    const imageinfo = pages[0]?.imageinfo?.[0]?.url
    if (imageinfo) return imageinfo
    await sleep(50)
  }
  return null
}

/**
 * Fallback: search the File namespace for anything that starts with the slug.
 */
async function searchFile(slug) {
  const url = `${WIKI_API}?action=query&list=search&srsearch=${encodeURIComponent(slug)}&srnamespace=6&srlimit=5&format=json&origin=*`
  const data = await fetchJSON(url)
  if (!data) return null

  const hits = data?.query?.search ?? []
  if (hits.length === 0) return null

  // Try to find the best match (first result whose title starts with the slug)
  const best = hits.find((h) => h.title.toLowerCase().includes("fh6")) ?? hits[0]
  if (!best) return null

  // Resolve that file's URL
  const fileURL = `${WIKI_API}?action=query&prop=imageinfo&titles=${encodeURIComponent(best.title)}&iiprop=url&format=json&origin=*`
  const fd = await fetchJSON(fileURL)
  if (!fd) return null

  const pages = Object.values(fd?.query?.pages ?? {})
  return pages[0]?.imageinfo?.[0]?.url ?? null
}

async function main() {
  const raw  = JSON.parse(readFileSync(DATA, "utf8"))
  const cars = raw.cars

  const missing = cars.filter((c) => !c.image_url && !c.imagin_make)
  console.log(`\nFetching images for ${missing.length} cars...\n`)

  let found = 0
  let notFound = 0

  for (const car of missing) {
    const slug = toWikiSlug(car.brand, car.model)
    process.stdout.write(`[${car.brand} ${car.model}] → `)

    // 1. Try exact file lookup
    let imgUrl = await resolveFileURL(slug)
    await sleep(DELAY_MS)

    // 2. Fallback: search
    if (!imgUrl) {
      imgUrl = await searchFile(slug)
      await sleep(DELAY_MS)
    }

    if (imgUrl) {
      car.image_url = imgUrl
      console.log("✓  " + imgUrl.slice(0, 70))
      found++
    } else {
      console.log("✗  not found")
      notFound++
    }
  }

  writeFileSync(DATA, JSON.stringify(raw, null, 2), "utf8")
  console.log(`\nDone. Found: ${found}  Not found: ${notFound}`)
  console.log(`cars.generated.json updated.`)
}

main().catch((e) => { console.error(e); process.exit(1) })
