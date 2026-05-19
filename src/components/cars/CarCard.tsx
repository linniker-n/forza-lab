"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { getCarImageUrl } from "@/data/cars"
import { useSettings } from "@/lib/settings/context"
import { powerLabel, powerValue, torqueLabel, torqueValue } from "@/lib/settings/units"
import type { Car } from "@/types"

const SCORE_KEYS = [
  { key: "street"  as const, label: "Rua",    cls: "stat-fill-blue"   },
  { key: "drift"   as const, label: "Drift",  cls: "stat-fill-amber"  },
  { key: "rally"   as const, label: "Rally",  cls: "stat-fill-green"  },
  { key: "drag"    as const, label: "Drag",   cls: "stat-fill-purple" },
]

const DT_CLASS: Record<string, string> = {
  AWD: "badge-awd",
  RWD: "badge-rwd",
  FWD: "badge-fwd",
}

interface Props { car: Car; index?: number; highlightKey?: string }

export function CarCard({ car, index = 0, highlightKey }: Props) {
  const [imgErr, setImgErr] = useState(false)
  const url = getCarImageUrl(car)
  const hasImg = !!url && !imgErr
  const delay = `${Math.min(index * 55, 440)}ms`
  const { settings } = useSettings()
  const pwUnit = settings.powerUnit
  const tUnit  = settings.torqueUnit

  return (
    <article
      className="r-card bracket flex flex-col anim-up"
      style={{ animationDelay: delay }}
    >
      {/* ── Image ──────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-t-[9px]"
        style={{
          height: 156,
          background: "var(--bg-surface)",
        }}
      >
        {hasImg ? (
          <Image
            src={url}
            alt={`${car.brand} ${car.model}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="car-render"
            style={{ objectFit: "contain", padding: "12px" }}
            onError={() => setImgErr(true)}
            priority={index < 8}
          />
        ) : (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-1"
            style={{ opacity: 0.25 }}
          >
            <span
              className="mono-val"
              style={{ fontSize: 26, letterSpacing: "-0.04em", color: "var(--text)" }}
            >
              {car.brand.slice(0, 3).toUpperCase()}
            </span>
            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{car.year}</span>
          </div>
        )}

        {/* Gradient overlay bottom */}
        <div
          className="absolute inset-x-0 bottom-0 h-14 pointer-events-none"
          style={{ background: "linear-gradient(to top, var(--bg-card), transparent)" }}
        />

        {/* Badges */}
        <span className={`badge-class badge-${car.base_class} absolute top-3 left-3`}>
          {car.base_class} · {car.base_pi}
        </span>
        <span className={`badge-class ${DT_CLASS[car.drivetrain] ?? ""} absolute top-3 right-3`}>
          {car.drivetrain}
        </span>
      </div>

      {/* ── Body ───────────────────────────────── */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Name */}
        <div>
          <p
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
            }}
          >
            {car.brand} · {car.year}
          </p>
          <h3
            style={{
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "var(--text)",
              marginTop: 2,
              lineHeight: 1.2,
            }}
          >
            {car.model}
          </h3>
        </div>

        {/* Stats grid */}
        <div
          className="grid grid-cols-3 gap-1 rounded-lg p-2"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}
        >
          {[
            { l: powerLabel(pwUnit),  v: powerValue(car.power_hp, pwUnit) },
            { l: torqueLabel(tUnit),  v: torqueValue(car.torque_nm, tUnit) },
            { l: "kg",                v: String(car.weight_kg) },
          ].map(({ l, v }) => (
            <div key={l} className="flex flex-col items-center gap-0.5">
              <span className="mono-val" style={{ fontSize: 12 }}>{v}</span>
              <span style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em" }}>{l}</span>
            </div>
          ))}
        </div>

        {/* Score bars */}
        <div className="space-y-2">
          {SCORE_KEYS.map(({ key, label, cls }) => {
            const score = car.meta_score[key]
            const isHL = highlightKey === key || (highlightKey === "grip" && key === "street")
            return (
              <div key={key} className="flex items-center gap-2">
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    width: 36,
                    color: isHL ? "var(--blue-bright)" : "var(--text-muted)",
                    flexShrink: 0,
                  }}
                >
                  {label}
                </span>
                <div className="stat-track flex-1">
                  <div
                    className={`stat-fill ${isHL ? "stat-fill-blue" : cls}`}
                    style={{ width: `${score * 10}%`, animationDelay: delay }}
                  />
                </div>
                <span className="mono-val" style={{ fontSize: 10, width: 18, textAlign: "right", color: "var(--text-muted)" }}>
                  {score}
                </span>
              </div>
            )
          })}
        </div>

        {/* Note */}
        {car.notes && (
          <p
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              lineHeight: 1.55,
              borderTop: "1px solid var(--border)",
              paddingTop: 8,
            }}
            className="line-clamp-2"
          >
            {car.notes}
          </p>
        )}

        {/* CTA */}
        <Link href={`/tune?car=${car.id}`} className="r-btn r-btn-ghost mt-auto" style={{ fontSize: 11, padding: "6px 12px" }}>
          Tunar este carro →
        </Link>
      </div>
    </article>
  )
}
