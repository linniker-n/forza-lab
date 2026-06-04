"use client"

import Image from "next/image"
import { useMemo, useState, useCallback } from "react"
import { CARS } from "@/data/cars"
import { COMMUNITY_TUNES, TOP_RALLY_BENCHMARKS, type SpreadsheetTune, type TuneClass, type TuneTag } from "@/data/community-tunes"

// ── Car image lookup ─────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ω/g, "")
    .replace(/\bef\b|\bwtac\b|\bpbv\b|\bc\b(?=\s|$)/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function findCarImage(carName: string): string {
  const needle = normalize(carName)
  let best: { score: number; url: string } = { score: 0, url: "" }

  for (const car of CARS) {
    const haystack = normalize(`${car.brand} ${car.model} ${car.year}`)
    const words = needle.split(" ").filter(Boolean)
    const matches = words.filter((w) => haystack.includes(w)).length
    const score = matches / words.length
    if (score > best.score) {
      const url = car.image_url
        ? car.image_url.replace(/\?cb=\d+$/, "")
        : car.imagin_make && car.imagin_model
          ? `https://cdn.imagin.studio/getimage?customer=img&make=${encodeURIComponent(car.imagin_make)}&modelFamily=${encodeURIComponent(car.imagin_model)}&modelYear=${car.year}&zoomType=fullscreen&angle=01`
          : ""
      if (url) best = { score, url }
    }
  }

  return best.score >= 0.5 ? best.url : ""
}

// ── Constants ────────────────────────────────────────────────────────────────

const CLASSES: TuneClass[] = ["C", "B", "A", "S1", "S2", "R"]

const TAG_META: Record<TuneTag, { label: string; color: string; bg: string; border: string }> = {
  pista:    { label: "Pista",    color: "#2ccecc", bg: "rgba(44,206,204,0.10)",  border: "rgba(44,206,204,0.30)" },
  sprint:   { label: "Sprint",   color: "#d4278a", bg: "rgba(212,39,138,0.10)",  border: "rgba(212,39,138,0.30)" },
  circuito: { label: "Circuito", color: "#818cf8", bg: "rgba(129,140,248,0.10)", border: "rgba(129,140,248,0.30)" },
  rally:    { label: "Rally",    color: "#f59e0b", bg: "rgba(245,158,11,0.10)",  border: "rgba(245,158,11,0.30)" },
  cross:    { label: "Cross",    color: "#10b981", bg: "rgba(16,185,129,0.10)",  border: "rgba(16,185,129,0.30)" },
  allround: { label: "Allround", color: "#94a3b8", bg: "rgba(148,163,184,0.10)", border: "rgba(148,163,184,0.30)" },
}

const ALL_TAGS: TuneTag[] = ["pista", "sprint", "circuito", "rally", "cross", "allround"]

const CLASS_COUNT = CLASSES.reduce<Record<string, number>>((acc, cls) => {
  acc[cls] = COMMUNITY_TUNES.filter((t) => t.class === cls).length
  return acc
}, {})

// ── Sub-components ───────────────────────────────────────────────────────────

function TagPill({ tag, active, onClick }: { tag: TuneTag; active?: boolean; onClick?: () => void }) {
  const m = TAG_META[tag]
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: 10,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 20,
        border: `1px solid ${active ? m.color : m.border}`,
        background: active ? m.bg : "transparent",
        color: m.color,
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.15s ease",
        whiteSpace: "nowrap",
      }}
    >
      {m.label}
    </button>
  )
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }, [code])

  return (
    <button
      onClick={handleCopy}
      title="Copiar código da tunagem"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 10,
        fontWeight: 700,
        padding: "3px 8px",
        borderRadius: 5,
        border: copied ? "1px solid rgba(16,185,129,0.5)" : "1px solid var(--border-blue)",
        background: copied ? "rgba(16,185,129,0.12)" : "var(--blue-dim)",
        color: copied ? "#10b981" : "var(--blue-bright)",
        cursor: "pointer",
        transition: "all 0.2s ease",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {copied ? (
        <>
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Copiado
        </>
      ) : (
        <>
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <rect x="3" y="1" width="5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M6 1V2.5H1V7.5H3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          {code}
        </>
      )}
    </button>
  )
}

