"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      const handle = window.setTimeout(() => {
        setError("Supabase não configurado.")
      }, 0)
      return () => window.clearTimeout(handle)
    }

    supabase.auth.exchangeCodeForSession(window.location.href).then(({ error: authError }) => {
      if (authError) {
        setError(authError.message)
        return
      }

      router.replace("/tune")
    })
  }, [router])

  return (
    <div className="dot-grid" style={{ minHeight: "100dvh" }}>
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-20">
        <div className="r-card bracket p-8 space-y-4">
          <p className="section-label">Autenticação</p>
          <h1 className="page-title">{error ? "Falha no login" : "Validando acesso"}</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
            {error ?? "Estamos finalizando sua sessão e redirecionando para o gerador."}
          </p>
        </div>
      </div>
    </div>
  )
}
