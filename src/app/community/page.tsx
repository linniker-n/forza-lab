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
import { useLanguage } from "@/lib/i18n/context"
import { useTranslations } from "@/lib/i18n/translations"
import type { CarClass, Drivetrain, TuneType } from "@/types"

type Tab = "feed" | "destaques" | "buscar"

const TUNE_TYPE_CLS: Record<TuneType, string> = {
  street: "tag-street", drag: "tag-drag", drift: "tag-drift",
  rally: "tag-rally", cross_country: "tag-cross_country", top_speed: "tag-top_speed", grip: "tag-grip",
}
const CLASSES: CarClass[] = ["D","C","B","A","S1","S2","R","X"]
const DRIVETRAINS: Drivetrain[] = ["RWD","AWD","FWD"]

function timeAgo(iso: string, lang: "pt" | "en"): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60)    return lang === "pt" ? "agora" : "now"
  if (diff < 3600)  return `${Math.floor(diff / 60)}min`
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
      display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
    }}>
      {photo ? (
        <Image src={photo} alt={name} fill sizes={`${size}px`} unoptimized style={{ objectFit: "cover" }} />
      ) : (
        <span style={{ fontSize: size * 0.45, fontWeight: 800, color: "var(--blue-bright)" }}>{initial}</span>
      )}
    </div>
  )
}

