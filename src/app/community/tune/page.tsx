"use client"

import Image from "next/image"
import Link from "next/link"
import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { useAuth } from "@/components/auth/AuthProvider"
import { getCarImageUrl } from "@/data/cars"
import { getFirebaseDb } from "@/lib/firebase/client"
import { toggleLike, type CommunityTune } from "@/lib/firebase/community"
import { translateParts } from "@/lib/settings/translations"
import { useSettings } from "@/lib/settings/context"
import { formatPressure, formatSpring } from "@/lib/settings/units"

function aeroLabel(v: string) {
  const m: Record<string, string> = { min: "Mínimo", low: "Baixo", medium: "Médio", "medium-high": "Médio-alto", high: "Alto", max: "Máximo" }
  return m[v] ?? v
}
function rideLabel(v: string) {
  const m: Record<string, string> = { low: "Baixa", "medium-low": "Méd-baixa", medium: "Média", "medium-high": "Méd-alta", high: "Alta", max: "Máxima" }
  return m[v] ?? v
}

function TR({ l, v }: { l: string; v: string }) {
  return (
    <div className="telem-row">
      <span className="telem-label">{l}</span>
      <span className="telem-value">{v}</span>
    </div>
  )
}

function Avatar({ name, photo, size = 36 }: { name: string; photo?: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
      background: "var(--blue-dim)", border: "1px solid var(--border-blue)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {photo
        ? <img src={photo} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <span style={{ fontSize: size * 0.4, fontWeight: 800, color: "var(--blue-bright)" }}>{(name || "?")[0].toUpperCase()}</span>
      }
    </div>
  )
}

const TUNE_LABELS: Record<string, string> = {
  street: "Rua", drag: "Drag", drift: "Drift",
  rally: "Rally", cross_country: "Cross Country", top_speed: "Top Speed", grip: "Grip",
}

function toIso(ts: unknown): string {
  if (ts && typeof ts === "object" && "toDate" in ts) return (ts as { toDate(): Date }).toDate().toISOString()
  return new Date().toISOString()
}

