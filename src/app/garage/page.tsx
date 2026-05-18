"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { getCarImageUrl } from "@/data/cars"
import type { GeneratedTune } from "@/types"

interface SavedTune {
  id: string
  saved_at: string
  tune: GeneratedTune
}

const STORAGE_KEY = "forza-tune-lab:saved-tunes"

function readSavedTunes(): SavedTune[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const data = raw ? JSON.parse(raw) : []
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export default function GaragePage() {
  const [saved, setSaved] = useState<SavedTune[]>([])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setSaved(readSavedTunes())
    }, 0)

    return () => window.clearTimeout(handle)
  }, [])

  function removeTune(id: string) {
    const next = saved.filter((item) => item.id !== id)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setSaved(next)
  }

  function clearGarage() {
    window.localStorage.removeItem(STORAGE_KEY)
    setSaved([])
  }

  return (
    <div className="dot-grid" style={{ minHeight: "100dvh" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="flex items-start justify-between gap-4 flex-wrap anim-up">
          <div>
            <p className="section-label">Garagem local</p>
            <h1 className="page-title">Tunes salvas</h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>
              As tunes ficam no armazenamento deste navegador.
            </p>
          </div>
          <div className="flex gap-2">
            {saved.length > 0 && (
              <button type="button" className="r-btn r-btn-ghost" onClick={clearGarage}>
                Limpar garagem
              </button>
            )}
            <Link href="/tune" className="r-btn r-btn-primary">Criar tune</Link>
          </div>
        </div>

        {saved.length === 0 ? (
          <div className="r-card bracket p-8 text-center space-y-4 anim-up" style={{ animationDelay: "80ms" }}>
            <p style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>Nenhuma tune salva ainda</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 460, margin: "0 auto", lineHeight: 1.6 }}>
              Gere uma tune e use o botão de salvar no resultado. A garagem vai guardar as configurações para consulta rápida.
            </p>
            <Link href="/tune" className="r-btn r-btn-primary">Gerar primeira tune</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {saved.map((item, index) => {
              const { tune } = item
              const imageUrl = getCarImageUrl(tune.car)
              return (
                <article key={item.id} className="r-card bracket p-4 grid grid-cols-1 sm:grid-cols-[140px_1fr_auto] gap-4 items-center anim-up" style={{ animationDelay: `${index * 45}ms` }}>
                  <div className="relative rounded-lg overflow-hidden" style={{ height: 78, background: "var(--bg-elevated)" }}>
                    {imageUrl && (
                      <Image src={imageUrl} alt={`${tune.car.brand} ${tune.car.model}`} fill sizes="140px" style={{ objectFit: "contain", padding: 8 }} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex gap-2 flex-wrap" style={{ marginBottom: 7 }}>
                      <span className={`badge-class badge-${tune.target_class}`}>{tune.target_class}</span>
                      <span className={`badge-class badge-${tune.drivetrain === "AWD" ? "awd" : tune.drivetrain === "RWD" ? "rwd" : "fwd"}`}>{tune.drivetrain}</span>
                      <span className="badge-class" style={{ color: "var(--blue-bright)", background: "var(--blue-dim)", borderColor: "var(--border-blue)" }}>
                        {tune.tune_type}
                      </span>
                    </div>
                    <h2 style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>{tune.car.brand} {tune.car.model}</h2>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
                      Salva em {new Date(item.saved_at).toLocaleString("pt-BR")} · PI estimado {tune.pi_estimate}
                    </p>
                  </div>
                  <div className="flex gap-2 sm:flex-col">
                    <Link href={`/tune?car=${tune.car.id}&type=${tune.tune_type}`} className="r-btn r-btn-outline" style={{ fontSize: 11 }}>
                      Regerar
                    </Link>
                    <button type="button" className="r-btn r-btn-ghost" style={{ fontSize: 11 }} onClick={() => removeTune(item.id)}>
                      Remover
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