function TuneCard({ tune, delay }: { tune: SpreadsheetTune; delay: number }) {
  const imgUrl = useMemo(() => findCarImage(tune.car), [tune.car])

  return (
    <article
      className="r-card bracket flex flex-col anim-up"
      style={{ animationDelay: `${delay}ms`, overflow: "hidden" }}
    >
      {/* Car image */}
      <div style={{ height: 110, background: "var(--bg-surface)", position: "relative", overflow: "hidden", flexShrink: 0 }}>
        {imgUrl ? (
          <Image
            src={imgUrl}
            alt={tune.car}
            fill
            className="car-render"
            style={{ objectFit: "cover", objectPosition: "center 60%" }}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" opacity={0.18}>
              <path d="M4 24l6-8h16l6 8H4z" stroke="#2ccecc" strokeWidth="1.5"/>
              <path d="M8 24v4h4v-4M24 24v4h4v-4" stroke="#2ccecc" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="11" cy="26" r="2" stroke="#2ccecc" strokeWidth="1.2"/>
              <circle cx="25" cy="26" r="2" stroke="#2ccecc" strokeWidth="1.2"/>
              <path d="M10 16l2-4h12l2 4" stroke="#2ccecc" strokeWidth="1.2"/>
            </svg>
          </div>
        )}

        {/* Class badge — top right */}
        <span
          className={`badge-class badge-${tune.class}`}
          style={{ position: "absolute", top: 8, right: 8 }}
        >
          {tune.class}
        </span>

        {/* PB badge — top left */}
        {tune.isPB && (
          <span style={{
            position: "absolute", top: 8, left: 8,
            fontSize: 9, fontWeight: 800, padding: "2px 6px",
            borderRadius: 4, background: "rgba(212,39,138,0.85)",
            color: "#fff", letterSpacing: "0.05em",
          }}>
            PB
          </span>
        )}

        {/* Unavailable overlay */}
        {tune.isUnavailable && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 4, padding: "3px 8px" }}>
              Indisponível
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        {/* Car name + omega + new */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", lineHeight: 1.3, flex: 1 }}>
            {tune.car.replace(" Ω", "")}
            {tune.isOmega && (
              <span style={{ color: "var(--fh6-pink)", marginLeft: 3, fontSize: 12 }}>Ω</span>
            )}
          </p>
          {tune.isNew && (
            <span style={{
              fontSize: 8, fontWeight: 800, padding: "2px 5px",
              borderRadius: 3, background: "rgba(200,255,0,0.12)",
              color: "var(--volt)", border: "1px solid rgba(200,255,0,0.30)",
              whiteSpace: "nowrap", flexShrink: 0,
              letterSpacing: "0.05em",
            }}>
              NOVO
            </span>
          )}
        </div>

        {/* Tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {tune.tags.map((tag) => (
            <TagPill key={tag} tag={tag} />
          ))}
        </div>

        {/* Description */}
        {tune.description && (
          <p style={{
            fontSize: 11, color: "var(--text-muted)", lineHeight: 1.45,
            flex: 1, display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {tune.description}
          </p>
        )}

        {/* Footer: tuner + share code */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: "auto", paddingTop: 4, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
            <div style={{
              width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, var(--blue-dim), var(--fh6-pink-dim))",
              border: "1px solid var(--border-strong)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <circle cx="5" cy="3.5" r="2" stroke="var(--blue-bright)" strokeWidth="1.2"/>
                <path d="M1.5 9c0-1.933 1.567-3.5 3.5-3.5S8.5 7.067 8.5 9" stroke="var(--blue-bright)" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {tune.tuner}
            </span>
          </div>
          <CopyButton code={tune.shareCode} />
        </div>
      </div>
    </article>
  )
}

// ── Rally Benchmark card ─────────────────────────────────────────────────────

function RallyCard({ bench, delay }: { bench: typeof TOP_RALLY_BENCHMARKS[number]; delay: number }) {
  return (
    <div
      className="r-card bracket anim-up"
      style={{ animationDelay: `${delay}ms`, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{bench.car}</p>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
            por <span style={{ color: "var(--blue-bright)", fontWeight: 600 }}>{bench.tuner}</span>
          </p>
        </div>
        <CopyButton code={bench.shareCode} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {bench.times.map((t) => (
          <div key={t.track} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{t.track}</span>
            <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12, fontWeight: 700, color: "var(--amber)" }}>
              {t.time}
            </span>
          </div>
        ))}
      </div>

      {bench.note && (
        <p style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 8 }}>
          {bench.note}
        </p>
      )}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

type Tab = "tunes" | "rally"

export default function TunesPage() {
  const [tab, setTab] = useState<Tab>("tunes")
  const [selectedClass, setSelectedClass] = useState<TuneClass | "all">("all")
  const [selectedTag, setSelectedTag] = useState<TuneTag | "all">("all")
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return COMMUNITY_TUNES.filter((t) => {
      if (selectedClass !== "all" && t.class !== selectedClass) return false
      if (selectedTag !== "all" && !t.tags.includes(selectedTag)) return false
      if (q) {
        const inCar    = t.car.toLowerCase().includes(q)
        const inTuner  = t.tuner.toLowerCase().includes(q)
        const inDesc   = t.description?.toLowerCase().includes(q) ?? false
        if (!inCar && !inTuner && !inDesc) return false
      }
      return true
    })
  }, [selectedClass, selectedTag, search])

  const stats = useMemo(() => ({
    total: COMMUNITY_TUNES.length,
    classes: CLASSES.length,
    tuners: new Set(COMMUNITY_TUNES.map((t) => t.tuner)).size,
    newCount: COMMUNITY_TUNES.filter((t) => t.isNew).length,
  }), [])

  return (
    <div className="dot-grid" style={{ minHeight: "100dvh" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10" style={{ display: "flex", flexDirection: "column", gap: 32 }}>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="anim-up" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p className="section-label" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Tunagens da Comunidade
          </p>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.03em", color: "var(--text)", lineHeight: 1.15 }}>
                Melhores Tunes
                <span style={{ color: "var(--blue-bright)" }}> FH6</span>
              </h1>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                Curado pela comunidade — compartilhe o código no jogo para usar a tunagem
              </p>
            </div>
            {/* Stats chips */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { label: `${stats.total} tunes`, icon: "📋" },
                { label: `${stats.tuners} tunadores`, icon: "👤" },
                { label: `${stats.newCount} novos`, icon: "⚡" },
              ].map(({ label, icon }) => (
                <span key={label} style={{
                  fontSize: 11, fontWeight: 600, padding: "4px 10px",
                  borderRadius: 20, background: "var(--bg-card)",
                  border: "1px solid var(--border-strong)", color: "var(--text-muted)",
                }}>
                  {icon} {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <div className="anim-up" style={{ animationDelay: "60ms" }}>
          <div style={{ display: "flex", gap: 2, padding: 4, borderRadius: 8, background: "var(--bg-card)", border: "1px solid var(--border-strong)", width: "fit-content" }}>
            {(["tunes", "rally"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  fontSize: 12, fontWeight: 700, padding: "6px 18px",
                  borderRadius: 6, border: "none", cursor: "pointer",
                  background: tab === t ? "var(--blue)" : "transparent",
                  color: tab === t ? "#fff" : "var(--text-muted)",
                  transition: "all 0.2s ease",
                }}
              >
                {t === "tunes" ? "🏎 Tunagens" : "🪨 Top Rally"}
              </button>
            ))}
          </div>
        </div>

        {tab === "tunes" && (
          <>
            {/* ── Filters ──────────────────────────────────────────────── */}
            <div className="anim-up" style={{ animationDelay: "100ms", display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Search */}
              <input
                className="r-input"
                placeholder="Buscar por carro, tunador ou descrição…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ maxWidth: 420 }}
              />

              {/* Class filter */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", minWidth: 42 }}>
                  Classe
                </span>
                <button
                  onClick={() => setSelectedClass("all")}
                  style={{
                    fontSize: 11, fontWeight: 700, padding: "4px 12px",
                    borderRadius: 6, border: selectedClass === "all" ? "1px solid var(--blue)" : "1px solid var(--border-strong)",
                    background: selectedClass === "all" ? "var(--blue-dim)" : "transparent",
                    color: selectedClass === "all" ? "var(--blue-bright)" : "var(--text-muted)",
                    cursor: "pointer", transition: "all 0.15s ease",
                  }}
                >
                  Todas ({COMMUNITY_TUNES.length})
                </button>
                {CLASSES.map((cls) => (
                  <button
                    key={cls}
                    onClick={() => setSelectedClass(selectedClass === cls ? "all" : cls)}
                    className={`badge-class badge-${cls}`}
                    style={{
                      padding: "4px 12px", cursor: "pointer",
                      opacity: selectedClass !== "all" && selectedClass !== cls ? 0.35 : 1,
                      transform: selectedClass === cls ? "scale(1.08)" : "scale(1)",
                      transition: "all 0.15s ease",
                      outline: selectedClass === cls ? "2px solid currentColor" : "none",
                      outlineOffset: 2,
                      fontSize: 11,
                    }}
                  >
                    {cls} <span style={{ opacity: 0.65 }}>({CLASS_COUNT[cls]})</span>
                  </button>
                ))}
              </div>

              {/* Race type filter */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", minWidth: 42 }}>
                  Tipo
                </span>
                <button
                  onClick={() => setSelectedTag("all")}
                  style={{
                    fontSize: 11, fontWeight: 700, padding: "4px 12px",
                    borderRadius: 20, border: selectedTag === "all" ? "1px solid var(--border-blue)" : "1px solid var(--border-strong)",
                    background: selectedTag === "all" ? "var(--blue-dim)" : "transparent",
                    color: selectedTag === "all" ? "var(--blue-bright)" : "var(--text-muted)",
                    cursor: "pointer", transition: "all 0.15s ease",
                  }}
                >
                  Todos
                </button>
                {ALL_TAGS.map((tag) => (
                  <TagPill
                    key={tag}
                    tag={tag}
                    active={selectedTag === tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? "all" : tag)}
                  />
                ))}
              </div>
            </div>

            {/* ── Results count ────────────────────────────────────────── */}
            <div className="anim-up" style={{ animationDelay: "140ms", display: "flex", alignItems: "center", gap: 8 }}>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                <span style={{ color: "var(--blue-bright)", fontWeight: 700 }}>{filtered.length}</span>
                {" "}tunagem{filtered.length !== 1 ? "s" : ""} encontrada{filtered.length !== 1 ? "s" : ""}
                {(selectedClass !== "all" || selectedTag !== "all" || search) && (
                  <button
                    onClick={() => { setSelectedClass("all"); setSelectedTag("all"); setSearch("") }}
                    style={{
                      marginLeft: 10, fontSize: 11, fontWeight: 600,
                      color: "var(--fh6-pink)", background: "none", border: "none",
                      cursor: "pointer", textDecoration: "underline",
                    }}
                  >
                    limpar filtros
                  </button>
                )}
              </p>
            </div>

            {/* ── Legend ───────────────────────────────────────────────── */}
            <div className="anim-up" style={{
              animationDelay: "160ms",
              padding: "14px 18px",
              borderRadius: 10,
              background: "var(--bg-card)",
              border: "1px solid var(--border-strong)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                Legenda
              </p>

              {/* Badges row */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: "rgba(212,39,138,0.85)", color: "#fff", letterSpacing: "0.05em" }}>PB</span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Potência bruta — melhor da classe</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "var(--fh6-pink)", fontWeight: 900, fontSize: 15, lineHeight: 1 }}>Ω</span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Carro indisponível na concessionária</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 8, fontWeight: 800, padding: "2px 5px", borderRadius: 3, background: "rgba(200,255,0,0.12)", color: "var(--volt)", border: "1px solid rgba(200,255,0,0.30)", letterSpacing: "0.05em" }}>NOVO</span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Adicionado recentemente</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>Indisponível</span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Tune sem código ativo no jogo</span>
                </div>
              </div>

            </div>

            {/* ── Grid ─────────────────────────────────────────────────── */}
            {filtered.length === 0 ? (
              <div className="anim-up" style={{ textAlign: "center", padding: "60px 0" }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>🔍</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Nenhuma tunagem encontrada</p>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Tente outros filtros ou limpe a busca</p>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 14,
              }}>
                {filtered.map((t, i) => (
                  <TuneCard key={t.id} tune={t} delay={Math.min(i * 30, 400)} />
                ))}
              </div>
            )}
          </>
        )}

        {tab === "rally" && (
          <>
            {/* ── Rally tab ──────────────────────────────────────────── */}
            <div className="anim-up" style={{ animationDelay: "60ms", display: "flex", flexDirection: "column", gap: 6 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>
                🪨 Top Rally — Classe A
              </h2>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Melhores tempos testados em 10 voltas cada pista, sem usar retroceder.
                Carro: <span style={{ color: "var(--amber)", fontWeight: 700 }}>Shelby Daytona A</span>
              </p>
            </div>

            {/* Tracks header */}
            <div className="anim-up" style={{ animationDelay: "80ms", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {["Floresta de Bambu", "Trilha Nakubira", "Trilha Takashiro"].map((track) => (
                <div key={track} style={{
                  padding: "10px 14px", borderRadius: 8, textAlign: "center",
                  background: "var(--bg-card)", border: "1px solid var(--border-strong)",
                }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "var(--amber)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {track}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
              {TOP_RALLY_BENCHMARKS.map((b, i) => (
                <RallyCard key={`${b.tuner}-${i}`} bench={b} delay={i * 60} />
              ))}
            </div>

            <div className="anim-up" style={{
              animationDelay: "300ms",
              padding: "14px 18px", borderRadius: 8,
              background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)",
              fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6,
            }}>
              💡 <strong style={{ color: "var(--amber)" }}>Dica:</strong> O Shelby Daytona A é atualmente o melhor carro de rally na classe A, porém o mais inacessível — custa 20.000.000 na concessionária. Use o código da tunagem direto no jogo.
            </div>
          </>
        )}

        {/* ── Footer note ───────────────────────────────────────────────── */}
        <div style={{ paddingTop: 8, paddingBottom: 24, textAlign: "center" }}>
          <p style={{ fontSize: 11, color: "var(--text-subtle)" }}>
            Última atualização: 02/06 · Dados curados pela comunidade FH6 · Para sugerir tunagens, acesse o Discord
          </p>
        </div>
      </div>
    </div>
  )
}