function TuneDetailInner() {
  const sp = useSearchParams()
  const tuneId = sp.get("id") ?? ""
  const { user } = useAuth()
  const { settings } = useSettings()
  const [tune, setTune] = useState<CommunityTune | null>(null)
  const [loading, setLoading] = useState(true)
  const [liking, setLiking] = useState(false)
  const [imgErr, setImgErr] = useState(false)

  useEffect(() => {
    if (!tuneId) { setLoading(false); return }
    const db = getFirebaseDb()
    if (!db) { setLoading(false); return }
    getDoc(doc(db, "communityTunes", tuneId))
      .then((snap) => {
        if (!snap.exists()) { setLoading(false); return }
        const d = snap.data()
        setTune({
          id: snap.id,
          tune: d.tune,
          authorId: d.authorId ?? "",
          authorName: d.authorName ?? "Anônimo",
          authorPhotoBase64: d.authorPhotoBase64,
          tuneType: d.tuneType,
          carId: d.carId,
          carBrand: d.carBrand,
          carModel: d.carModel,
          carYear: d.carYear,
          targetClass: d.targetClass,
          drivetrain: d.drivetrain,
          likeCount: d.likeCount ?? 0,
          likedBy: d.likedBy ?? [],
          createdAt: toIso(d.createdAt),
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tuneId])

  async function handleLike() {
    if (!user || !tune) return
    setLiking(true)
    try {
      const result = await toggleLike(tune.id, user.uid)
      setTune((prev) => prev ? {
        ...prev,
        likeCount: result.likeCount,
        likedBy: result.liked ? [...prev.likedBy, user.uid] : prev.likedBy.filter(id => id !== user.uid),
      } : prev)
    } catch {}
    finally { setLiking(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60dvh]">
      <div className="w-8 h-8 border-2 rounded-full animate-spin"
        style={{ borderColor: "rgba(37,99,235,0.2)", borderTopColor: "var(--blue)" }} />
    </div>
  )

  if (!tune) return (
    <div className="dot-grid flex items-center justify-center min-h-[60dvh]">
      <div className="r-card bracket p-10 text-center space-y-4">
        <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Tune não encontrada</p>
        <Link href="/community" className="r-btn r-btn-primary inline-flex" style={{ fontSize: 12 }}>← Voltar à comunidade</Link>
      </div>
    </div>
  )

  const t = tune.tune.tuning
  const url = getCarImageUrl(tune.tune.car)
  const liked = !!user && tune.likedBy.includes(user.uid)
  const pUnit = settings.pressureUnit
  const spUnit = settings.springUnit

  return (
    <div className="dot-grid" style={{ minHeight: "100dvh" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6 anim-up">

        {/* Hero card */}
        <div className="r-card bracket overflow-hidden">
          <div className="relative overflow-hidden" style={{ height: 220, background: "linear-gradient(135deg, #080f20 0%, #0c1530 100%)" }}>
            {url && !imgErr && (
              <Image src={url} alt={`${tune.carBrand} ${tune.carModel}`} fill sizes="896px"
                className="hero-car-render" style={{ objectFit: "contain", padding: 28 }}
                onError={() => setImgErr(true)} />
            )}
            <div className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
              style={{ background: "linear-gradient(to top, var(--bg-card), transparent)" }} />
          </div>

          <div className="p-5 space-y-4">
            {/* Car info + badges */}
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <p style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {tune.carBrand} · {tune.carYear}
                </p>
                <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.03em", color: "var(--text)" }}>
                  {tune.carModel}
                </h1>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <span className={`badge-class badge-${tune.targetClass}`}>{tune.targetClass}</span>
                  <span className={`badge-class badge-${tune.drivetrain === "AWD" ? "awd" : tune.drivetrain === "RWD" ? "rwd" : "fwd"}`}>{tune.drivetrain}</span>
                  <span className="badge-class" style={{ color: "var(--blue-bright)", background: "var(--blue-dim)", borderColor: "var(--border-blue)" }}>
                    {TUNE_LABELS[tune.tuneType] ?? tune.tuneType}
                  </span>
                </div>
              </div>

              {/* Like */}
              <button
                type="button"
                onClick={handleLike}
                disabled={!user || liking}
                className="r-btn r-btn-ghost flex items-center gap-2"
                style={{ color: liked ? "#f87171" : "var(--text-muted)", fontSize: 13 }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill={liked ? "#f87171" : "none"}>
                  <path d="M9 14.5C9 14.5 2 10.5 2 6a3.5 3.5 0 0 1 7 0 3.5 3.5 0 0 1 7 0c0 4.5-7 8.5-7 8.5z"
                    stroke={liked ? "#f87171" : "currentColor"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {tune.likeCount}
              </button>
            </div>

            {/* Author */}
            <div className="flex items-center gap-3 py-3" style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
              <Avatar name={tune.authorName} photo={tune.authorPhotoBase64} size={40} />
              <div>
                <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Criado por</p>
                <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>{tune.authorName}</p>
              </div>
              <p style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)" }}>
                {new Date(tune.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </div>

            {/* Summary */}
            {tune.tune.summary && (
              <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.65 }}>{tune.tune.summary}</p>
            )}
          </div>
        </div>

        {/* Peças */}
        {tune.tune.parts && (
          <div className="r-card p-5 space-y-4">
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>Peças</p>
            {(["engine","platform","drivetrain","tires","aero"] as const).map((cat) => {
              const items = (tune.tune.parts[cat] ?? []) as string[]
              if (!items.length) return null
              const label = cat === "engine" ? "Motor" : cat === "platform" ? "Plataforma" : cat === "drivetrain" ? "Transmissão" : cat === "tires" ? "Pneus" : "Aero"
              return (
                <div key={cat}>
                  <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-subtle)", marginBottom: 6 }}>{label}</p>
                  <ul className="space-y-1">
                    {translateParts(items, "ptbr").map((part, j) => (
                      <li key={j} className="flex items-center gap-2" style={{ fontSize: 12, color: "var(--text)" }}>
                        <span className="w-1 h-1 rounded-full shrink-0" style={{ background: "var(--blue)" }} />
                        {part}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        )}

        {/* Pneus + Câmbio */}
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4 items-start">
          <div className="r-card p-5" style={{ minWidth: 210 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Pneus</p>
            <TR l="Pressão dianteira" v={formatPressure(t.tires.front, pUnit)} />
            <TR l="Pressão traseira"  v={formatPressure(t.tires.rear,  pUnit)} />
          </div>
          <div className="r-card p-5">
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 }}>Câmbio</p>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {[
                { l: "Final", v: t.gearing.final_drive },
                ...([1,2,3,4,5,6,7,8,9,10] as const).map((g) => ({
                  l: `${g}ª`, v: t.gearing[`gear_${g}` as keyof typeof t.gearing] as number | undefined,
                })).filter((x) => x.v !== undefined),
              ].map(({ l, v }) => (
                <div key={l} className="flex flex-col items-center gap-1 p-2 rounded"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 600 }}>{l}</span>
                  <span className="mono-val" style={{ fontSize: 13 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alinhamento + Barras */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="r-card p-5">
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Alinhamento</p>
            <TR l="Cambagem dianteira"     v={`${t.alignment.camber_front}°`} />
            <TR l="Cambagem traseira"      v={`${t.alignment.camber_rear}°`} />
            <TR l="Convergência dianteira" v={`${t.alignment.toe_front}°`} />
            <TR l="Convergência traseira"  v={`${t.alignment.toe_rear}°`} />
            <TR l="Caster"                 v={`${t.alignment.caster}°`} />
          </div>
          <div className="r-card p-5">
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Barras Estabilizadoras</p>
            <TR l="Dianteira" v={String(t.antiroll_bars.front)} />
            <TR l="Traseira"  v={String(t.antiroll_bars.rear)} />
          </div>
        </div>

        {/* Molas + Amortecedores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="r-card p-5">
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Molas</p>
            <TR l="Rigidez dianteira" v={formatSpring(t.springs.front, spUnit)} />
            <TR l="Rigidez traseira"  v={formatSpring(t.springs.rear,  spUnit)} />
            <TR l="Altura dianteira"  v={rideLabel(t.springs.ride_height_front)} />
            <TR l="Altura traseira"   v={rideLabel(t.springs.ride_height_rear)} />
          </div>
          <div className="r-card p-5">
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Amortecedores</p>
            <TR l="Retorno dianteiro"    v={String(t.damping.rebound_front)} />
            <TR l="Retorno traseiro"     v={String(t.damping.rebound_rear)} />
            <TR l="Compressão dianteira" v={String(t.damping.bump_front)} />
            <TR l="Compressão traseira"  v={String(t.damping.bump_rear)} />
          </div>
        </div>

        {/* Aero + Freios */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="r-card p-5">
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Aerodinâmica</p>
            <TR l="Downforce dianteiro" v={aeroLabel(t.aero.front)} />
            <TR l="Downforce traseiro"  v={aeroLabel(t.aero.rear)} />
          </div>
          <div className="r-card p-5">
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Freios</p>
            <TR l="Equilíbrio de frenagem" v={`${t.brakes.balance}%`} />
            <TR l="Pressão de frenagem"    v={`${t.brakes.pressure}%`} />
          </div>
        </div>

        {/* Diferencial */}
        <div className="r-card p-5">
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>Diferencial</p>
          {t.differential.front_accel !== undefined && <TR l="Dianteiro, aceleração"    v={`${t.differential.front_accel}%`} />}
          {t.differential.front_decel !== undefined && <TR l="Dianteiro, desaceleração" v={`${t.differential.front_decel}%`} />}
          <TR l="Traseiro, aceleração"    v={`${t.differential.rear_accel}%`} />
          <TR l="Traseiro, desaceleração" v={`${t.differential.rear_decel}%`} />
          {t.differential.center_balance !== undefined && <TR l="Centro" v={`${t.differential.center_balance}%`} />}
        </div>

        {/* CTAs */}
        <div className="flex gap-3 flex-wrap">
          <Link href={`/tune?car=${tune.carId}`} className="r-btn r-btn-primary" style={{ fontSize: 12 }}>
            Criar minha tune para este carro →
          </Link>
          <Link href="/community" className="r-btn r-btn-ghost" style={{ fontSize: 12 }}>
            ← Voltar à comunidade
          </Link>
        </div>

      </div>
    </div>
  )
}

export default function TuneDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60dvh]">
        <div className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: "rgba(37,99,235,0.2)", borderTopColor: "var(--blue)" }} />
      </div>
    }>
      <TuneDetailInner />
    </Suspense>
  )
}
