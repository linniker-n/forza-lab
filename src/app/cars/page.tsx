"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { CARS, CARS_SYNCED_AT, FANDOM_SOURCE_URL } from "@/data/cars"
import type { TuneType } from "@/types"
import { CarCard } from "@/components/cars/CarCard"

const TUNE_FILTERS: { v: TuneType | "all"; l: string }[] = [
  { v: "all",           l: "Todos"      },
  { v: "street",        l: "Rua"        },
  { v: "drag",          l: "Drag"       },
  { v: "drift",         l: "Drift"      },
  { v: "rally",         l: "Rally"      },
  { v: "cross_country", l: "Off-Road"   },
  { v: "top_speed",     l: "Top Speed"  },
  { v: "grip",          l: "Grip"       },
]
const DT_FILTERS = ["Todos", "AWD", "RWD", "FWD"]
const CL_FILTERS = ["Todas", "D", "C", "B", "A", "S1", "S2", "R", "X"]
const SORT_OPTS   = [
  { v: "name",  l: "Nome"      },
  { v: "power", l: "Potência"  },
  { v: "pi",    l: "PI"        },
  { v: "weight",l: "Peso"      },
]

export default function CarsPage() {
  const [q,    setQ]    = useState("")
  const [tune, setTune] = useState<TuneType | "all">("all")
  const [dt,   setDt]   = useState("Todos")
  const [cl,   setCl]   = useState("Todas")
  const [sort, setSort] = useState("name")

  const results = useMemo(() => {
    const lq = q.toLowerCase()
    return CARS
      .filter((c) => {
        if (lq && !`${c.brand} ${c.model} ${c.year}`.toLowerCase().includes(lq)) return false
        if (tune !== "all" && !c.recommended_use.includes(tune)) return false
        if (dt !== "Todos"  && c.drivetrain !== dt) return false
        if (cl !== "Todas"  && c.base_class !== cl) return false
        return true
      })
      .sort((a, b) => {
        if (sort === "power")  return b.power_hp  - a.power_hp
        if (sort === "pi")     return b.base_pi   - a.base_pi
        if (sort === "weight") return a.weight_kg - b.weight_kg
        return `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`)
      })
  }, [q, tune, dt, cl, sort])

  function clearAll() { setQ(""); setTune("all"); setDt("Todos"); setCl("Todas") }

  return (
    <div className="dot-grid" style={{ minHeight: "100dvh" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* ── Header ── */}
        <div className="flex items-start justify-between flex-wrap gap-4 anim-up">
          <div className="space-y-1">
            <p className="section-label">Banco de dados</p>
            <h1 className="page-title">Carros</h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {CARS.length} carros sincronizados do Forza Wiki
            </p>
            <a href={FANDOM_SOURCE_URL} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "var(--blue-bright)" }}>
              Fonte oficial da lista · atualizado em {new Date(CARS_SYNCED_AT).toLocaleDateString("pt-BR")}
            </a>
          </div>
          <Link href="/tune" className="r-btn r-btn-primary">Criar Tune</Link>
        </div>

        {/* ── Search ── */}
        <div className="relative anim-up" style={{ animationDelay: "60ms", maxWidth: 420 }}>
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--text-muted)" }}
            width="14" height="14" viewBox="0 0 14 14" fill="none"
          >
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            className="r-input"
            style={{ paddingLeft: 36 }}
            placeholder="Marca, modelo ou ano..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {/* ── Filters ── */}
        <div className="space-y-3 anim-up" style={{ animationDelay: "100ms" }}>
          {/* Tune type */}
          <div className="flex gap-2 flex-wrap">
            {TUNE_FILTERS.map((f) => (
              <button
                key={f.v}
                type="button"
                onClick={() => setTune(f.v)}
                className={`filter-chip${tune === f.v ? " active" : ""}`}
              >
                {f.l}
              </button>
            ))}
          </div>

          {/* Row 2 */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-1.5 flex-wrap">
              {DT_FILTERS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDt(d)}
                  className={`class-chip${dt === d ? " active" : ""}`}
                  style={{ minWidth: 48 }}
                >
                  {d}
                </button>
              ))}
            </div>
            <div className="vdivider" />
            <div className="flex gap-1.5 flex-wrap">
              {CL_FILTERS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCl(c)}
                  className={`class-chip${cl === c ? " active" : ""}`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>ORDENAR</span>
              {SORT_OPTS.map((s) => (
                <button
                  key={s.v}
                  type="button"
                  onClick={() => setSort(s.v)}
                  className={`class-chip${sort === s.v ? " active" : ""}`}
                  style={{ minWidth: "auto" }}
                >
                  {s.l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Count ── */}
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {results.length} {results.length === 1 ? "carro encontrado" : "carros encontrados"}
        </p>

        {/* ── Grid ── */}
        {results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {results.map((car, i) => (
              <CarCard
                key={car.id}
                car={car}
                index={i}
                highlightKey={tune !== "all" ? tune : undefined}
              />
            ))}
          </div>
        ) : (
          /* ── Empty state ── */
          <div className="flex flex-col items-center gap-4 py-24">
            <div
              className="w-16 h-16 flex items-center justify-center rounded-2xl r-card"
              style={{ border: "1px solid var(--border-strong)" }}
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ color: "var(--text-muted)" }}>
                <rect x="3" y="10" width="22" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M6 10L8.5 4h11L22 10" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                <circle cx="8.5" cy="22" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="19.5" cy="22" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Nenhum carro encontrado</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Tente ajustar os filtros ou a busca.</p>
            <button
              type="button"
              onClick={clearAll}
              className="r-btn r-btn-outline"
              style={{ marginTop: 4 }}
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
