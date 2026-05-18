"use client"

import Image from "next/image"
import Link from "next/link"
import { CARS, getCarImageUrl } from "@/data/cars"
import type { Car } from "@/types"

const JDM_IDS = [
  "toyota_gr_supra_2020",
  "toyota_gr_yaris_2021",
  "toyota_gr86_2022",
  "honda_nsx_r_1992_1992",
  "honda_s2000_2003",
  "lexus_lfa_2010",
  "mazda_furai_2008",
  "acura_nsx_type_s_2022",
  "honda_civic_type_r_2023_2023",
  "nissan_370z_nismo_2019",
  "nissan_fairlady_z_2003",
  "subaru_brz_2022_2022",
  "subaru_impreza_wrx_sti_2004_2004",
  "mitsubishi_lancer_evolution_iii_gsr_1995",
  "mitsubishi_eclipse_gsx_1995",
  "mazda_mx_5_2016_2016",
]

function CarSlide({ car }: { car: Car }) {
  const url = getCarImageUrl(car)
  return (
    <Link
      href={`/tune?car=${car.id}`}
      className="carousel-item"
      style={{ textDecoration: "none", flexShrink: 0 }}
      tabIndex={-1}
    >
      <div
        style={{
          width: 260,
          height: 160,
          position: "relative",
          background: "#0a0a0a",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 6,
          overflow: "hidden",
          transition: "border-color 0.2s ease",
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLDivElement).style.borderColor = "var(--fh6-teal)"
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)"
        }}
      >
        {url && (
          <Image
            src={url}
            alt={`${car.brand} ${car.model}`}
            fill
            sizes="260px"
            style={{ objectFit: "contain", padding: 10 }}
          />
        )}
        {/* Bottom overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)",
          }}
        />
        <div style={{ position: "absolute", bottom: 8, left: 10, right: 10 }}>
          <p style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {car.brand}
          </p>
          <p style={{ fontSize: 12, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>{car.model}</p>
          <p style={{ fontSize: 9, color: "var(--fh6-teal)", fontWeight: 700, marginTop: 1 }}>{car.year} · {car.base_class}</p>
        </div>
      </div>
    </Link>
  )
}

export function JDMCarousel() {
  const cars = JDM_IDS
    .map((id) => CARS.find((c) => c.id === id))
    .filter((c): c is Car => !!c && !!getCarImageUrl(c))

  if (cars.length === 0) return null

  // Duplicate for seamless infinite loop
  const track = [...cars, ...cars]

  return (
    <div style={{ overflow: "hidden", position: "relative" }}>
      {/* Gradient fade edges */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 80, zIndex: 1,
          background: "linear-gradient(to right, #050505, transparent)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute", right: 0, top: 0, bottom: 0, width: 80, zIndex: 1,
          background: "linear-gradient(to left, #050505, transparent)",
          pointerEvents: "none",
        }}
      />

      {/* Track */}
      <div
        className="carousel-track"
        style={{
          display: "flex",
          gap: 14,
          padding: "4px 0 12px",
          animation: `carouselScroll ${cars.length * 4}s linear infinite`,
          width: "max-content",
        }}
      >
        {track.map((car, i) => (
          <CarSlide key={`${car.id}-${i}`} car={car} />
        ))}
      </div>

      <style>{`
        @keyframes carouselScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-${cars.length * (260 + 14)}px); }
        }
        .carousel-track:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
