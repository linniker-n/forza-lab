import rawTracks from "@/data/forzatune/track-data-v6.json"
import type { TuneIntent } from "@/types"

interface RawForzaTuneTrack {
  full_name: string
  short_name: string
  id: string
  x: number
  y: number
  a: number
  m: string
  n: number
}

interface TrackProfileStats {
  count: number
  examples: string[]
  note: string
}

const tracks = rawTracks as RawForzaTuneTrack[]

function classifyTrack(track: RawForzaTuneTrack): TuneIntent {
  const note = track.m.toLowerCase()

  if (
    track.a <= 1 ||
    note.includes("minimum downforce") ||
    note.includes("little or no downforce") ||
    note.includes("no downforce") ||
    note.includes("speed on the straights") ||
    note.includes("long straights")
  ) {
    return "speed"
  }

  if (
    track.a >= 4 ||
    note.includes("high downforce") ||
    note.includes("significant downforce") ||
    note.includes("plenty of downforce") ||
    note.includes("sweeping corners")
  ) {
    return "cornering"
  }

  if (
    note.includes("low-speed") ||
    note.includes("slow corners") ||
    note.includes("shorter circuits") ||
    note.includes("short east route")
  ) {
    return "acceleration"
  }

  return "balanced"
}

const groups = tracks.reduce<Record<TuneIntent, RawForzaTuneTrack[]>>((acc, track) => {
  const intent = classifyTrack(track)
  acc[intent].push(track)
  return acc
}, {
  balanced: [],
  control: [],
  speed: [],
  cornering: [],
  acceleration: [],
})

// FH6 has no known route list yet. This "control" bucket is derived from mixed tracks
// where the old app recommended compromise instead of absolute aero minimum/maximum.
groups.control = tracks.filter((track) => track.a >= 2 && track.a <= 3).slice(0, 8)

const NOTES: Record<TuneIntent, string> = {
  balanced: "Perfil misto criado a partir de pistas com reta e curva sem uma exigencia extrema de aero.",
  control: "Perfil de margem: usa pistas mistas como proxy para setups previsiveis em mapa aberto.",
  speed: "Perfil baseado em pistas antigas onde o APK recomendava pouco ou nenhum downforce.",
  cornering: "Perfil baseado em pistas antigas onde o APK recomendava downforce alto para manter velocidade em curvas.",
  acceleration: "Perfil baseado em rotas curtas/lentas onde retomada e saida de curva importam mais que final.",
}

export function getTrackProfileStats(intent: TuneIntent): TrackProfileStats {
  const source = groups[intent].length > 0 ? groups[intent] : groups.balanced

  return {
    count: source.length,
    examples: source.slice(0, 4).map((track) => track.short_name),
    note: NOTES[intent],
  }
}

export function getTrackProfileWarning(intent: TuneIntent): string {
  const stats = getTrackProfileStats(intent)
  const examples = stats.examples.length > 0 ? ` Exemplos antigos usados como referencia: ${stats.examples.join(", ")}.` : ""

  return `${stats.note} Base recuperada: ${stats.count} pistas do APK.${examples}`
}
