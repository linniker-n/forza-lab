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

export interface TrackProfileDemand {
  aero: number
  stiffness: number
  speed: number
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

export function getTrackProfileDemand(intent: TuneIntent): TrackProfileDemand {
  const source = groups[intent].length > 0 ? groups[intent] : groups.balanced
  const avgAero = source.length > 0
    ? source.reduce((sum, track) => sum + track.a, 0) / source.length
    : 2.8
  const avgStiffness = source.length > 0
    ? source.reduce((sum, track) => sum + track.x, 0) / source.length
    : 0.36

  const aero = Math.min(Math.max(avgAero / 5, 0), 1)
  const stiffness = Math.min(Math.max((avgStiffness - 0.25) / 0.4, 0), 1)

  return {
    aero,
    stiffness,
    speed: 1 - aero,
  }
}
