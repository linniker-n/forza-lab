"use client"

import Image from "next/image"
import Link from "next/link"
import { CARS, getCarImageUrl } from "@/data/cars"
import { CarCard } from "@/components/cars/CarCard"
import { HeroVideo } from "@/components/home/HeroVideo"
import { JDMCarousel } from "@/components/home/JDMCarousel"
import { useLanguage } from "@/lib/i18n/context"
import { useTranslations } from "@/lib/i18n/translations"

/* Hero car */
const HERO_CAR = CARS.find((c) => c.id === "gr_gt_prototype_2025")
              ?? CARS.find((c) => c.id === "toyota_gr_supra_2020")
              ?? CARS[0]

/* Featured JDM cars */
const FEATURED = CARS.filter((c) =>
  ["toyota_gr_supra_2020", "honda_nsx_r_1992_1992", "lexus_lfa_2010",
   "mazda_furai_2008", "subaru_brz_2022_2022", "acura_nsx_type_s_2022"].includes(c.id)
)

export default function HomePage() {
  const { lang } = useLanguage()
  const t = useTranslations(lang)
  const heroCarImg = getCarImageUrl(HERO_CAR)

  const FEATURES = [
    { num: "01", title: t.home.f01Title, body: t.home.f01Body, href: "/tune",        color: "var(--fh6-teal)" },
    { num: "02", title: t.home.f02Title, body: t.home.f02Body, href: "/diagnostics", color: "var(--fh6-pink)" },
    { num: "03", title: t.home.f03Title, body: t.home.f03Body, href: "/cars",        color: "var(--fh6-teal)" },
    { num: "04", title: t.home.f04Title, body: t.home.f04Body, href: "/meta",        color: "var(--fh6-pink)" },
    { num: "05", title: t.home.f05Title, body: t.home.f05Body, href: "/compare",     color: "var(--fh6-teal)" },
    { num: "06", title: t.home.f06Title, body: t.home.f06Body, href: "/garage",      color: "var(--fh6-pink)" },
  ]

  return (
    <>
      {/* ════════════════════════════════════════════════════════
          HERO
          ════════════════════════════════════════════════════════ */}
      <section className="fh6-hero" style={{ background: "#080c10" }}>

        {/* Video background — desktop only */}
        <HeroVideo />

        {/* Overlays */}
        <div aria-hidden="true" className="hero-overlay-btm" style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 38%, rgba(0,0,0,0.15) 70%, transparent 100%)",
        }} />
        <div aria-hidden="true" className="hero-overlay-lft" style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.25) 55%, transparent 100%)",
        }} />

        {/* Hero car image */}
        {heroCarImg && (
          <div style={{
            position: "absolute",
            right: 0, bottom: "8%",
            width: "58%", height: "70%",
            pointerEvents: "none",
          }}>
            <Image
              src={heroCarImg}
              alt={`${HERO_CAR.brand} ${HERO_CAR.model}`}
              fill
              sizes="58vw"
              priority
              style={{
                objectFit: "contain",
                objectPosition: "right bottom",
                filter: "brightness(1.1) contrast(1.05) drop-shadow(0 24px 60px rgba(44,206,204,0.18)) drop-shadow(0 0 120px rgba(0,0,0,0.8))",
              }}
            />
          </div>
        )}

        {/* Hero content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 w-full flex flex-col justify-center" style={{ zIndex: 2, flex: 1, paddingBottom: 80 }}>
          <div className="max-w-xl space-y-6 anim-up">

            <h1
              className="fh6-headline"
              style={{ fontSize: "clamp(2.2rem, 5.5vw, 5.5rem)" }}
            >
              <span style={{ whiteSpace: "nowrap" }}>{t.home.heroLine1}</span>{" "}
              <span className="fh6-headline-accent" style={{ whiteSpace: "nowrap" }}>{t.home.heroLine2}</span><br />
              {t.home.heroLine3}<br />
              <span style={{ color: "rgba(255,255,255,0.45)" }}>{t.home.heroLine4}</span>
            </h1>

            <p className="hero-subtitle" style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", maxWidth: 440, lineHeight: 1.7 }}>
              {t.home.heroSubtitle}
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/tune" className="r-btn" style={{
                paddingLeft: 32, paddingRight: 32, paddingTop: 13, paddingBottom: 13,
                background: "var(--fh6-teal)", color: "#000", border: "none",
                fontWeight: 800, fontSize: 13, letterSpacing: "0.05em", textTransform: "uppercase",
                boxShadow: "0 4px 20px rgba(44,206,204,0.35)",
              }}>
                {t.home.heroCta}
              </Link>
              <Link href="/cars" className="r-btn hero-btn-ghost" style={{
                paddingLeft: 28, paddingRight: 28, paddingTop: 13, paddingBottom: 13,
                background: "transparent", color: "#fff",
                border: "1px solid rgba(255,255,255,0.3)",
                fontWeight: 700, fontSize: 13, letterSpacing: "0.04em", textTransform: "uppercase",
              }}>
                {t.home.heroCta2}
              </Link>
            </div>
          </div>

          {/* Car info chip */}
          <div className="hero-chip absolute right-4 sm:right-6 bottom-14 hidden lg:flex items-center gap-3 px-4 py-3 rounded anim-up" style={{
            background: "rgba(0,0,0,0.8)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(16px)",
            animationDelay: "0.35s",
          }}>
            <div>
              <p className="hero-chip-label" style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                {HERO_CAR.brand} · {HERO_CAR.year}
              </p>
              <p className="hero-chip-value" style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{HERO_CAR.model}</p>
            </div>
            <div className="hero-chip-div" style={{ width: 1, height: 28, background: "rgba(255,255,255,0.12)" }} />
            <div>
              <p className="hero-chip-label" style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>{t.home.heroPower}</p>
              <p style={{ fontSize: 13, fontWeight: 800, color: "var(--fh6-teal)", fontFamily: "var(--font-geist-mono)" }}>{HERO_CAR.power_hp} HP</p>
            </div>
            <div className="hero-chip-div" style={{ width: 1, height: 28, background: "rgba(255,255,255,0.12)" }} />
            <span className={`badge-class badge-${HERO_CAR.base_class}`} style={{ fontSize: 11 }}>
              {HERO_CAR.base_class} · {HERO_CAR.base_pi} PI
            </span>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="scroll-indicator absolute bottom-5 left-1/2 -translate-x-1/2" style={{ zIndex: 2, opacity: 0.35 }}>
          <svg width="16" height="22" viewBox="0 0 16 22" fill="none">
            <rect x="1" y="1" width="14" height="20" rx="7" stroke="white" strokeWidth="1.2"/>
            <rect x="7" y="4" width="2" height="5" rx="1" fill="white"/>
          </svg>
        </div>
      </section>

      <div className="fh6-divider" />

      {/* ════════════════════════════════════════════════════════
          STATS BAR
          ════════════════════════════════════════════════════════ */}
      <section style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 divide-x" style={{ borderColor: "var(--border)" }}>
          {[
            { val: "618",  label: t.home.statCars },
            { val: "7",    label: t.home.statTuneTypes },
            { val: "8",    label: t.home.statDiagnostics },
            { val: "100%", label: t.home.statEngine },
          ].map((s, i) => (
            <div key={s.label} className="fh6-stat anim-up" style={{ animationDelay: `${i * 80}ms` }}>
              <span className="fh6-stat-val">{s.val}</span>
              <span className="fh6-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          JAPAN — map section
          ════════════════════════════════════════════════════════ */}
      <section style={{ background: "var(--bg-base)", position: "relative", overflow: "hidden" }}>
        <div className="origami-tr" aria-hidden="true" style={{ opacity: 0.08 }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 anim-up">
            <p className="fh6-eyebrow">{lang === "pt" ? "O festival começa aqui" : "The festival starts here"}</p>
            <h2 style={{
              fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 900,
              letterSpacing: "-0.03em", lineHeight: 1.05,
              color: "var(--text)", textTransform: "uppercase",
            }}>
              Tokyo. Nikko.<br />Hokkaido.<br />
              <span style={{ color: "var(--fh6-teal)" }}>
                {lang === "pt" ? "O mapa inteiro\nte espera." : "The whole map\nawaits you."}
              </span>
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.75, maxWidth: 450 }}>
              {lang === "pt"
                ? "FH6 é o maior mapa da série. Tóquio, estradas de montanha, litoral — cada pista pede um setup diferente. Escolha o carro, a classe, o estilo. O app calcula o resto."
                : "FH6 is the biggest map in the series. Tokyo, mountain roads, coastline — every track demands a different setup. Pick the car, the class, the style. The app calculates the rest."}
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/tune" className="r-btn" style={{
                background: "var(--fh6-teal)", color: "#000", border: "none",
                fontWeight: 800, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase",
                paddingLeft: 24, paddingRight: 24, paddingTop: 11, paddingBottom: 11,
              }}>
                {t.home.cta2Btn}
              </Link>
              <Link href="/cars" className="r-btn r-btn-ghost" style={{ fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                {t.home.cta2Link}
              </Link>
            </div>
          </div>

          {/* Mini car grid 2x2 */}
          <div className="grid grid-cols-2 gap-3 anim-up" style={{ animationDelay: "0.15s" }}>
            {FEATURED.slice(0, 4).map((car) => {
              const img = getCarImageUrl(car)
              return (
                <Link key={car.id} href={`/tune?car=${car.id}`} className="fh6-card group" style={{ aspectRatio: "16/10" }}>
                  <div style={{ position: "relative", width: "100%", height: "100%", background: "#0f1215" }}>
                    {img && (
                      <Image src={img} alt={`${car.brand} ${car.model}`} fill sizes="(max-width:768px) 50vw, 25vw"
                        style={{ objectFit: "contain", padding: 10 }} />
                    )}
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 55%)",
                    }} />
                    <div style={{ position: "absolute", bottom: 8, left: 10, right: 10 }}>
                      <p style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>{car.brand}</p>
                      <p style={{ fontSize: 11, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>{car.model}</p>
                    </div>
                    <span className={`badge-class badge-${car.base_class}`} style={{ position: "absolute", top: 7, right: 7, fontSize: 9 }}>
                      {car.base_class}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <div className="fh6-divider" />

      {/* ════════════════════════════════════════════════════════
          FEATURES — 6 cards
          ════════════════════════════════════════════════════════ */}
      <section style={{ background: "var(--bg-surface)", position: "relative", overflow: "hidden" }}>
        <div className="origami-bl" aria-hidden="true" style={{ opacity: 0.08 }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 space-y-10">
          <div className="space-y-2 anim-up">
            <p className="fh6-eyebrow">{lang === "pt" ? "O que você encontra aqui" : "What you'll find here"}</p>
            <h2 style={{ fontSize: "clamp(1.75rem,3.5vw,2.5rem)", fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", textTransform: "uppercase" }}>
              {lang === "pt" ? "Ferramentas para quem leva a sério." : "Tools for those who take it seriously."}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <Link key={f.href} href={f.href} className="fh6-card block anim-up" style={{ animationDelay: `${i * 75}ms` }}>
                <div className="fh6-card-inner space-y-4">
                  <div className="flex items-start justify-between">
                    <span className="mono-val" style={{ fontSize: 28, color: f.color, opacity: 0.35, lineHeight: 1 }}>
                      {f.num}
                    </span>
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ color: f.color, opacity: 0.7, marginTop: 2 }}>
                      <path d="M2 7.5h11M8 3l4.5 4.5L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.01em" }}>{f.title}</p>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.65 }}>{f.body}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="fh6-divider" />

      {/* ════════════════════════════════════════════════════════
          JDM CAROUSEL
          ════════════════════════════════════════════════════════ */}
      <section style={{ background: "var(--bg-base)", paddingTop: 64, paddingBottom: 0 }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 pb-8">
          <div className="flex items-end justify-between flex-wrap gap-4 anim-up">
            <div className="space-y-1">
              <p className="fh6-eyebrow">{lang === "pt" ? "JDM · O Japão na garagem" : "JDM · Japan in your garage"}</p>
              <h2 style={{ fontSize: "clamp(1.75rem,3.5vw,2.5rem)", fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", textTransform: "uppercase" }}>
                {lang === "pt" ? "Lendas do Japão." : "Japanese Legends."}
              </h2>
            </div>
            <Link href="/cars?type=street" style={{
              fontSize: 11, fontWeight: 700, color: "var(--fh6-teal)",
              letterSpacing: "0.1em", textTransform: "uppercase",
              display: "flex", alignItems: "center", gap: 6, textDecoration: "none",
            }}>
              {lang === "pt" ? "Ver todos os 618 carros" : "See all 618 cars"}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>

        <JDMCarousel />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURED.map((car, i) => (
              <CarCard key={car.id} car={car} index={i} />
            ))}
          </div>
        </div>
      </section>

      <div className="fh6-divider" />

      {/* ════════════════════════════════════════════════════════
          FINAL CTA
          ════════════════════════════════════════════════════════ */}
      <section style={{ background: "var(--bg-surface)", position: "relative", overflow: "hidden" }}>
        <div className="origami-tr" aria-hidden="true" style={{ opacity: 0.08 }} />
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 60% 80% at 50% 100%, rgba(44,206,204,0.08) 0%, transparent 60%)",
        }} />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-24 text-center space-y-8">
          <div className="space-y-4 anim-up">
            <p className="fh6-eyebrow" style={{ display: "block" }}>
              {lang === "pt" ? "Sem improviso" : "No guesswork"}
            </p>
            <h2 className="fh6-headline" style={{ fontSize: "clamp(2.5rem,6vw,4.5rem)" }}>
              {lang === "pt" ? <>Pronto pra<br /><span className="fh6-headline-accent">largar.</span></> : <>Ready to<br /><span className="fh6-headline-accent">race.</span></>}
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-muted)", maxWidth: 460, margin: "0 auto", lineHeight: 1.75 }}>
              {lang === "pt"
                ? "Sem IA inventando números. Cada valor saiu da combinação de carro, classe e tipo de prova — calculado pelo motor de regras."
                : "No AI making up numbers. Every value comes from the combination of car, class, and race type — calculated by the rule engine."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center anim-up" style={{ animationDelay: "0.1s" }}>
            <Link href="/tune" className="r-btn" style={{
              paddingLeft: 40, paddingRight: 40, paddingTop: 15, paddingBottom: 15,
              background: "var(--fh6-teal)", color: "#000", border: "none",
              fontWeight: 900, fontSize: 14, letterSpacing: "0.06em", textTransform: "uppercase",
              boxShadow: "0 6px 28px rgba(44,206,204,0.4)",
            }}>
              {t.home.heroCta}
            </Link>
            <Link href="/diagnostics" className="r-btn" style={{
              paddingLeft: 32, paddingRight: 32, paddingTop: 15, paddingBottom: 15,
              background: "transparent", color: "var(--text)",
              border: "1px solid var(--border-strong)",
              fontWeight: 700, fontSize: 14, letterSpacing: "0.04em", textTransform: "uppercase",
            }}>
              {lang === "pt" ? "Diagnosticar" : "Diagnose"}
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 pt-2 anim-up" style={{ animationDelay: "0.2s" }}>
            {[
              { href: "/cars",    label: lang === "pt" ? "Banco de Carros" : "Car Database" },
              { href: "/meta",    label: lang === "pt" ? "Ranking" : "Ranking" },
              { href: "/compare", label: lang === "pt" ? "Comparar" : "Compare" },
              { href: "/garage",  label: lang === "pt" ? "Garagem" : "Garage" },
            ].map(({ href, label }, i) => (
              <span key={href} className="flex items-center gap-5">
                {i > 0 && <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--border-strong)", display: "inline-block" }} />}
                <Link href={href} style={{ fontSize: 10, color: "var(--text-subtle)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none" }}>
                  {label}
                </Link>
              </span>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
