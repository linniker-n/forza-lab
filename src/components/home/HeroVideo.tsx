"use client"

import { useEffect, useState } from "react"

// Video only loads on desktop — mobile devices crash with a 3.8MB+ autoplay video
export function HeroVideo() {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768
      setIsDesktop(!mobile)
    }, 0)
    return () => window.clearTimeout(handle)
  }, [])

  if (!isDesktop) return null

  return (
    <video
      autoPlay muted loop playsInline
      aria-hidden="true"
      style={{
        position: "absolute", inset: 0,
        width: "100%", height: "100%",
        objectFit: "cover", objectPosition: "center",
        pointerEvents: "none",
      }}
    >
      <source src="/hero.mp4" type="video/mp4" />
      <source src="/hero.webm" type="video/webm" />
    </video>
  )
}
