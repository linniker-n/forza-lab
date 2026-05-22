"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { getCarImageUrl } from "@/data/cars"
import {
  type CommunityTune,
  deleteCommunityTune,
  getCommunityTunes,
  toggleLike,
} from "@/lib/firebase/community"
import type { CarClass, Drivetrain, TuneType } from "@/types"

type Tab = "feed" | "destaques" | "buscar"

const TUNE_TYPE_LABELS: Record<TuneType, string> = {
  street: "Rua", drag: "Drag", drift: "Drift",
  rally: "Rally", cross_country: "Cross Country", top_speed: "Top Speed", grip: "Grip",
}
const TUNE_TYPE_CLS: Record<TuneType, string> = {
  street: "tag-street", drag: "tag-drag", drift: "tag-drift",
  rally: "tag-rally", cross_country: "tag-cross_country", top_speed: "tag-top_speed", grip: "tag-grip",
}
const CLASSES: CarClass[] = ["D","C","B","A","S1","S2","R","X"]
const DRIVETRAINS: Drivetrain[] = ["RWD","AWD","FWD"]

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60)  return "agora"
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d`
  return `${Math.floor(diff / 2592000)}m`
}

function Avatar({ name, photo, size = 28 }: { name: string; photo?: string; size?: number }) {
  const initial = (name || "?")[0].toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
      background: "var(--blue-dim)", border: "1px solid var(--border-blue)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {photo ? (
        <img src={photo} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span style={{ fontSize: size * 0.45, fontWeight: 800, color: "var(--blue-bright)" }}>{initial}</span>
      )}
    </div>
  )
}

function rideHeightLabel(v: string) {
  const map: Record<string, string> = { low: "Baixa", "medium-low": "Méd-baixa", medium: "Média", "medium-high": "Méd-alta", high: "Alta", max: "Máxima" }
  return map[v] ?? v
}
function aeroLabel(v: string) {
  const map: Record<string, string> = { min: "Mín", low: "Baixo", medium: "Médio", "medium-high": "Méd-alto", high: "Alto", max: "Máximo" }
  return map[v] ?? v
}

function TRow({ l, v }: { l: string; v: string }) {
  return (
    <div className="telem-row">
      <span className="telem-label">{l}</span>
      <span className="telem-value">{v}</span>
    </div>
  )
}

function TuneCard({ item, userId, onLikeToggle, onDelete }: {
  item: CommunityTune
  userId?: string
  onLikeToggle(id: string, liked: boolean, count: number): void
  onDelete(id: string): void
}) {
  const [err, setErr] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [liking, setLiking] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const url = getCarImageUrl(item.tune.car)
  const liked = !!userId && item.likedBy.includes(userId)

  async function handleLike() {
    if (!userId) return
    setLiking(true)
    try {
      const result = await toggleLike(item.id, userId)
      onLikeToggle(item.id, result.liked, result.likeCount)
    } catch {}
    finally { setLiking(false) }
  }

  async function handleDelete() {
    if (!confirm("Remover esta tune da comunidade?")) return
    setDeleting(true)
    try {
      await deleteCommunityTune(item.id)
      onDelete(item.id)
    } catch { setDeleting(false) }
  }

  const t = item.tune.tuning

  return (
    <article className="r-card bracket flex flex-col anim-up" style={{ fontSize: 12 }}>
      {/* Image strip */}
      <div className="relative overflow-hidden rounded-t-[9px]" style={{ height: 110, background: "var(--bg-surface)" }}>
        {url && !err ? (
          <Image src={url} alt={`${item.carBrand} ${item.carModel}`} fill sizes="(max-width:768px) 100vw, 50vw"
            className="car-render" style={{ objectFit: "contain", padding: 10 }}
            onError={() => setErr(true)} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="mono-val" style={{ fontSize: 11, color: "var(--text-muted)", opacity: 0.5 }}>
              {item.carBrand.slice(0, 6).toUpperCase()}
            </span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-10 pointer-events-none"
          style={{ background: "linear-gradient(to top, var(--bg-card), transparent)" }} />
        <span className={`badge-class badge-${item.targetClass} absolute top-2 left-2`} style={{ fontSize: 9 }}>
          {item.targetClass}
        </span>
        <span className={`badge-class ${item.drivetrain === "AWD" ? "badge-awd" : item.drivetrain === "RWD" ? "badge-rwd" : "badge-fwd"} absolute top-2 right-2`} style={{ fontSize: 9 }}>
          {item.drivetrain}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Car + type */}
        <div>
          <p style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {item.carBrand} · {item.carYear}
          </p>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", marginTop: 1, lineHeight: 1.2 }}>
            {item.carModel}
          </h3>
          <span className={`inline-tag ${TUNE_TYPE_CLS[item.tuneType]} mt-1.5`} style={{ fontSize: 9 }}>
            {TUNE_TYPE_LABELS[item.tuneType]}
          </span>
        </div>

        {/* Author + date */}
        <div className="flex items-center gap-2">
          <Avatar name={item.authorName} photo={item.authorPhotoBase64} size={24} />
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.authorName}
            </p>
          </div>
          <span style={{ fontSize: 9, color: "var(--text-muted)", flexShrink: 0 }}>{timeAgo(item.createdAt)}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto">
          <button
            type="button"
            onClick={handleLike}
            disabled={!userId || liking}
            className="flex items-center gap-1.5 r-btn r-btn-ghost"
            style={{ fontSize: 11, padding: "5px 10px", color: liked ? "#f87171" : "var(--text-muted)" }}
            title={userId ? undefined : "Faça login para curtir"}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill={liked ? "#f87171" : "none"}>
              <path d="M6.5 10.5C6.5 10.5 1.5 7.5 1.5 4.5a2.5 2.5 0 0 1 5-0.01A2.5 2.5 0 0 1 11.5 4.5c0 3-5 6-5 6z"
                stroke={liked ? "#f87171" : "var(--text-muted)"} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {item.likeCount}
          </button>

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="r-btn r-btn-ghost flex-1"
            style={{ fontSize: 11, padding: "5px 10px" }}
          >
            {expanded ? "Fechar ↑" : "Ver tune ↓"}
          </button>

          {userId === item.authorId && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="r-btn r-btn-ghost"
              style={{ fontSize: 10, padding: "5px 8px", color: "var(--text-muted)", opacity: deleting ? 0.5 : 1 }}
              title="Remover da comunidade"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1.5 3h9M4.5 3V1.5h3V3M5 5.5v4M7 5.5v4M2 3l.6 6.5a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9L10 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>

        {/* Expanded tune details */}
        {expanded && (
          <div className="space-y-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
            {item.tune.summary && (
              <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.55 }}>{item.tune.summary}</p>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg p-3 space-y-1" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Pneus</p>
                <TRow l="Dianteiro" v={`${t.tires.front.toFixed(1)} psi`} />
                <TRow l="Traseiro"  v={`${t.tires.rear.toFixed(1)} psi`} />
              </div>
              <div className="rounded-lg p-3 space-y-1" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Alinhamento</p>
                <TRow l="Camb. D" v={`${t.alignment.camber_front}°`} />
                <TRow l="Camb. T" v={`${t.alignment.camber_rear}°`} />
                <TRow l="Caster"  v={`${t.alignment.caster}°`} />
              </div>
              <div className="rounded-lg p-3 space-y-1" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Barras</p>
                <TRow l="Dianteira" v={String(t.antiroll_bars.front)} />
                <TRow l="Traseira"  v={String(t.antiroll_bars.rear)} />
              </div>
              <div className="rounded-lg p-3 space-y-1" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Molas</p>
                <TRow l="Diant." v={`${(t.springs.front * 0.175127).toFixed(1)} kgf`} />
                <TRow l="Tras."  v={`${(t.springs.rear  * 0.175127).toFixed(1)} kgf`} />
                <TRow l="Alt. D" v={rideHeightLabel(t.springs.ride_height_front)} />
                <TRow l="Alt. T" v={rideHeightLabel(t.springs.ride_height_rear)} />
              </div>
              <div className="rounded-lg p-3 space-y-1" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Amortecedores</p>
                <TRow l="Ret. D" v={String(t.damping.rebound_front)} />
                <TRow l="Ret. T" v={String(t.damping.rebound_rear)} />
                <TRow l="Comp D" v={String(t.damping.bump_front)} />
                <TRow l="Comp T" v={String(t.damping.bump_rear)} />
              </div>
              <div className="rounded-lg p-3 space-y-1" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Diferencial</p>
                {t.differential.front_accel !== undefined && <TRow l="Front Ac." v={`${t.differential.front_accel}%`} />}
                <TRow l="Rear Ac."  v={`${t.differential.rear_accel}%`} />
                <TRow l="Rear De."  v={`${t.differential.rear_decel}%`} />
                {t.differential.center_balance !== undefined && <TRow l="Centro" v={`${t.differential.center_balance}%`} />}
              </div>
            </div>

            <div className="rounded-lg p-3 space-y-1" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Aerodinâmica · Freios</p>
              <div className="grid grid-cols-2 gap-x-4">
                <TRow l="Aero D"  v={aeroLabel(t.aero.front)} />
                <TRow l="Freio %"  v={`${t.brakes.balance}%`} />
                <TRow l="Aero T"  v={aeroLabel(t.aero.rear)} />
                <TRow l="Pressão" v={`${t.brakes.pressure}%`} />
              </div>
            </div>

            <Link href={`/tune?car=${item.carId}`} className="r-btn r-btn-ghost w-full" style={{ fontSize: 11, justifyContent: "center" }}>
              Criar tune para este carro →
            </Link>
          </div>
        )}
      </div>
    </article>
  )
}

export default function CommunityPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>("feed")
  const [tunes, setTunes] = useState<CommunityTune[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Buscar filters
  const [filterType, setFilterType] = useState<TuneType | "all">("all")
  const [filterClass, setFilterClass] = useState<CarClass | "all">("all")
  const [filterDt, setFilterDt] = useState<Drivetrain | "all">("all")
  const [filterText, setFilterText] = useState("")

  useEffect(() => {
    getCommunityTunes()
      .then(setTunes)
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Erro ao carregar"))
      .finally(() => setLoading(false))
  }, [])

  function handleLikeToggle(id: string, liked: boolean, count: number) {
    setTunes((prev) =>
      prev.map((t) =>
        t.id !== id ? t : {
          ...t,
          likeCount: count,
          likedBy: liked
            ? [...t.likedBy, user?.uid ?? ""]
            : t.likedBy.filter((uid) => uid !== user?.uid),
        },
      ),
    )
  }

  function handleDelete(id: string) {
    setTunes((prev) => prev.filter((t) => t.id !== id))
  }

  const sortedByLikes = useMemo(
    () => [...tunes].sort((a, b) => b.likeCount - a.likeCount),
    [tunes],
  )

  const filtered = useMemo(() => {
    const q = filterText.trim().toLowerCase()
    return tunes.filter((t) => {
      if (filterType !== "all" && t.tuneType !== filterType) return false
      if (filterClass !== "all" && t.targetClass !== filterClass) return false
      if (filterDt !== "all" && t.drivetrain !== filterDt) return false
      if (q && !`${t.carBrand} ${t.carModel} ${t.carYear}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [tunes, filterType, filterClass, filterDt, filterText])

  const TAB_LABELS: { v: Tab; l: string }[] = [
    { v: "feed",       l: "Feed" },
    { v: "destaques",  l: "Destaques" },
    { v: "buscar",     l: "Buscar" },
  ]

  const displayTunes = tab === "feed" ? tunes : tab === "destaques" ? sortedByLikes : filtered

  return (
    <div className="dot-grid" style={{ minHeight: "100dvh" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Header */}
        <div className="flex items-end justify-between gap-4 flex-wrap anim-up">
          <div>
            <p className="section-label">Social</p>
            <h1 className="page-title">Comunidade</h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
              Tunes compartilhadas por jogadores · Curta, explore e compare.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/tune" className="r-btn r-btn-primary" style={{ fontSize: 12, padding: "9px 16px" }}>
              Criar tune →
            </Link>
            {!user && (
              <Link href="/login" className="r-btn r-btn-ghost" style={{ fontSize: 12, padding: "9px 16px" }}>
                Entrar para curtir
              </Link>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-lg anim-up" style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", width: "fit-content" }}>
          {TAB_LABELS.map(({ v, l }) => (
            <button
              key={v}
              type="button"
              onClick={() => setTab(v)}
              style={{
                fontSize: 13, fontWeight: tab === v ? 700 : 500,
                padding: "7px 20px", borderRadius: 7, border: "none", cursor: "pointer",
                background: tab === v ? "var(--blue)" : "transparent",
                color: tab === v ? "#fff" : "var(--text-muted)",
                transition: "all 0.15s",
              }}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Buscar: filter bar */}
        {tab === "buscar" && (
          <div className="r-card p-4 space-y-4 anim-up">
            <input
              className="r-input"
              placeholder="Buscar por marca, modelo ou ano..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />

            <div className="space-y-2">
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>Tipo de tune</p>
              <div className="flex gap-1.5 flex-wrap">
                <button type="button" onClick={() => setFilterType("all")} className={`filter-chip${filterType === "all" ? " active" : ""}`}>Todos</button>
                {(Object.keys(TUNE_TYPE_LABELS) as TuneType[]).map((v) => (
                  <button key={v} type="button" onClick={() => setFilterType(v)} className={`filter-chip${filterType === v ? " active" : ""}`}>
                    {TUNE_TYPE_LABELS[v]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>Classe</p>
                <div className="flex gap-1.5 flex-wrap">
                  <button type="button" onClick={() => setFilterClass("all")} className={`class-chip${filterClass === "all" ? " active" : ""}`}>Todas</button>
                  {CLASSES.map((c) => (
                    <button key={c} type="button" onClick={() => setFilterClass(c)} className={`class-chip${filterClass === c ? " active" : ""}`} style={{ minWidth: 36 }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>Tração</p>
                <div className="flex gap-1.5 flex-wrap">
                  <button type="button" onClick={() => setFilterDt("all")} className={`filter-chip${filterDt === "all" ? " active" : ""}`}>Todas</button>
                  {DRIVETRAINS.map((d) => (
                    <button key={d} type="button" onClick={() => setFilterDt(d)} className={`filter-chip${filterDt === d ? " active" : ""}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {filtered.length} tune{filtered.length !== 1 ? "s" : ""} encontrada{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* Destaques header */}
        {tab === "destaques" && (
          <div className="flex items-center gap-3 anim-up">
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--blue-dim)", border: "1px solid var(--border-blue)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1l1.5 4h4l-3.2 2.3 1.2 4L7 9 3.5 11.3l1.2-4L1.5 5h4L7 1z" fill="var(--blue-bright)" opacity="0.8"/>
              </svg>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Ordenado por curtidas · todas as tunes</p>
          </div>
        )}

        {/* Loading / Error / Empty */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 rounded-full animate-spin"
              style={{ borderColor: "rgba(37,99,235,0.2)", borderTopColor: "var(--blue)" }} />
          </div>
        )}
        {!loading && loadError && (
          <div className="r-card p-6 text-center">
            <p style={{ fontSize: 13, color: "#fca5a5" }}>{loadError}</p>
          </div>
        )}
        {!loading && !loadError && displayTunes.length === 0 && (
          <div className="r-card bracket p-10 text-center space-y-4">
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
              {tab === "buscar" ? "Nenhuma tune encontrada" : "Ainda não há tunes aqui"}
            </p>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {tab === "buscar" ? "Tente outros filtros." : "Seja o primeiro a compartilhar uma tune!"}
            </p>
            {tab !== "buscar" && (
              <Link href="/tune" className="r-btn r-btn-primary inline-flex" style={{ fontSize: 12 }}>
                Criar tune →
              </Link>
            )}
          </div>
        )}

        {/* Grid */}
        {!loading && !loadError && displayTunes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayTunes.map((item, i) => (
              <TuneCard
                key={item.id}
                item={item}
                userId={user?.uid}
                onLikeToggle={handleLikeToggle}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
