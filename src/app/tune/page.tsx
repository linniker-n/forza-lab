"use client"

import { Suspense, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth/AuthProvider"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { CARS, getCarImageUrl } from "@/data/cars"
import { getFirebaseDb } from "@/lib/firebase/client"
import { shareTune } from "@/lib/firebase/community"
import { loadUserProfile } from "@/lib/firebase/profile"
import { useSubscription } from "@/lib/subscription/context"
import { UpgradeModal } from "@/components/paywall/UpgradeModal"
import { useSettings } from "@/lib/settings/context"
import { translateParts } from "@/lib/settings/translations"
import { formatPressure, formatSpring } from "@/lib/settings/units"
import { getFH6IntentLabel } from "@/lib/tune-engine/fh6-intents"
import { generateTune } from "@/lib/tune-engine/generator"
import type { Car, CarClass, ControlType, Drivetrain, DrivingStyle, GeneratedTune, Parts, TuneIntent, TuneRequest, TuneType, TuningSetup } from "@/types"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { useLanguage } from "@/lib/i18n/context"
import { useTranslations } from "@/lib/i18n/translations"

type Difficulty = "easy" | "balanced" | "aggressive"
type CreationMode = "generated" | "player"
type RideHeightLevel = TuningSetup["springs"]["ride_height_front"]
type AeroLevel = TuningSetup["aero"]["front"]

interface PlayerTuneDraft {
  parts: Record<keyof Parts, string>
  tuning: TuningSetup
  piEstimate: number
  notes: string
}

const TUNE_TYPE_VALUES: { v: TuneType; cls: string }[] = [
  { v: "street",        cls: "tag-street" },
  { v: "drag",          cls: "tag-drag" },
  { v: "drift",         cls: "tag-drift" },
  { v: "rally",         cls: "tag-rally" },
  { v: "cross_country", cls: "tag-cross_country" },
  { v: "top_speed",     cls: "tag-top_speed" },
  { v: "grip",          cls: "tag-grip" },
]
const FH6_INTENT_VALUES: TuneIntent[] = ["balanced", "control", "speed", "cornering", "acceleration"]
const CLASSES: CarClass[] = ["D","C","B","A","S1","S2","R","X"]
const DIFFICULTY_VALUES: Difficulty[] = ["easy", "balanced", "aggressive"]
const STYLE_VALUES: DrivingStyle[] = ["casual", "competitive", "meta"]
const CONTROL_VALUES: ControlType[] = ["controller", "keyboard", "wheel"]
const DRIVETRAIN_VALUES: TuneRequest["preferred_drivetrain"][] = ["original", "AWD", "RWD", "FWD"]
const PART_KEYS: (keyof Parts)[] = ["engine", "platform", "drivetrain", "tires", "aero"]
const RIDE_OPTS: RideHeightLevel[] = ["low", "medium-low", "medium", "medium-high", "high", "max"]
const AERO_OPTS: AeroLevel[] = ["min", "low", "medium", "medium-high", "high", "max"]
const GEAR_KEYS = ["gear_1", "gear_2", "gear_3", "gear_4", "gear_5", "gear_6", "gear_7", "gear_8", "gear_9", "gear_10"] as const

/* ── Score color ── */
function scoreColor(s: number) {
  if (s >= 8) return "#34d399"
  if (s >= 6) return "#fbbf24"
  return "#64748b"
}

function selectedDrivetrain(car: Car, preferred: TuneRequest["preferred_drivetrain"]): Drivetrain {
  return preferred === "original" ? car.drivetrain : preferred
}

function defaultDifferential(drivetrain: Drivetrain): TuningSetup["differential"] {
  if (drivetrain === "AWD") {
    return {
      front_accel: 100,
      front_decel: 0,
      rear_accel: 100,
      rear_decel: 0,
      center_balance: 70,
    }
  }
  if (drivetrain === "FWD") {
    return {
      front_accel: 100,
      front_decel: 0,
      rear_accel: 100,
      rear_decel: 0,
    }
  }
  return {
    rear_accel: 100,
    rear_decel: 0,
  }
}

function cloneTuning(tuning: TuningSetup): TuningSetup {
  return {
    tires: { ...tuning.tires },
    gearing: { ...tuning.gearing },
    alignment: { ...tuning.alignment },
    antiroll_bars: { ...tuning.antiroll_bars },
    springs: { ...tuning.springs },
    damping: { ...tuning.damping },
    aero: { ...tuning.aero },
    brakes: { ...tuning.brakes },
    differential: { ...tuning.differential },
  }
}

function partsText(parts: Parts, key: keyof Parts): string {
  return parts[key].join("\n")
}

function parsePartsText(value: string): string[] {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function createPlayerTuneDraft(car: Car, request: TuneRequest): PlayerTuneDraft {
  const base = generateTune(request, car)
  const drivetrain = selectedDrivetrain(car, request.preferred_drivetrain)
  return {
    parts: {
      engine: partsText(base.parts, "engine"),
      platform: partsText(base.parts, "platform"),
      drivetrain: partsText(base.parts, "drivetrain"),
      tires: partsText(base.parts, "tires"),
      aero: partsText(base.parts, "aero"),
    },
    tuning: {
      ...cloneTuning(base.tuning),
      differential: defaultDifferential(drivetrain),
    },
    piEstimate: base.pi_estimate,
    notes: "",
  }
}

function cleanGearing(gearing: TuningSetup["gearing"]): TuningSetup["gearing"] {
  const clean: TuningSetup["gearing"] = {
    final_drive: gearing.final_drive,
    gear_1: gearing.gear_1,
    gear_2: gearing.gear_2,
    gear_3: gearing.gear_3,
    gear_4: gearing.gear_4,
    gear_5: gearing.gear_5,
    gear_6: gearing.gear_6,
  }
  for (const key of GEAR_KEYS.slice(6)) {
    const value = gearing[key]
    if (value !== undefined && Number.isFinite(value)) clean[key] = value
  }
  return clean
}

function cleanDifferential(differential: TuningSetup["differential"], drivetrain: Drivetrain): TuningSetup["differential"] {
  if (drivetrain === "AWD") {
    return {
      front_accel: differential.front_accel ?? 100,
      front_decel: differential.front_decel ?? 0,
      rear_accel: differential.rear_accel,
      rear_decel: differential.rear_decel,
      center_balance: differential.center_balance ?? 70,
    }
  }
  if (drivetrain === "FWD") {
    return {
      front_accel: differential.front_accel ?? 100,
      front_decel: differential.front_decel ?? 0,
      rear_accel: differential.rear_accel,
      rear_decel: differential.rear_decel,
    }
  }
  return {
    rear_accel: differential.rear_accel,
    rear_decel: differential.rear_decel,
  }
}

function cleanTuning(tuning: TuningSetup, drivetrain: Drivetrain): TuningSetup {
  return {
    ...cloneTuning(tuning),
    gearing: cleanGearing(tuning.gearing),
    differential: cleanDifferential(tuning.differential, drivetrain),
  }
}

/* ── Small car thumbnail in picker ── */
function CarThumb({ car, selected, onSelect }: { car: Car; selected: boolean; onSelect(): void }) {
  const [err, setErr] = useState(false)
  const url = getCarImageUrl(car)
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex items-center gap-3 rounded-lg transition-all text-left"
      style={{
        padding: "10px 12px",
        background: selected ? "var(--blue-dim)" : "var(--bg-card)",
        border: `1px solid ${selected ? "var(--border-blue)" : "var(--border-strong)"}`,
        cursor: "pointer",
      }}
    >
      <div
        className="relative rounded overflow-hidden shrink-0"
        style={{ width: 64, height: 40, background: "var(--bg-elevated)" }}
      >
        {url && !err ? (
          <Image src={url} alt={`${car.brand} ${car.model}`} fill sizes="64px"
            className="car-render" style={{ objectFit: "contain", padding: 4 }}
            onError={() => setErr(true)} />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center mono-val"
            style={{ fontSize: 9, opacity: 0.3 }}>{car.brand.slice(0,3).toUpperCase()}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", lineHeight: 1.2 }}>
          {car.brand} {car.model}
        </p>
        <p style={{ fontSize: 10, color: "var(--text-muted)" }}>
          {car.year} · {car.drivetrain} · <span className={`badge-class badge-${car.base_class}`}>{car.base_class}</span>
        </p>
      </div>
      {selected && (
        <div className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
          style={{ background: "var(--blue)" }}>
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
    </button>
  )
}

/* ── Telem row ── */
function TR({ l, v, mono = true }: { l: string; v: string; mono?: boolean }) {
  return (
    <div className="telem-row">
      <span className="telem-label">{l}</span>
      <span className={mono ? "telem-value" : ""} style={mono ? undefined : { fontSize: 11, color: "var(--text)", textTransform: "capitalize" }}>{v}</span>
    </div>
  )
}

/* ── Tune result ── */
function ManualSectionTitle({ children }: { children: string }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--fh6-teal)", marginTop: 12, marginBottom: 8 }}>
      {children}
    </p>
  )
}

function ManualNumberField({ label, value, onChange, step = 0.1, min, max }: {
  label: string
  value: number
  onChange(v: number): void
  step?: number
  min?: number
  max?: number
}) {
  return (
    <label className="flex flex-col gap-1">
      <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
      <input
        type="number"
        className="r-input"
        style={{ padding: "6px 9px", fontSize: 12, height: 34 }}
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}

function ManualOptionalNumberField({ label, value, onChange, step = 0.01, min, max }: {
  label: string
  value?: number
  onChange(v: number | undefined): void
  step?: number
  min?: number
  max?: number
}) {
  return (
    <label className="flex flex-col gap-1">
      <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
      <input
        type="number"
        className="r-input"
        style={{ padding: "6px 9px", fontSize: 12, height: 34 }}
        value={value ?? ""}
        step={step}
        min={min}
        max={max}
        onChange={(event) => {
          const raw = event.target.value
          onChange(raw === "" ? undefined : Number(raw))
        }}
      />
    </label>
  )
}

function ManualSelectField({ label, value, options, onChange, labels }: {
  label: string
  value: string
  options: readonly string[]
  onChange(v: string): void
  labels?: Partial<Record<string, string>>
}) {
  return (
    <label className="flex flex-col gap-1">
      <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
      <select
        className="r-input"
        style={{ padding: "6px 9px", fontSize: 12, height: 34 }}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>{labels?.[option] ?? option}</option>
        ))}
      </select>
    </label>
  )
}

function GuideNote({ children }: { children: string }) {
  return (
    <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.55, marginTop: 10 }}>
      {children}
    </p>
  )
}

