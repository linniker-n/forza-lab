"use client"

import { createContext, useContext, useEffect, useState } from "react"

export type Language = "pt" | "en"

const STORAGE_KEY = "forza-lab:language"

function detectLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null
    if (saved === "pt" || saved === "en") return saved
    const lang = navigator.language ?? "pt"
    return lang.startsWith("pt") ? "pt" : "en"
  } catch {
    return "pt"
  }
}

interface LanguageCtx {
  lang: Language
  setLang(l: Language): void
}

const Ctx = createContext<LanguageCtx>({ lang: "pt", setLang: () => {} })

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("pt")

  useEffect(() => {
    const handle = window.setTimeout(() => setLangState(detectLanguage()), 0)
    return () => window.clearTimeout(handle)
  }, [])

  function setLang(l: Language) {
    setLangState(l)
    try { localStorage.setItem(STORAGE_KEY, l) } catch {}
  }

  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>
}

export function useLanguage(): LanguageCtx {
  return useContext(Ctx)
}