function TuneCard({ item, userId, onLikeToggle, onDelete, tuneTypeLabels, viewTuneLabel, removeConfirm }: {
  item: CommunityTune
  userId?: string
  onLikeToggle(id: string, liked: boolean, count: number): void
  onDelete(id: string): void
  tuneTypeLabels: Record<TuneType, string>
  viewTuneLabel: string
  removeConfirm: string
}) {
  const [err, setErr] = useState(false)
  const [liking, setLiking] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { lang } = useLanguage()
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
    if (!confirm(removeConfirm)) return
    setDeleting(true)
    try {
      await deleteCommunityTune(item.id)
      onDelete(item.id)
    } catch { setDeleting(false) }
  }

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
            {tuneTypeLabels[item.tuneType]}
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
          <span style={{ fontSize: 9, color: "var(--text-muted)", flexShrink: 0 }}>{timeAgo(item.createdAt, lang)}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto">
          <button
            type="button"
            onClick={handleLike}
            disabled={!userId || liking}
            className="flex items-center gap-1.5 r-btn r-btn-ghost"
            style={{ fontSize: 11, padding: "5px 10px", color: liked ? "#f87171" : "var(--text-muted)" }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill={liked ? "#f87171" : "none"}>
              <path d="M6.5 10.5C6.5 10.5 1.5 7.5 1.5 4.5a2.5 2.5 0 0 1 5-0.01A2.5 2.5 0 0 1 11.5 4.5c0 3-5 6-5 6z"
                stroke={liked ? "#f87171" : "var(--text-muted)"} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {item.likeCount}
          </button>

          <a
            href={`/community/tune?id=${item.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="r-btn r-btn-ghost flex-1"
            style={{ fontSize: 11, padding: "5px 10px", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {viewTuneLabel}
          </a>

          {userId === item.authorId && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="r-btn r-btn-ghost"
              style={{ fontSize: 10, padding: "5px 8px", color: "var(--text-muted)", opacity: deleting ? 0.5 : 1 }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1.5 3h9M4.5 3V1.5h3V3M5 5.5v4M7 5.5v4M2 3l.6 6.5a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9L10 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

export default function CommunityPage() {
  const { user } = useAuth()
  const { lang } = useLanguage()
  const t = useTranslations(lang)
  const [tab, setTab] = useState<Tab>("feed")
  const [tunes, setTunes] = useState<CommunityTune[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [filterType, setFilterType] = useState<TuneType | "all">("all")
  const [filterClass, setFilterClass] = useState<CarClass | "all">("all")
  const [filterDt, setFilterDt] = useState<Drivetrain | "all">("all")
  const [filterText, setFilterText] = useState("")

  const TUNE_TYPE_LABELS: Record<TuneType, string> = t.tune.tuneLabels

  useEffect(() => {
    getCommunityTunes()
      .then(setTunes)
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Error loading"))
      .finally(() => setLoading(false))
  }, [])

  function handleLikeToggle(id: string, liked: boolean, count: number) {
    setTunes((prev) =>
      prev.map((item) =>
        item.id !== id ? item : {
          ...item,
          likeCount: count,
          likedBy: liked
            ? [...item.likedBy, user?.uid ?? ""]
            : item.likedBy.filter((uid) => uid !== user?.uid),
        },
      ),
    )
  }

  function handleDelete(id: string) {
    setTunes((prev) => prev.filter((item) => item.id !== id))
  }

  const sortedByLikes = useMemo(
    () => [...tunes].sort((a, b) => b.likeCount - a.likeCount),
    [tunes],
  )

  const filtered = useMemo(() => {
    const q = filterText.trim().toLowerCase()
    return tunes.filter((item) => {
      if (filterType !== "all" && item.tuneType !== filterType) return false
      if (filterClass !== "all" && item.targetClass !== filterClass) return false
      if (filterDt !== "all" && item.drivetrain !== filterDt) return false
      if (q && !`${item.carBrand} ${item.carModel} ${item.carYear}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [tunes, filterType, filterClass, filterDt, filterText])

  const TAB_LABELS: { v: Tab; l: string }[] = [
    { v: "feed",       l: t.community.tabFeed },
    { v: "destaques",  l: t.community.tabFeatured },
    { v: "buscar",     l: t.community.tabSearch },
  ]

  const displayTunes = tab === "feed" ? tunes : tab === "destaques" ? sortedByLikes : filtered

  return (
    <div className="dot-grid" style={{ minHeight: "100dvh" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Header */}
        <div className="flex items-end justify-between gap-4 flex-wrap anim-up">
          <div>
            <p className="section-label">{t.community.sectionLabel}</p>
            <h1 className="page-title">{t.community.pageTitle}</h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
              {t.community.pageSubtitle}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/tune" className="r-btn r-btn-primary" style={{ fontSize: 12, padding: "9px 16px" }}>
              {t.community.createTune}
            </Link>
            {!user && (
              <Link href="/login" className="r-btn r-btn-ghost" style={{ fontSize: 12, padding: "9px 16px" }}>
                {t.community.loginToLike}
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

        {/* Search filter bar */}
        {tab === "buscar" && (
          <div className="r-card p-4 space-y-4 anim-up">
            <input
              className="r-input"
              placeholder={t.community.searchPlaceholder}
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />

            <div className="space-y-2">
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>{t.community.tuneType}</p>
              <div className="flex gap-1.5 flex-wrap">
                <button type="button" onClick={() => setFilterType("all")} className={`filter-chip${filterType === "all" ? " active" : ""}`}>{t.community.allTypes}</button>
                {(Object.keys(TUNE_TYPE_LABELS) as TuneType[]).map((v) => (
                  <button key={v} type="button" onClick={() => setFilterType(v)} className={`filter-chip${filterType === v ? " active" : ""}`}>
                    {TUNE_TYPE_LABELS[v]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>{t.community.classLabel}</p>
                <div className="flex gap-1.5 flex-wrap">
                  <button type="button" onClick={() => setFilterClass("all")} className={`class-chip${filterClass === "all" ? " active" : ""}`}>{t.community.allClasses}</button>
                  {CLASSES.map((c) => (
                    <button key={c} type="button" onClick={() => setFilterClass(c)} className={`class-chip${filterClass === c ? " active" : ""}`} style={{ minWidth: 36 }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>{t.community.drivetrainLabel}</p>
                <div className="flex gap-1.5 flex-wrap">
                  <button type="button" onClick={() => setFilterDt("all")} className={`filter-chip${filterDt === "all" ? " active" : ""}`}>{t.community.allDrivetrains}</button>
                  {DRIVETRAINS.map((d) => (
                    <button key={d} type="button" onClick={() => setFilterDt(d)} className={`filter-chip${filterDt === d ? " active" : ""}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {t.community.foundLabel(filtered.length)}
            </p>
          </div>
        )}

        {/* Featured header */}
        {tab === "destaques" && (
          <div className="flex items-center gap-3 anim-up">
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--blue-dim)", border: "1px solid var(--border-blue)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1l1.5 4h4l-3.2 2.3 1.2 4L7 9 3.5 11.3l1.2-4L1.5 5h4L7 1z" fill="var(--blue-bright)" opacity="0.8"/>
              </svg>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{t.community.sortedByLikes}</p>
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
              {tab === "buscar" ? t.community.noTunesSearch : t.community.noTunesEmpty}
            </p>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {tab === "buscar" ? t.community.noTunesSearchDesc : t.community.noTunesEmptyDesc}
            </p>
            {tab !== "buscar" && (
              <Link href="/tune" className="r-btn r-btn-primary inline-flex" style={{ fontSize: 12 }}>
                {t.community.beFirst}
              </Link>
            )}
          </div>
        )}

        {/* Grid */}
        {!loading && !loadError && displayTunes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayTunes.map((item) => (
              <TuneCard
                key={item.id}
                item={item}
                userId={user?.uid}
                onLikeToggle={handleLikeToggle}
                onDelete={handleDelete}
                tuneTypeLabels={TUNE_TYPE_LABELS}
                viewTuneLabel={t.community.viewTune}
                removeConfirm={t.community.removeConfirm}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