function TuneResult({ tune, onReset, onBack }: { tune: GeneratedTune; onReset(): void; onBack(): void }) {
  const url = getCarImageUrl(tune.car)
  const [err, setErr] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [shared, setShared] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)
  const { settings, update } = useSettings()
  const partsLang  = settings.partsLanguage
  const pUnit = settings.pressureUnit
  const spUnit = settings.springUnit
  const [saveError, setSaveError] = useState<string | null>(null)
  const { user } = useAuth()
  const { lang } = useLanguage()
  const t = useTranslations(lang)

  function rideHeight(v: string) {
    return t.tune.rideHeight[v as keyof typeof t.tune.rideHeight] ?? v
  }
  function aeroLvl(v: string) {
    return t.tune.aeroLevel[v as keyof typeof t.tune.aeroLevel] ?? v
  }

  async function shareToCommunnity() {
    if (!user) return
    setSharing(true); setShareError(null)
    try {
      const authorName = user.displayName || user.email?.split("@")[0] || "Anônimo"
      let photoBase64: string | undefined
      try {
        const profile = await loadUserProfile(user.uid)
        photoBase64 = profile?.photoBase64
      } catch {}
      await shareTune(tune, user.uid, authorName, photoBase64)
      setShared(true)
    } catch (err) {
      setShareError(err instanceof Error ? err.message : t.garage.errorShare)
    } finally { setSharing(false) }
  }

  async function saveTune() {
    setSaving(true)
    setSaveError(null)
    const storageKey = `forza-lab:saved-tunes:${user?.uid ?? "local"}`
    let savedTunes: unknown = []
    try {
      const raw = window.localStorage.getItem(storageKey)
      savedTunes = raw ? JSON.parse(raw) : []
    } catch {
      savedTunes = []
    }
    let entryId = `${tune.car.id}_${tune.tune_type}_${Date.now()}`
    try {
      const db = getFirebaseDb()
      if (db && user) {
        try {
          const savePromise = addDoc(collection(db, "users", user.uid, "savedTunes"), {
            tune,
            createdAt: serverTimestamp(),
          })
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), 5000)
          )
          const docRef = await Promise.race([savePromise, timeoutPromise])
          entryId = docRef.id
        } catch {
          setSaveError(t.tune.saveErrorFallback)
        }
      }

      const entry = {
        id: entryId,
        saved_at: new Date().toISOString(),
        tune,
      }
      window.localStorage.setItem(storageKey, JSON.stringify([entry, ...(Array.isArray(savedTunes) ? savedTunes : [])].slice(0, 60)))
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6 anim-up">

      {/* Hero card */}
      <div className="r-card bracket overflow-hidden">
        {/* Image strip */}
        <div className="relative overflow-hidden" style={{ height: 200, background: "linear-gradient(135deg, #080f20 0%, #0c1530 100%)" }}>
          {url && !err && (
            <Image src={url} alt={`${tune.car.brand} ${tune.car.model}`} fill sizes="896px"
              className="hero-car-render" style={{ objectFit: "contain", padding: 28 }}
              onError={() => setErr(true)} />
          )}
          <div className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
            style={{ background: "linear-gradient(to top, var(--bg-card), transparent)" }} />
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <p style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {tune.car.brand} · {tune.car.year}
              </p>
              <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.03em", color: "var(--text)" }}>
                {tune.car.model}
              </h1>
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className={`badge-class badge-${tune.drivetrain === "AWD" ? "awd" : tune.drivetrain === "RWD" ? "rwd" : "fwd"}`}>{tune.drivetrain}</span>
                <span className={`badge-class badge-${tune.target_class}`}>{t.tune.class} {tune.target_class}</span>
                <span className="badge-class" style={{ color: "var(--blue-bright)", background: "var(--blue-dim)", borderColor: "var(--border-blue)" }}>
                  {t.tune.tuneLabels[tune.tune_type]}
                </span>
                <span className="badge-class" style={{ color: "#34d399", background: "rgba(52,211,153,0.08)", borderColor: "rgba(52,211,153,0.22)" }}>
                  FH6 {getFH6IntentLabel(tune.fh6_intent ?? "balanced")}
                </span>
                <span className="badge-class" style={{ color: "var(--text-muted)", background: "transparent", borderColor: "var(--border-strong)" }}>
                  ~{tune.pi_estimate} PI
                </span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button type="button" onClick={() => void saveTune()} disabled={saving} className="r-btn r-btn-outline" style={{ fontSize: 11, opacity: saving ? 0.7 : 1 }}>
                {saved ? t.tune.saved : saving ? t.tune.saving : t.tune.saveTune}
              </button>
              <button
                type="button"
                onClick={() => void shareToCommunnity()}
                disabled={sharing || shared}
                className="r-btn r-btn-ghost"
                style={{ fontSize: 11, opacity: sharing ? 0.7 : 1, color: shared ? "#34d399" : undefined }}
              >
                {shared ? t.tune.shared : sharing ? t.tune.sharing : t.tune.share}
              </button>
              <Link href="/garage" className="r-btn r-btn-ghost" style={{ fontSize: 11 }}>
                {t.tune.toGarage}
              </Link>
              <button type="button" onClick={onBack} className="r-btn r-btn-ghost" style={{ fontSize: 11 }}>
                {t.tune.backBtn}
              </button>
              <button type="button" onClick={onReset} className="r-btn r-btn-ghost" style={{ fontSize: 11 }}>
                {t.tune.newTune}
              </button>
            </div>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 12, lineHeight: 1.6 }}>{tune.summary}</p>
          {saveError && (
            <p style={{ fontSize: 11, color: "#fbbf24", marginTop: 10 }}>{saveError}</p>
          )}
          {shared && (
            <p style={{ fontSize: 11, color: "#34d399", marginTop: 6 }}>
              {t.tune.sharedMsg}{" "}
              <Link href="/community" style={{ color: "#34d399", textDecoration: "underline" }}>{t.tune.seeCommunity}</Link>
            </p>
          )}
          {shareError && (
            <p style={{ fontSize: 11, color: "#fbbf24", marginTop: 6 }}>{shareError}</p>
          )}
        </div>
      </div>

      {/* Unit & language toggles */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 items-center px-4 py-3 rounded-lg"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{t.tune.viewAs}</span>

        <div className="flex items-center gap-1.5">
          <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)" }}>{t.tune.parts}</span>
          <div className="flex rounded" style={{ border: "1px solid var(--border-strong)", overflow: "hidden" }}>
            {(["en", "ptbr"] as const).map((v, i) => (
              <button key={v} type="button" onClick={() => update({ partsLanguage: v })}
                style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", lineHeight: 1.5, background: settings.partsLanguage === v ? "var(--blue)" : "transparent", color: settings.partsLanguage === v ? "#fff" : "var(--text-muted)", border: "none", cursor: "pointer", borderLeft: i > 0 ? "1px solid var(--border-strong)" : "none" }}>
                {v === "en" ? "EN" : "PT-BR"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)" }}>{t.tune.pressure}</span>
          <div className="flex rounded" style={{ border: "1px solid var(--border-strong)", overflow: "hidden" }}>
            {(["psi", "bar"] as const).map((v, i) => (
              <button key={v} type="button" onClick={() => update({ pressureUnit: v })}
                style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", lineHeight: 1.5, background: settings.pressureUnit === v ? "var(--blue)" : "transparent", color: settings.pressureUnit === v ? "#fff" : "var(--text-muted)", border: "none", cursor: "pointer", borderLeft: i > 0 ? "1px solid var(--border-strong)" : "none" }}>
                {v.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)" }}>{t.tune.power}</span>
          <div className="flex rounded" style={{ border: "1px solid var(--border-strong)", overflow: "hidden" }}>
            {(["hp", "cv"] as const).map((v, i) => (
              <button key={v} type="button" onClick={() => update({ powerUnit: v })}
                style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", lineHeight: 1.5, background: settings.powerUnit === v ? "var(--blue)" : "transparent", color: settings.powerUnit === v ? "#fff" : "var(--text-muted)", border: "none", cursor: "pointer", borderLeft: i > 0 ? "1px solid var(--border-strong)" : "none" }}>
                {v.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)" }}>{t.tune.torque}</span>
          <div className="flex rounded" style={{ border: "1px solid var(--border-strong)", overflow: "hidden" }}>
            {(["nm", "kgfm"] as const).map((v, i) => (
              <button key={v} type="button" onClick={() => update({ torqueUnit: v })}
                style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", lineHeight: 1.5, background: settings.torqueUnit === v ? "var(--blue)" : "transparent", color: settings.torqueUnit === v ? "#fff" : "var(--text-muted)", border: "none", cursor: "pointer", borderLeft: i > 0 ? "1px solid var(--border-strong)" : "none" }}>
                {v === "kgfm" ? "kgf·m" : "Nm"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)" }}>{t.tune.springs}</span>
          <div className="flex rounded" style={{ border: "1px solid var(--border-strong)", overflow: "hidden" }}>
            {(["kgfmm", "lbfin"] as const).map((v, i) => (
              <button key={v} type="button" onClick={() => update({ springUnit: v })}
                style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", lineHeight: 1.5, background: settings.springUnit === v ? "var(--blue)" : "transparent", color: settings.springUnit === v ? "#fff" : "var(--text-muted)", border: "none", cursor: "pointer", borderLeft: i > 0 ? "1px solid var(--border-strong)" : "none" }}>
                {v === "kgfmm" ? "kgf/mm" : "lbf/in"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Warnings */}
      {tune.warnings.length > 0 && (
        <div className="space-y-2">
          {tune.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg p-3"
              style={{
                background: w.type === "warning" ? "rgba(245,158,11,0.08)" : "var(--blue-dim)",
                border: `1px solid ${w.type === "warning" ? "rgba(245,158,11,0.2)" : "rgba(37,99,235,0.2)"}`,
              }}>
              <span
                className="mono-val"
                style={{
                  fontSize: 11,
                  flexShrink: 0,
                  color: w.type === "warning" ? "#fbbf24" : "var(--blue-bright)",
                  marginTop: 2,
                }}
              >
                {w.type === "warning" ? "!" : "i"}
              </span>
              <p style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.6 }}>{w.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Parts */}
      <div className="r-card p-5 space-y-4">
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>{t.tune.parts}</p>
        {Object.entries(tune.parts).map(([cat, items]) =>
          (items as string[]).length > 0 ? (
            <div key={cat}>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-subtle)", marginBottom: 6 }}>
                {cat === "engine" ? t.tune.partEngine : cat === "platform" ? t.tune.partPlatform : cat === "drivetrain" ? t.tune.partDrivetrain : cat === "tires" ? t.tune.partTires : t.tune.partAero}
              </p>
              <ul className="space-y-1">
                {translateParts(items as string[], partsLang).map((item, j) => (
                  <li key={j} className="flex items-center gap-2" style={{ fontSize: 12, color: "var(--text)" }}>
                    <span className="w-1 h-1 rounded-full shrink-0" style={{ background: "var(--blue)" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null
        )}
      </div>

      {/* 1. Tires · 2. Gearbox */}
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4 items-start">
        <div className="r-card p-5" style={{ minWidth: 210 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>{t.tune.tires}</p>
          <TR l={t.tune.frontPressure} v={formatPressure(tune.tuning.tires.front, pUnit)} />
          <TR l={t.tune.rearPressure}  v={formatPressure(tune.tuning.tires.rear,  pUnit)} />
          <GuideNote>{t.tune.guideNotes.tires}</GuideNote>
        </div>
        <div className="r-card p-5">
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 }}>{t.tune.gearbox}</p>
          <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-11 gap-2">
            {[
              { l: t.tune.finalGear, v: tune.tuning.gearing.final_drive },
              ...([1,2,3,4,5,6,7,8,9,10] as const).map((g) => ({
                l: `${g}ª`,
                v: tune.tuning.gearing[`gear_${g}` as keyof typeof tune.tuning.gearing] as number | undefined,
              })).filter((x) => x.v !== undefined),
            ].map(({ l, v }) => (
              <div key={l} className="flex flex-col items-center gap-1 p-2 rounded"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                <span style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 600 }}>{l}</span>
                <span className="mono-val" style={{ fontSize: 13 }}>{v}</span>
              </div>
            ))}
          </div>
          <GuideNote>{t.tune.guideNotes.gearbox}</GuideNote>
        </div>
      </div>

      {/* 3. Alignment · 4. Anti-roll Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="r-card p-5">
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>{t.tune.alignment}</p>
          <TR l={t.tune.camberFront} v={`${tune.tuning.alignment.camber_front}°`} />
          <TR l={t.tune.camberRear}  v={`${tune.tuning.alignment.camber_rear}°`} />
          <TR l={t.tune.toeFront}    v={`${tune.tuning.alignment.toe_front}°`} />
          <TR l={t.tune.toeRear}     v={`${tune.tuning.alignment.toe_rear}°`} />
          <TR l={t.tune.caster}      v={`${tune.tuning.alignment.caster}°`} />
          <GuideNote>{t.tune.guideNotes.alignment}</GuideNote>
        </div>
        <div className="r-card p-5">
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>{t.tune.antirollBars}</p>
          <TR l={t.tune.front} v={String(tune.tuning.antiroll_bars.front)} />
          <TR l={t.tune.rear}  v={String(tune.tuning.antiroll_bars.rear)} />
          <GuideNote>{t.tune.guideNotes.antirollBars}</GuideNote>
        </div>
      </div>

      {/* 5. Springs · 6. Dampers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="r-card p-5">
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>{t.tune.springs}</p>
          <TR l={t.tune.stiffFront}  v={formatSpring(tune.tuning.springs.front, spUnit)} />
          <TR l={t.tune.stiffRear}   v={formatSpring(tune.tuning.springs.rear,  spUnit)} />
          <TR l={t.tune.heightFront} v={rideHeight(tune.tuning.springs.ride_height_front)} mono={false} />
          <TR l={t.tune.heightRear}  v={rideHeight(tune.tuning.springs.ride_height_rear)} mono={false} />
          <GuideNote>{t.tune.guideNotes.springs}</GuideNote>
        </div>
        <div className="r-card p-5">
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>{t.tune.dampers}</p>
          <TR l={t.tune.reboundFront} v={String(tune.tuning.damping.rebound_front)} />
          <TR l={t.tune.reboundRear}  v={String(tune.tuning.damping.rebound_rear)} />
          <TR l={t.tune.bumpFront}    v={String(tune.tuning.damping.bump_front)} />
          <TR l={t.tune.bumpRear}     v={String(tune.tuning.damping.bump_rear)} />
          <GuideNote>{t.tune.guideNotes.dampers}</GuideNote>
        </div>
      </div>

      {/* 7. Aerodynamics · 8. Brakes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="r-card p-5">
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>{t.tune.aero}</p>
          <TR l={t.tune.downforceFront} v={aeroLvl(tune.tuning.aero.front)} mono={false} />
          <TR l={t.tune.downforceRear}  v={aeroLvl(tune.tuning.aero.rear)} mono={false} />
          <GuideNote>{t.tune.guideNotes.aero}</GuideNote>
        </div>
        <div className="r-card p-5">
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>{t.tune.brakes}</p>
          <TR l={t.tune.brakeBalance}  v={`${tune.tuning.brakes.balance}%`} />
          <TR l={t.tune.brakePressure} v={`${tune.tuning.brakes.pressure}%`} />
          <GuideNote>{t.tune.guideNotes.brakes}</GuideNote>
        </div>
      </div>

      {/* 9. Differential */}
      <div className="r-card p-5">
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>{t.tune.differential}</p>
        {tune.tuning.differential.front_accel !== undefined && <TR l={t.tune.diffFrontAccel} v={`${tune.tuning.differential.front_accel}%`} />}
        {tune.tuning.differential.front_decel !== undefined && <TR l={t.tune.diffFrontDecel} v={`${tune.tuning.differential.front_decel}%`} />}
        <TR l={t.tune.diffRearAccel} v={`${tune.tuning.differential.rear_accel}%`} />
        <TR l={t.tune.diffRearDecel} v={`${tune.tuning.differential.rear_decel}%`} />
        {tune.tuning.differential.center_balance !== undefined && <TR l={t.tune.diffCenter} v={`${tune.tuning.differential.center_balance}%`} />}
        <GuideNote>{t.tune.guideNotes.differential}</GuideNote>
      </div>

      {/* Strengths / Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="r-card p-5" style={{ border: "1px solid rgba(52,211,153,0.15)" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#34d399", marginBottom: 10 }}>{t.tune.strengths}</p>
          <ul className="space-y-2">
            {tune.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2" style={{ fontSize: 12, color: "var(--text)" }}>
                <span style={{ color: "#34d399", marginTop: 1, flexShrink: 0 }}>+</span>{s}
              </li>
            ))}
          </ul>
        </div>
        <div className="r-card p-5" style={{ border: "1px solid rgba(251,191,36,0.15)" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#fbbf24", marginBottom: 10 }}>{t.tune.weaknesses}</p>
          <ul className="space-y-2">
            {tune.weaknesses.map((w, i) => (
              <li key={i} className="flex items-start gap-2" style={{ fontSize: 12, color: "var(--text)" }}>
                <span style={{ color: "#fbbf24", marginTop: 1, flexShrink: 0 }}>−</span>{w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* How to drive */}
      <div className="r-card p-5 flex gap-4" style={{ border: "1px solid var(--border-blue)" }}>
        <div className="w-8 h-8 flex items-center justify-center rounded-lg shrink-0 mt-0.5"
          style={{ background: "var(--blue-dim)", border: "1px solid var(--border-blue)" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="5.5" stroke="var(--blue-bright)" strokeWidth="1.5"/>
            <path d="M8 5.5v3l2 2" stroke="var(--blue-bright)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--blue-bright)", marginBottom: 6 }}>{t.tune.howToDrive}</p>
          <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.65 }}>{tune.how_to_drive}</p>
        </div>
      </div>

      <div className="text-center pt-4" style={{ borderTop: "1px solid var(--border)" }}>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>{t.tune.diagLink}</p>
        <Link href="/diagnostics" style={{ fontSize: 12, color: "var(--blue-bright)" }}>
          {t.tune.diagLinkText}
        </Link>
      </div>
    </div>
  )
}

/* ── Main Wizard ── */
function WizardInner() {
  const sp = useSearchParams()
  const { lang } = useLanguage()
  const t = useTranslations(lang)

  const TUNE_TYPES = TUNE_TYPE_VALUES.map(({ v, cls }) => ({
    v, cls,
    l: t.tune.tuneTypes[v].l,
    desc: t.tune.tuneTypes[v].desc,
  }))
  const FH6_INTENTS = FH6_INTENT_VALUES.map((v) => ({
    v,
    l: t.tune.intents[v].l,
    desc: t.tune.intents[v].desc,
  }))
  const DIFFICULTY = DIFFICULTY_VALUES.map((v) => ({
    v,
    l: t.tune.difficulty[v].l,
    desc: t.tune.difficulty[v].desc,
  }))
  const STYLES    = STYLE_VALUES.map((v) => ({ v, l: t.tune.styles[v] }))
  const CONTROLS  = CONTROL_VALUES.map((v) => ({ v, l: t.tune.controls[v] }))
  const DRIVETRAINS = DRIVETRAIN_VALUES.map((v) => ({
    v,
    l: t.tune.drivetrains[v as keyof typeof t.tune.drivetrains],
  }))

  const queryCar  = CARS.find((c) => c.id === sp.get("car")) ?? null
  const queryType = TUNE_TYPE_VALUES.find((type) => type.v === sp.get("type"))?.v ?? null
  const [step, setStep]       = useState(() => queryCar ? (queryType ? 3 : 2) : 1)
  const [search, setSearch]   = useState("")
  const [car, setCar]         = useState<Car | null>(() => queryCar)
  const [tuneType, setTT]     = useState<TuneType | null>(() => queryType)
  const [cls, setCls]         = useState<CarClass>(() => queryCar?.base_class ?? "A")
  const [diff, setDiff]       = useState<Difficulty>("balanced")
  const [style, setStyle]     = useState<DrivingStyle>("competitive")
  const [ctrl, setCtrl]       = useState<ControlType>("controller")
  const [dt, setDt]           = useState<TuneRequest["preferred_drivetrain"]>("original")
  const [intent, setIntent]   = useState<TuneIntent>("balanced")
  const [creationMode, setCreationMode] = useState<CreationMode>("generated")
  const [playerDraft, setPlayerDraft] = useState<PlayerTuneDraft | null>(null)
  const [engineSwap, setEngineSwap] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState<GeneratedTune | null>(null)
  const [error, setError]     = useState<string | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const { canGenerate, remainingTunes, incrementTuneUsage, isPro } = useSubscription()

  useEffect(() => {
    if (!car) return
    const minIdx = CLASSES.indexOf(car.base_class)
    const curIdx = CLASSES.indexOf(cls)
    if (curIdx >= minIdx) return
    const id = window.setTimeout(() => setCls(car.base_class), 0)
    return () => window.clearTimeout(id)
  }, [car]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = search.length >= 2
    ? CARS.filter((c) => `${c.brand} ${c.model} ${c.year}`.toLowerCase().includes(search.toLowerCase())).slice(0, 14)
    : CARS.slice(0, 14)

  const effectiveBaseClass: CarClass = car?.base_class ?? "D"
  const availableClasses = CLASSES.filter((_, i) => i >= CLASSES.indexOf(effectiveBaseClass))
  const playerDrivetrain = car ? selectedDrivetrain(car, dt) : "RWD"

  function goToTuneType() {
    if (!car) return
    setStep(2)
  }

  function currentRequest(): TuneRequest | null {
    if (!car || !tuneType) return null
    return {
      car_id: car.id,
      target_class: cls,
      tune_type: tuneType,
      style,
      control: ctrl,
      preferred_drivetrain: dt,
      difficulty: diff,
      engine_swap: engineSwap,
      fh6_intent: intent,
    }
  }

  function startPlayerTune() {
    if (!car) return
    const request = currentRequest()
    if (!request) return
    setPlayerDraft(createPlayerTuneDraft(car, request))
    setStep(4)
  }

  function updatePlayerPart(key: keyof Parts, value: string) {
    setPlayerDraft((current) => current ? {
      ...current,
      parts: { ...current.parts, [key]: value },
    } : current)
  }

  function updatePlayerTuning<K extends keyof TuningSetup>(section: K, patch: Partial<TuningSetup[K]>) {
    setPlayerDraft((current) => current ? {
      ...current,
      tuning: {
        ...current.tuning,
        [section]: { ...(current.tuning[section] as object), ...patch } as TuningSetup[K],
      },
    } : current)
  }

  function updatePlayerNotes(notes: string) {
    setPlayerDraft((current) => current ? { ...current, notes } : current)
  }

  function updatePlayerPi(piEstimate: number) {
    setPlayerDraft((current) => current ? { ...current, piEstimate } : current)
  }

  function createPlayerTune() {
    if (!car || !tuneType || !playerDraft) return
    const drivetrain = selectedDrivetrain(car, dt)
    const carName = `${car.brand} ${car.model}`
    const typeLabel = t.tune.tuneTypes[tuneType].l
    const notes = playerDraft.notes.trim()
    const parts = PART_KEYS.reduce((acc, key) => {
      acc[key] = parsePartsText(playerDraft.parts[key])
      return acc
    }, {} as Parts)

    const tune: GeneratedTune = {
      car,
      target_class: cls,
      tune_type: tuneType,
      fh6_intent: intent,
      drivetrain,
      parts,
      tuning: cleanTuning(playerDraft.tuning, drivetrain),
      summary: notes || t.tune.playerTuneSummary(carName, typeLabel),
      how_to_drive: t.tune.playerTuneHowToDrive,
      strengths: [t.tune.playerTuneStrength],
      weaknesses: [t.tune.playerTuneWeakness],
      warnings: [{ type: "info", message: t.tune.playerTuneWarning }],
      pi_estimate: Math.round(playerDraft.piEstimate),
    }
    setResult(tune)
    setStep(5)
  }

  async function generate() {
    if (!car || !tuneType) return
    if (!canGenerate) { setShowUpgrade(true); return }
    setLoading(true); setError(null)
    try {
      const request: TuneRequest = {
        car_id: car.id,
        target_class: cls,
        tune_type: tuneType,
        style,
        control: ctrl,
        preferred_drivetrain: dt,
        difficulty: diff,
        engine_swap: engineSwap,
        fh6_intent: intent,
      }
      setPlayerDraft(null)
      setResult(generateTune(request, car))
      setStep(5)
      void incrementTuneUsage()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t.tune.generating)
    } finally { setLoading(false) }
  }

  if (step === 5 && result) return <TuneResult
    tune={result}
    onBack={() => { setStep(playerDraft ? 4 : 3); setResult(null) }}
    onReset={() => { setStep(1); setCar(null); setTT(null); setResult(null); setSearch(""); setEngineSwap(false); setIntent("balanced"); setCreationMode("generated"); setPlayerDraft(null); setCls("A") }}
  />

  const steps = [
    { n: 1, l: t.tune.step1 },
    { n: 2, l: t.tune.step2 },
    { n: 3, l: t.tune.step3 },
    ...(creationMode === "player" || step === 4 ? [{ n: 4, l: t.tune.step4 }] : []),
  ]

  return (
    <>
    <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} reason="tune_limit" />
    <div className="dot-grid" style={{ minHeight: "100dvh" }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Title */}
        <div className="anim-up">
          <p className="section-label">{t.tune.sectionLabel}</p>
          <h1 className="page-title">{t.tune.pageTitle}</h1>
        </div>

        {/* Daily usage — free */}
        {!isPro && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg anim-up"
            style={{ background: "var(--bg-card)", border: `1px solid ${remainingTunes === 0 ? "rgba(239,68,68,0.3)" : "var(--border-strong)"}` }}>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {remainingTunes === 0
                ? t.tune.dailyLimit
                : t.tune.remaining}
              {remainingTunes > 0 && (
                <span style={{ color: remainingTunes <= 1 ? "#fbbf24" : "var(--text)", fontWeight: 700 }}>
                  {" "}{remainingTunes}/3
                </span>
              )}
            </p>
            <a href="/pricing" style={{ fontSize: 11, fontWeight: 700, color: "var(--fh6-teal)", textDecoration: "none", whiteSpace: "nowrap" }}>
              {t.tune.proCta}
            </a>
          </div>
        )}

        {/* Steps */}
        <div className="flex items-center gap-1 anim-up" style={{ animationDelay: "60ms" }}>
          {steps.map(({ n, l }, i) => (
            <div key={n} className="flex items-center gap-1">
              <div className="flex items-center gap-2">
                <div className={`step-dot ${step > n ? "done" : step === n ? "active" : "inactive"}`}>
                  {step > n ? (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : n}
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: step === n ? "var(--text)" : "var(--text-muted)",
                  display: "none",
                }} className="sm:block">{l}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`step-line ${step > n ? "done" : "inactive"}`} />
              )}
            </div>
          ))}
        </div>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div className="space-y-4 anim-up" style={{ animationDelay: "100ms" }}>
            <input type="text" className="r-input" placeholder={t.tune.searchPlaceholder}
              value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto" style={{ maxHeight: 460 }}>
              {filtered.map((c) => (
                <CarThumb key={c.id} car={c} selected={car?.id === c.id} onSelect={() => setCar(c)} />
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button type="button" disabled={!car} onClick={goToTuneType} className="r-btn r-btn-primary"
                style={{ paddingLeft: 28, paddingRight: 28, paddingTop: 10, paddingBottom: 10, opacity: car ? 1 : 0.4 }}>
                {t.tune.nextTuneType}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div className="space-y-4 anim-up" style={{ animationDelay: "100ms" }}>
            {car && (
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)" }}>
                <div className="relative w-20 h-12 rounded overflow-hidden shrink-0" style={{ background: "var(--bg-elevated)" }}>
                  {getCarImageUrl(car) && (
                    <Image src={getCarImageUrl(car)} alt="" fill sizes="80px"
                      className="car-render" style={{ objectFit: "contain" }} />
                  )}
                </div>
                <div className="flex-1">
                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{car.brand} · {car.year}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{car.model}</p>
                </div>
                <button type="button" onClick={() => setStep(1)} className="r-btn r-btn-ghost" style={{ fontSize: 11, padding: "5px 10px" }}>
                  {t.tune.swap}
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TUNE_TYPES.map((tt) => {
                const score = car?.meta_score[tt.v === "grip" ? "street" : tt.v] ?? 5
                return (
                  <button key={tt.v} type="button" onClick={() => setTT(tt.v)}
                    className="r-card text-left p-4 space-y-1 transition-all"
                    style={{
                      border: tuneType === tt.v ? "1px solid var(--border-blue)" : undefined,
                      background: tuneType === tt.v ? "var(--blue-dim)" : undefined,
                      cursor: "pointer",
                    }}>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-tag ${tt.cls}`}>{tt.l}</span>
                      <span className="mono-val" style={{ fontSize: 11, color: scoreColor(score) }}>{score}/10</span>
                    </div>
                    <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{tt.desc}</p>
                  </button>
                )
              })}
            </div>
            <div className="flex justify-between pt-2">
              <button type="button" onClick={() => setStep(1)} className="r-btn r-btn-ghost">{t.tune.back}</button>
              <button type="button" disabled={!tuneType} onClick={() => setStep(3)} className="r-btn r-btn-primary"
                style={{ paddingLeft: 28, paddingRight: 28, opacity: tuneType ? 1 : 0.4 }}>
                {t.tune.nextConfig}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <div className="space-y-6 anim-up" style={{ animationDelay: "100ms" }}>

            {/* Creation mode */}
            <div className="space-y-2">
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>{t.tune.creationMode}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {([
                  { v: "generated" as CreationMode, l: t.tune.modeGenerated, d: t.tune.modeGeneratedDesc },
                  { v: "player" as CreationMode, l: t.tune.modePlayer, d: t.tune.modePlayerDesc },
                ]).map((mode) => (
                  <button
                    key={mode.v}
                    type="button"
                    onClick={() => {
                      setCreationMode(mode.v)
                      if (mode.v === "generated") setPlayerDraft(null)
                    }}
                    className="r-card text-left p-4 transition-all"
                    style={{
                      border: creationMode === mode.v ? "1px solid var(--border-blue)" : undefined,
                      background: creationMode === mode.v ? "var(--blue-dim)" : undefined,
                      cursor: "pointer",
                    }}
                  >
                    <p style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{mode.l}</p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{mode.d}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* FH6 intent */}
            <div className="space-y-2">
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>{t.tune.tuneObjective}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                {FH6_INTENTS.map((item) => (
                  <button
                    key={item.v}
                    type="button"
                    onClick={() => setIntent(item.v)}
                    className="r-card text-left p-3 transition-all"
                    style={{
                      border: intent === item.v ? "1px solid var(--border-blue)" : undefined,
                      background: intent === item.v ? "var(--blue-dim)" : undefined,
                      cursor: "pointer",
                    }}
                  >
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{item.l}</p>
                    <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2, lineHeight: 1.45 }}>{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Class */}
            <div className="space-y-2">
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>{t.tune.targetClass}</p>
              <div className="flex gap-2 flex-wrap">
                {availableClasses.map((c) => (
                  <button key={c} type="button" onClick={() => setCls(c)}
                    className={`class-chip${cls === c ? " active" : ""}`} style={{ minWidth: 44 }}>
                    {c}
                  </button>
                ))}
              </div>
              {availableClasses.length < CLASSES.length && (
                <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
                  {t.tune.classNote.replace("{c}", effectiveBaseClass)}
                </p>
              )}
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>{t.tune.behavior}</p>
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTY.map((d) => (
                  <button key={d.v} type="button" onClick={() => setDiff(d.v)}
                    className="r-card text-left p-3 transition-all"
                    style={{
                      border: diff === d.v ? "1px solid var(--border-blue)" : undefined,
                      background: diff === d.v ? "var(--blue-dim)" : undefined,
                      cursor: "pointer",
                    }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{d.l}</p>
                    <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{d.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Style / Control / Drivetrain */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {([
                { label: t.tune.style,    opts: STYLES,      val: style, set: setStyle as (v: string) => void },
                { label: t.tune.control,  opts: CONTROLS,    val: ctrl,  set: setCtrl  as (v: string) => void },
                { label: t.tune.traction2, opts: DRIVETRAINS, val: dt,   set: setDt },
              ] as const).map(({ label, opts, val, set }) => (
                <div key={label} className="space-y-2">
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>{label}</p>
                  <div className="space-y-1">
                    {opts.map((o) => (
                      <button key={o.v} type="button" onClick={() => (set as (value: string) => void)(o.v)}
                        className="w-full r-btn text-left transition-all"
                        style={{
                          justifyContent: "flex-start",
                          fontSize: 12,
                          background: val === o.v ? "var(--blue-dim)" : "var(--bg-card)",
                          border: `1px solid ${val === o.v ? "var(--border-blue)" : "var(--border-strong)"}`,
                          color: val === o.v ? "var(--text)" : "var(--text-muted)",
                          padding: "8px 12px",
                        }}>
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Engine swap */}
            <button
              type="button"
              onClick={() => setEngineSwap((v) => !v)}
              className="w-full r-card text-left p-4 transition-all"
              style={{
                border: engineSwap ? "1px solid var(--border-blue)" : "1px solid var(--border-strong)",
                background: engineSwap ? "var(--blue-dim)" : "var(--bg-card)",
                cursor: "pointer",
              }}
            >
              <div className="flex items-start gap-3">
                <div style={{
                  width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 2,
                  border: `2px solid ${engineSwap ? "var(--blue)" : "var(--border-strong)"}`,
                  background: engineSwap ? "var(--blue)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {engineSwap && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 3 }}>
                    {t.tune.engineSwapTitle}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.55 }}>
                    {t.tune.engineSwapDesc}
                    {engineSwap && car && (
                      <span style={{ color: "var(--blue-bright)", display: "block", marginTop: 4, fontWeight: 600 }}>
                        {t.tune.engineSwapNote}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </button>

            {error && (
              <div className="rounded-lg p-3" style={{ background: "var(--red-dim)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 12, color: "#fca5a5" }}>
                {error}
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button type="button" onClick={() => setStep(2)} className="r-btn r-btn-ghost">{t.tune.back}</button>
              <button type="button" onClick={creationMode === "player" ? startPlayerTune : generate} disabled={loading} className="r-btn r-btn-primary"
                style={{ paddingLeft: 32, paddingRight: 32, paddingTop: 10, paddingBottom: 10, opacity: loading ? 0.7 : 1 }}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 rounded-full animate-spin"
                      style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                    {t.tune.generating}
                  </span>
                ) : creationMode === "player" ? t.tune.nextManualTune : t.tune.generate}
              </button>
            </div>
          </div>
        )}

        {/* â”€â”€ STEP 4 â”€â”€ */}
        {step === 4 && playerDraft && (
          <div className="space-y-5 anim-up" style={{ animationDelay: "100ms" }}>
            {car && (
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)" }}>
                <div className="relative w-20 h-12 rounded overflow-hidden shrink-0" style={{ background: "var(--bg-elevated)" }}>
                  {getCarImageUrl(car) && (
                    <Image src={getCarImageUrl(car)} alt="" fill sizes="80px"
                      className="car-render" style={{ objectFit: "contain" }} />
                  )}
                </div>
                <div className="flex-1">
                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{car.brand} Â· {car.year} Â· {playerDrivetrain}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{car.model}</p>
                </div>
                <span className={`badge-class badge-${cls}`}>{cls}</span>
              </div>
            )}

            <div className="r-card p-4 space-y-4">
              <ManualSectionTitle>{t.tune.manualParts}</ManualSectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PART_KEYS.map((key) => {
                  const label = key === "engine" ? t.tune.partEngine : key === "platform" ? t.tune.partPlatform : key === "drivetrain" ? t.tune.partDrivetrain : key === "tires" ? t.tune.partTires : t.tune.partAero
                  return (
                    <label key={key} className="flex flex-col gap-1">
                      <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
                      <textarea
                        className="r-input"
                        value={playerDraft.parts[key]}
                        onChange={(event) => updatePlayerPart(key, event.target.value)}
                        placeholder={t.tune.manualPartPlaceholder}
                        rows={4}
                        style={{ minHeight: 92, resize: "vertical", fontSize: 12, lineHeight: 1.45 }}
                      />
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="r-card p-4 space-y-1">
              <ManualSectionTitle>{t.tune.manualTuning}</ManualSectionTitle>

              <ManualSectionTitle>{t.tune.tires}</ManualSectionTitle>
              <div className="grid grid-cols-2 gap-2">
                <ManualNumberField label={t.tune.frontPressure} value={playerDraft.tuning.tires.front} onChange={(v) => updatePlayerTuning("tires", { front: v })} min={10} max={60} step={0.1} />
                <ManualNumberField label={t.tune.rearPressure} value={playerDraft.tuning.tires.rear} onChange={(v) => updatePlayerTuning("tires", { rear: v })} min={10} max={60} step={0.1} />
              </div>

              <ManualSectionTitle>{t.tune.gearbox}</ManualSectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <ManualNumberField label={t.tune.finalGear} value={playerDraft.tuning.gearing.final_drive} onChange={(v) => updatePlayerTuning("gearing", { final_drive: v })} min={1} max={7} step={0.01} />
                {GEAR_KEYS.slice(0, 6).map((key, index) => (
                  <ManualNumberField
                    key={key}
                    label={`${index + 1}Âª`}
                    value={playerDraft.tuning.gearing[key] ?? 0}
                    onChange={(v) => updatePlayerTuning("gearing", { [key]: v } as Partial<TuningSetup["gearing"]>)}
                    min={0.1}
                    max={8}
                    step={0.01}
                  />
                ))}
                {GEAR_KEYS.slice(6).map((key, index) => (
                  <ManualOptionalNumberField
                    key={key}
                    label={`${index + 7}Âª`}
                    value={playerDraft.tuning.gearing[key]}
                    onChange={(v) => updatePlayerTuning("gearing", { [key]: v } as Partial<TuningSetup["gearing"]>)}
                    min={0.1}
                    max={8}
                    step={0.01}
                  />
                ))}
              </div>

              <ManualSectionTitle>{t.tune.alignment}</ManualSectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <ManualNumberField label={t.tune.camberFront} value={playerDraft.tuning.alignment.camber_front} onChange={(v) => updatePlayerTuning("alignment", { camber_front: v })} min={-5} max={5} step={0.1} />
                <ManualNumberField label={t.tune.camberRear} value={playerDraft.tuning.alignment.camber_rear} onChange={(v) => updatePlayerTuning("alignment", { camber_rear: v })} min={-5} max={5} step={0.1} />
                <ManualNumberField label={t.tune.toeFront} value={playerDraft.tuning.alignment.toe_front} onChange={(v) => updatePlayerTuning("alignment", { toe_front: v })} min={-5} max={5} step={0.1} />
                <ManualNumberField label={t.tune.toeRear} value={playerDraft.tuning.alignment.toe_rear} onChange={(v) => updatePlayerTuning("alignment", { toe_rear: v })} min={-5} max={5} step={0.1} />
                <ManualNumberField label={t.tune.caster} value={playerDraft.tuning.alignment.caster} onChange={(v) => updatePlayerTuning("alignment", { caster: v })} min={0} max={7} step={0.1} />
              </div>

              <ManualSectionTitle>{t.tune.antirollBars}</ManualSectionTitle>
              <div className="grid grid-cols-2 gap-2">
                <ManualNumberField label={t.tune.front} value={playerDraft.tuning.antiroll_bars.front} onChange={(v) => updatePlayerTuning("antiroll_bars", { front: v })} min={1} max={65} step={0.1} />
                <ManualNumberField label={t.tune.rear} value={playerDraft.tuning.antiroll_bars.rear} onChange={(v) => updatePlayerTuning("antiroll_bars", { rear: v })} min={1} max={65} step={0.1} />
              </div>

              <ManualSectionTitle>{t.tune.springs}</ManualSectionTitle>
              <div className="grid grid-cols-2 gap-2">
                <ManualNumberField label={t.tune.stiffFront} value={playerDraft.tuning.springs.front} onChange={(v) => updatePlayerTuning("springs", { front: v })} min={80} max={1925} step={25} />
                <ManualNumberField label={t.tune.stiffRear} value={playerDraft.tuning.springs.rear} onChange={(v) => updatePlayerTuning("springs", { rear: v })} min={80} max={1925} step={25} />
                <ManualSelectField label={t.tune.heightFront} value={playerDraft.tuning.springs.ride_height_front} options={RIDE_OPTS} labels={t.tune.rideHeight} onChange={(v) => updatePlayerTuning("springs", { ride_height_front: v as RideHeightLevel })} />
                <ManualSelectField label={t.tune.heightRear} value={playerDraft.tuning.springs.ride_height_rear} options={RIDE_OPTS} labels={t.tune.rideHeight} onChange={(v) => updatePlayerTuning("springs", { ride_height_rear: v as RideHeightLevel })} />
              </div>

              <ManualSectionTitle>{t.tune.dampers}</ManualSectionTitle>
              <div className="grid grid-cols-2 gap-2">
                <ManualNumberField label={t.tune.reboundFront} value={playerDraft.tuning.damping.rebound_front} onChange={(v) => updatePlayerTuning("damping", { rebound_front: v })} min={1} max={20} step={0.1} />
                <ManualNumberField label={t.tune.reboundRear} value={playerDraft.tuning.damping.rebound_rear} onChange={(v) => updatePlayerTuning("damping", { rebound_rear: v })} min={1} max={20} step={0.1} />
                <ManualNumberField label={t.tune.bumpFront} value={playerDraft.tuning.damping.bump_front} onChange={(v) => updatePlayerTuning("damping", { bump_front: v })} min={1} max={20} step={0.1} />
                <ManualNumberField label={t.tune.bumpRear} value={playerDraft.tuning.damping.bump_rear} onChange={(v) => updatePlayerTuning("damping", { bump_rear: v })} min={1} max={20} step={0.1} />
              </div>

              <ManualSectionTitle>{t.tune.aero}</ManualSectionTitle>
              <div className="grid grid-cols-2 gap-2">
                <ManualSelectField label={t.tune.downforceFront} value={playerDraft.tuning.aero.front} options={AERO_OPTS} labels={t.tune.aeroLevel} onChange={(v) => updatePlayerTuning("aero", { front: v as AeroLevel })} />
                <ManualSelectField label={t.tune.downforceRear} value={playerDraft.tuning.aero.rear} options={AERO_OPTS} labels={t.tune.aeroLevel} onChange={(v) => updatePlayerTuning("aero", { rear: v as AeroLevel })} />
              </div>

              <ManualSectionTitle>{t.tune.brakes}</ManualSectionTitle>
              <div className="grid grid-cols-2 gap-2">
                <ManualNumberField label={t.tune.brakeBalance} value={playerDraft.tuning.brakes.balance} onChange={(v) => updatePlayerTuning("brakes", { balance: v })} min={0} max={100} step={1} />
                <ManualNumberField label={t.tune.brakePressure} value={playerDraft.tuning.brakes.pressure} onChange={(v) => updatePlayerTuning("brakes", { pressure: v })} min={0} max={200} step={1} />
              </div>

              <ManualSectionTitle>{t.tune.differential}</ManualSectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {playerDrivetrain !== "RWD" && (
                  <>
                    <ManualNumberField label={t.tune.diffFrontAccel} value={playerDraft.tuning.differential.front_accel ?? 100} onChange={(v) => updatePlayerTuning("differential", { front_accel: v })} min={0} max={100} step={1} />
                    <ManualNumberField label={t.tune.diffFrontDecel} value={playerDraft.tuning.differential.front_decel ?? 0} onChange={(v) => updatePlayerTuning("differential", { front_decel: v })} min={0} max={100} step={1} />
                  </>
                )}
                <ManualNumberField label={t.tune.diffRearAccel} value={playerDraft.tuning.differential.rear_accel} onChange={(v) => updatePlayerTuning("differential", { rear_accel: v })} min={0} max={100} step={1} />
                <ManualNumberField label={t.tune.diffRearDecel} value={playerDraft.tuning.differential.rear_decel} onChange={(v) => updatePlayerTuning("differential", { rear_decel: v })} min={0} max={100} step={1} />
                {playerDrivetrain === "AWD" && (
                  <ManualNumberField label={t.tune.diffCenter} value={playerDraft.tuning.differential.center_balance ?? 70} onChange={(v) => updatePlayerTuning("differential", { center_balance: v })} min={0} max={100} step={1} />
                )}
              </div>
            </div>

            <div className="r-card p-4 space-y-3">
              <ManualSectionTitle>{t.tune.manualNotes}</ManualSectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-3">
                <ManualNumberField label={t.tune.manualPiEstimate} value={playerDraft.piEstimate} onChange={updatePlayerPi} min={100} max={999} step={1} />
                <label className="flex flex-col gap-1">
                  <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{t.tune.manualNotes}</span>
                  <textarea
                    className="r-input"
                    value={playerDraft.notes}
                    onChange={(event) => updatePlayerNotes(event.target.value)}
                    placeholder={t.tune.manualNotesPlaceholder}
                    rows={3}
                    style={{ minHeight: 82, resize: "vertical", fontSize: 12, lineHeight: 1.45 }}
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button type="button" onClick={() => setStep(3)} className="r-btn r-btn-ghost">{t.tune.back}</button>
              <button type="button" onClick={createPlayerTune} className="r-btn r-btn-primary"
                style={{ paddingLeft: 32, paddingRight: 32, paddingTop: 10, paddingBottom: 10 }}>
                {t.tune.createManualTune}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  )
}

export default function TunePage() {
  return (
    <RequireAuth>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[60dvh]">
          <div className="w-6 h-6 border-2 rounded-full animate-spin"
            style={{ borderColor: "rgba(37,99,235,0.3)", borderTopColor: "var(--blue)" }} />
        </div>
      }>
        <WizardInner />
      </Suspense>
    </RequireAuth>
  )
}
