"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

export interface AppSettings {
  partsLanguage: "en" | "ptbr"
  pressureUnit: "psi" | "bar"
  powerUnit: "hp" | "cv"
  torqueUnit: "nm" | "kgfm"
  springUnit: "kgfmm" | "lbfin"
}

const DEFAULTS: AppSettings = {
  partsLanguage: "en",
  pressureUnit: "psi",
  powerUnit: "hp",
  torqueUnit: "nm",
  springUnit: "kgfmm",   // jogo usa kgf/mm nativamente
}

const STORAGE_KEY = "forza-tune-lab:settings"

interface SettingsCtx {
  settings: AppSettings
  update(partial: Partial<AppSettings>): void
}

const Ctx = createContext<SettingsCtx | null>(null)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS)

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppSettings>
        setSettings((prev) => ({ ...prev, ...parsed }))
      }
    } catch {}
  }, [])

  const update = useCallback((partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial }
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const value = useMemo(() => ({ settings, update }), [settings, update])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSettings(): SettingsCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useSettings must be inside SettingsProvider")
  return ctx
}
