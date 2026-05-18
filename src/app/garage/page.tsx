"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { getCarImageUrl } from "@/data/cars"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { GeneratedTune } from "@/types"

interface SavedTune {
  id: string
  saved_at: string
  tune: GeneratedTune
}

function storageKey(userId?: string) {
  return `forza-tune-lab:saved-tunes:${userId ?? "local"}`
}

function readSavedTunes(userId?: string): SavedTune[] {
  try {
    const raw = window.localStorage.getItem(storageKey(userId))
    const data = raw ? JSON.parse(raw) : []
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export default function GaragePage() {
  const [saved, setSaved] = useState<SavedTune[]>([])
  const [syncNote, setSyncNote] = useState<string | null>(null)
  const { user } = useAuth()
  const userId = user?.id

  useEffect(() => {
    let active = true
    const supabase = getSupabaseBrowserClient()

    if (supabase && userId) {
      supabase
        .from("saved_tunes")
        .select("id, created_at, tune")
        .order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (!active) return

          if (error) {
            setSyncNote("Garagem Supabase indisponível. Exibindo tunes salvas neste navegador.")
            setSaved(readSavedTunes(userId))
            return
          }

          setSyncNote(null)
          setSaved((data ?? []).map((row) => ({
            id: row.id,
            saved_at: row.created_at,
            tune: row.tune as GeneratedTune,
          })))
        })
    } else {
      Promise.resolve().then(() => {
        if (!active) return
        setSaved(readSavedTunes(userId))
      })
    }

    return () => {
      active = false
    }
  }, [userId])

  async function removeTune(id: string) {
    const supabase = getSupabaseBrowserClient()
    if (supabase && user) {
      await supabase.from("saved_tunes").delete().eq("id", id)
    }

    const next = saved.filter((item) => item.id !== id)
    window.localStorage.setItem(storageKey(user?.id), JSON.stringify(next))
    setSaved(next)
  }

  async function clearGarage() {
    const supabase = getSupabaseBrowserClient()
    if (supabase && user) {
      await supabase.from("saved_tunes").delete().eq("user_id", user.id)
    }

    window.localStorage.removeItem(storageKey(user?.id))
    setSaved([])
  }

  return (
    <RequireAuth>
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
              <button type="button" className="r-btn r-btn-ghost" onClick={() => void clearGarage()}>
                Limpar garagem
              </button>
            )}
            <Link href="/tune" className="r-btn r-btn-primary">Criar tune</Link>
          </div>
        </div>

        {syncNote && (
          <p className="rounded-lg p-3 anim-up" style={{ fontSize: 12, color: "#fbbf24", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
            {syncNote}
          </p>
        )}

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
                    <button type="button" className="r-btn r-btn-ghost" style={{ fontSize: 11 }} onClick={() => void removeTune(item.id)}>
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
    </RequireAuth>
  )
}
