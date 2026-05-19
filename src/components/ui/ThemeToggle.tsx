"use client"

import { useTheme } from "@/lib/theme/context"

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const isDark = theme === "dark"

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        borderRadius: 6,
        border: "1px solid var(--border-strong)",
        background: "transparent",
        color: "var(--text-muted)",
        cursor: "pointer",
        transition: "all 0.2s ease",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.color = "var(--text)"
        ;(e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-blue)"
        ;(e.currentTarget as HTMLButtonElement).style.background = "var(--blue-dim)"
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"
        ;(e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-strong)"
        ;(e.currentTarget as HTMLButtonElement).style.background = "transparent"
      }}
    >
      {isDark ? (
        /* Sol — clica pra ir pro modo claro */
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
          <circle cx="7.5" cy="7.5" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M2.93 2.93l1.06 1.06M11.01 11.01l1.06 1.06M2.93 12.07l1.06-1.06M11.01 3.99l1.06-1.06"
            stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      ) : (
        /* Lua — clica pra ir pro modo escuro */
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
          <path d="M6 2.5A5.5 5.5 0 1 0 12.5 9 4 4 0 0 1 6 2.5z"
            stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  )
}
