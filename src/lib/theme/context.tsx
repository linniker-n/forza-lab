"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"

export type Theme = "dark" | "light"

interface ThemeCtx {
  theme: Theme
  toggle(): void
}

const Ctx = createContext<ThemeCtx | null>(null)

const STORAGE_KEY = "forza-tune-lab:theme"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark"
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null
      if (stored === "light" || stored === "dark") {
        return stored
      }
    } catch {}
    return "dark"
  })

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark"
      try { localStorage.setItem(STORAGE_KEY, next) } catch {}
      document.documentElement.setAttribute("data-theme", next)
      return next
    })
  }, [])

  // Sync data-theme attribute whenever theme state changes
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
  }, [theme])

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider")
  return ctx
}
