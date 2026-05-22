"use client"

interface Props {
  slot?: string   // Google AdSense data-ad-slot (futuro)
  size?: "banner" | "rectangle" | "leaderboard"
  className?: string
}

const SIZES = {
  banner:      { width: "100%", height: 90 },
  rectangle:   { width: 300,    height: 250 },
  leaderboard: { width: "100%", height: 90 },
}

export function AdPlaceholder({ size = "banner", className }: Props) {
  const dim = SIZES[size]

  return (
    <div
      className={className}
      data-ad-placeholder={size}
      style={{
        width: dim.width, height: dim.height,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg-surface)", border: "1px dashed var(--border-strong)",
        borderRadius: 6, overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Quando AdSense for integrado, substituir o conteúdo abaixo por:
          <ins className="adsbygoogle" data-ad-slot={slot} data-ad-format="auto" ... /> */}
      <p style={{ fontSize: 9, color: "var(--text-subtle)", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
        Publicidade
      </p>
    </div>
  )
}
