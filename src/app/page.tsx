import Image from "next/image"
import Link from "next/link"
import { CARS, getCarImageUrl } from "@/data/cars"
import { CarCard } from "@/components/cars/CarCard"

/* ── Carros JDM em destaque (FH6 = ambientado no Japão) ── */
const HERO_CAR  = CARS.find((c) => c.id === "nissan_gtr_nismo_2024")
               ?? CARS.find((c) => c.id === "nissan_gtr_2017")
               ?? CARS[0]

const FEATURED  = CARS.filter((c) =>
  ["toyota_gr_supra_2021", "nissan_skyline_r34_1999", "mazda_rx7_fd_1997",
   "honda_nsx_1991", "subaru_impreza_wrx_sti_2004", "mitsubishi_lancer_evo_ix_2006"].includes(c.id)
).slice(0, 6)

const TUNE_TYPES = [
  { slug: "street",        label: "Rua",         icon: "↗", color: "#60a5fa", cls: "tag-street" },
  { slug: "drag",          label: "Arrancada",   icon: "→", color: "#fbbf24", cls: "tag-drag" },
  { slug: "drift",         label: "Drift",       icon: "↺", color: "#fb923c", cls: "tag-drift" },
  { slug: "rally",         label: "Rally",       icon: "◎", color: "#34d399", cls: "tag-rally" },
  { slug: "cross_country", label: "Off-Road",    icon: "▲", color: "#c084fc", cls: "tag-cross_country" },
  { slug: "top_speed",     label: "Top Speed",   icon: "⇒", color: "#fcd34d", cls: "tag-top_speed" },
  { slug: "grip",          label: "Grip",        icon: "⊙", color: "#818cf8", cls: "tag-grip" },
]

const FEATURES = [
  {
    num: "01",
    title: "Gerador de Tune",
    body: "Selecione carro, classe e tipo de prova. O motor de regras calcula peças, câmbio, suspensão, diferencial e alinhamento.",
    href: "/tune",
    color: "#2ccecc",
  },
  {
    num: "02",
    title: "Diagnóstico",
    body: "Carro saindo de frente? Traseira escapando? Escolha o sintoma e receba correções técnicas com parâmetros exatos.",
    href: "/diagnostics",
    color: "#d4278a",
  },
  {
    num: "03",
    title: "618 Carros",
    body: "Banco completo sincronizado do Forza Wiki com fichas técnicas, scores por categoria e filtros avançados.",
    href: "/cars",
    color: "#2ccecc",
  },
  {
    num: "04",
    title: "Ranking Meta",
    body: "Ranking técnico derivado dos atributos oficiais de cada carro. Filtre por classe e tipo de prova.",
    href: "/meta",
    color: "#d4278a",
  },
  {
    num: "05",
    title: "Comparador",
    body: "Compare dois carros lado a lado por velocidade, handling, aceleração, torque e peso antes de gerar o setup.",
    href: "/compare",
    color: "#2ccecc",
  },
  {
    num: "06",
    title: "Garagem",
    body: "Salve suas tunes com a conta e acesse em qualquer dispositivo. Sincronização em tempo real via Firebase.",
    href: "/garage",
    color: "#d4278a",
  },
]

export default function HomePage() {
  const heroImg = getCarImageUrl(HERO_CAR)

  return (
    <>
      {/* ════════════════════════════════════════════════════════
          HERO — full-viewport, estilo forza.net/forzahorizon6
          ════════════════════════════════════════════════════════ */}
      <section className="fh6-hero">
        {/* Origami shapes decorativos */}
        <div className="origami-tr" aria-hidden="true" />
        <div className="origami-bl" aria-hidden="true" />

        {/* Glow radial atrás do carro */}
        <div className="fh6-car-glow" aria-hidden="true" />

        {/* Gradiente atmosférico */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse 80% 60% at 50% 110%, rgba(44,206,204,0.07) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />

        {/* ── Car image — full background ── */}
        {heroImg && (
          <div
            style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "relative",
                width: "100%", maxWidth: 1100,
                height: "70%",
                marginLeft: "auto",
                right: "-4%",
              }}
            >
              <Image
                src={heroImg}
                alt={`${HERO_CAR.brand} ${HERO_CAR.model}`}
                fill
                sizes="100vw"
                style={{ objectFit: "contain", objectPosition: "center right", filter: "brightness(1.05) contrast(1.02) drop-shadow(0 20px 60px rgba(44,206,204,0.12))" }}
                priority
              />
            </div>
          </div>
        )}

        {/* Gradient bottom overlay para legibilidade do texto */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 35%, rgba(0,0,0,0.1) 65%, transparent 100%)",
            pointerEvents: "none",
          }}
        />

        {/* ── Hero content — bottom-left, estilo FH6 ── */}
        <div
          className="relative max-w-7xl mx-auto px-4 sm:px-6 pb-14 pt-32 w-full"
          style={{ zIndex: 2 }}
        >
          <div className="max-w-2xl space-y-6 anim-up">

            {/* Japan pill — referência direta ao FH6 */}
            <div className="japan-pill">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2"/>
                <circle cx="5" cy="5" r="2" fill="currentColor"/>
              </svg>
              Forza Horizon 6 · Japan
            </div>

            {/* Headline bold uppercase */}
            <h1 className="fh6-headline">
              O Japan{" "}
              <span className="fh6-headline-accent">Aguarda.</span>
              <br />
              Tune o seu<br />
              <span style={{ color: "rgba(255,255,255,0.55)" }}>Legado.</span>
            </h1>

            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", maxWidth: 480, lineHeight: 1.65 }}>
              Motor de regras competitivo para Forza Horizon 6.
              Peças, ajustes finos, diagnóstico e ranking — tudo calculado pelo perfil real do carro.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/tune"
                className="r-btn"
                style={{
                  paddingLeft: 32, paddingRight: 32, paddingTop: 13, paddingBottom: 13,
                  background: "var(--fh6-teal)",
                  color: "#000",
                  border: "none",
                  fontWeight: 800,
                  fontSize: 13,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  boxShadow: "0 4px 20px rgba(44,206,204,0.35)",
                }}
              >
                Criar Tune
              </Link>
              <Link
                href="/cars"
                className="r-btn"
                style={{
                  paddingLeft: 28, paddingRight: 28, paddingTop: 13, paddingBottom: 13,
                  background: "transparent",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.25)",
                  fontWeight: 700,
                  fontSize: 13,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                Ver Carros
              </Link>
            </div>

            {/* Tune type pills */}
            <div className="flex flex-wrap gap-2 pt-1">
              {TUNE_TYPES.map((t) => (
                <Link key={t.slug} href={`/tune?type=${t.slug}`} className={`inline-tag ${t.cls}`}>
                  {t.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Car info chip */}
          <div
            className="absolute right-4 sm:right-6 bottom-14 hidden lg:flex items-center gap-3 px-4 py-3 rounded-sm anim-up"
            style={{
              background: "rgba(0,0,0,0.75)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(12px)",
              animationDelay: "0.3s",
            }}
          >
            <div>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                {HERO_CAR.brand} · {HERO_CAR.year}
              </p>
              <p style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{HERO_CAR.model}</p>
            </div>
            <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.12)" }} />
            <div>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Potência</p>
              <p style={{ fontSize: 13, fontWeight: 800, color: "var(--fh6-teal)", fontFamily: "var(--font-geist-mono)" }}>{HERO_CAR.power_hp} HP</p>
            </div>
            <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.12)" }} />
            <span className={`badge-class badge-${HERO_CAR.base_class}`} style={{ fontSize: 11 }}>
              {HERO_CAR.base_class} · {HERO_CAR.base_pi} PI
            </span>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="scroll-indicator absolute bottom-5 left-1/2 -translate-x-1/2"
          style={{ zIndex: 2, opacity: 0.4 }}
        >
          <svg width="16" height="22" viewBox="0 0 16 22" fill="none">
            <rect x="1" y="1" width="14" height="20" rx="7" stroke="white" strokeWidth="1.2"/>
            <rect x="7" y="4" width="2" height="5" rx="1" fill="white"/>
          </svg>
        </div>
      </section>

      {/* FH6 teal divider */}
      <div className="fh6-divider" />

      {/* ════════════════════════════════════════════════════════
          STATS BAR — números do app
          ════════════════════════════════════════════════════════ */}
      <section
        style={{
          background: "#000",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4"
          style={{ borderLeft: "1px solid rgba(255,255,255,0.06)" }}
        >
          {[
            { val: "618",  label: "Carros do FH6" },
            { val: "7",    label: "Tipos de tune" },
            { val: "100%", label: "Motor de regras" },
            { val: "FH6",  label: "Forza Horizon 6" },
          ].map((s, i) => (
            <div
              key={s.label}
              className="fh6-stat anim-up"
              style={{
                animationDelay: `${i * 80}ms`,
                borderRight: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <span className="fh6-stat-val">{s.val}</span>
              <span className="fh6-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          JAPAN SECTION — "O Japan Aguarda" — estilo FH6
          ════════════════════════════════════════════════════════ */}
      <section
        style={{
          background: "#050505",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="origami-tr" aria-hidden="true" style={{ opacity: 0.04 }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div className="space-y-6 anim-up">
            <p className="fh6-eyebrow">Bem-vindo ao Horizon Festival</p>
            <h2 style={{ fontSize: "clamp(2rem,4vw,3.2rem)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.05, color: "#fff", textTransform: "uppercase" }}>
              O Japão como<br />você nunca<br />
              <span style={{ color: "var(--fh6-teal)" }}>dirigiu.</span>
            </h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.75, maxWidth: 460 }}>
              Forza Horizon 6 leva você ao Japão — de Tóquio às estradas de montanha. Com 618 carros
              e um motor de regras baseado em física real, o Forza Tune Lab gera a tune perfeita
              para cada carro, classe e tipo de prova.
            </p>
            <div className="flex gap-3">
              <Link
                href="/tune"
                className="r-btn"
                style={{
                  background: "var(--fh6-teal)", color: "#000",
                  border: "none", fontWeight: 800, fontSize: 12,
                  letterSpacing: "0.06em", textTransform: "uppercase",
                  paddingLeft: 24, paddingRight: 24, paddingTop: 11, paddingBottom: 11,
                }}
              >
                Gerar tune agora
              </Link>
              <Link
                href="/cars"
                className="r-btn r-btn-ghost"
                style={{ fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase" }}
              >
                Ver todos os carros
              </Link>
            </div>
          </div>

          {/* Right — mini car grid */}
          <div className="grid grid-cols-2 gap-3 anim-up" style={{ animationDelay: "0.15s" }}>
            {FEATURED.slice(0, 4).map((car) => {
              const img = getCarImageUrl(car)
              return (
                <Link
                  key={car.id}
                  href={`/tune?car=${car.id}`}
                  className="fh6-card group"
                  style={{ aspectRatio: "16/10" }}
                >
                  <div style={{ position: "relative", width: "100%", height: "100%", background: "#0a0a0a" }}>
                    {img && (
                      <Image
                        src={img}
                        alt={`${car.brand} ${car.model}`}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="car-render"
                        style={{ objectFit: "contain", padding: 10 }}
                      />
                    )}
                    <div
                      style={{
                        position: "absolute", inset: 0,
                        background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)",
                      }}
                    />
                    <div style={{ position: "absolute", bottom: 8, left: 10, right: 10 }}>
                      <p style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                        {car.brand}
                      </p>
                      <p style={{ fontSize: 11, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>{car.model}</p>
                    </div>
                    <span className={`badge-class badge-${car.base_class}`} style={{ position: "absolute", top: 8, right: 8, fontSize: 9 }}>
                      {car.base_class}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* FH6 teal divider */}
      <div className="fh6-divider" />

      {/* ════════════════════════════════════════════════════════
          FUNCIONALIDADES — 6 cards estilo FH6 feature grid
          ════════════════════════════════════════════════════════ */}
      <section style={{ background: "#000", position: "relative", overflow: "hidden" }}>
        <div className="origami-bl" aria-hidden="true" style={{ opacity: 0.04 }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 space-y-10">
          <div className="space-y-2 anim-up">
            <p className="fh6-eyebrow">O que o app faz</p>
            <h2 style={{ fontSize: "clamp(1.75rem,3.5vw,2.5rem)", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", textTransform: "uppercase" }}>
              Ferramentas para pilotos.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: "rgba(255,255,255,0.06)" }}>
            {FEATURES.map((f, i) => (
              <Link
                key={f.href}
                href={f.href}
                className="fh6-card anim-up"
                style={{
                  borderRadius: 0,
                  border: "none",
                  animationDelay: `${i * 80}ms`,
                  background: "#000",
                }}
              >
                <div className="fh6-card-inner space-y-3">
                  <div className="flex items-start justify-between">
                    <span
                      style={{
                        fontSize: 32,
                        fontWeight: 900,
                        fontFamily: "var(--font-geist-mono)",
                        color: f.color,
                        opacity: 0.3,
                        lineHeight: 1,
                      }}
                    >
                      {f.num}
                    </span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: f.color, opacity: 0.6, marginTop: 4 }}>
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>{f.title}</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>{f.body}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FH6 teal divider */}
      <div className="fh6-divider" />

      {/* ════════════════════════════════════════════════════════
          JDM SHOWCASE — carros japoneses em destaque
          ════════════════════════════════════════════════════════ */}
      <section style={{ background: "#050505" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 space-y-8">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div className="space-y-1 anim-up">
              <p className="fh6-eyebrow">Carros em destaque</p>
              <h2 style={{ fontSize: "clamp(1.75rem,3.5vw,2.5rem)", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", textTransform: "uppercase" }}>
                Lendas do Japão.
              </h2>
            </div>
            <Link
              href="/cars"
              style={{
                fontSize: 11, fontWeight: 700, color: "var(--fh6-teal)",
                letterSpacing: "0.1em", textTransform: "uppercase",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              Ver todos os 618 carros
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURED.map((car, i) => (
              <CarCard key={car.id} car={car} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* FH6 teal divider */}
      <div className="fh6-divider" />

      {/* ════════════════════════════════════════════════════════
          CTA FINAL — estilo forza.net pre-order section
          ════════════════════════════════════════════════════════ */}
      <section
        style={{
          background: "#000",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="origami-tr" aria-hidden="true" style={{ opacity: 0.05 }} />
        <div
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse 60% 80% at 50% 100%, rgba(44,206,204,0.07) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-24 text-center space-y-8">
          <div className="space-y-4 anim-up">
            <p className="fh6-eyebrow" style={{ display: "block" }}>Pronto para o asfalto</p>
            <h2 className="fh6-headline" style={{ fontSize: "clamp(2.5rem,6vw,5rem)" }}>
              Tune o seu<br />
              <span className="fh6-headline-accent">Carro Agora.</span>
            </h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
              Motor de regras — não IA aleatória. Cada ajuste calculado pelo perfil
              real do carro, tipo de prova e classe alvo.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center anim-up" style={{ animationDelay: "0.1s" }}>
            <Link
              href="/tune"
              className="r-btn"
              style={{
                paddingLeft: 40, paddingRight: 40, paddingTop: 15, paddingBottom: 15,
                background: "var(--fh6-teal)", color: "#000",
                border: "none", fontWeight: 900, fontSize: 14,
                letterSpacing: "0.06em", textTransform: "uppercase",
                boxShadow: "0 6px 28px rgba(44,206,204,0.4)",
              }}
            >
              Criar Tune
            </Link>
            <Link
              href="/diagnostics"
              className="r-btn"
              style={{
                paddingLeft: 32, paddingRight: 32, paddingTop: 15, paddingBottom: 15,
                background: "transparent", color: "#fff",
                border: "1px solid rgba(255,255,255,0.2)",
                fontWeight: 700, fontSize: 14,
                letterSpacing: "0.04em", textTransform: "uppercase",
              }}
            >
              Diagnosticar
            </Link>
          </div>

          {/* Platform-style links — como o forza.net tem links para Xbox/PS/Steam */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 anim-up" style={{ animationDelay: "0.2s" }}>
            <Link href="/cars"    style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none" }}>Banco de Carros</Link>
            <span style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "inline-block" }} />
            <Link href="/meta"    style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none" }}>Ranking Meta</Link>
            <span style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "inline-block" }} />
            <Link href="/compare" style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none" }}>Comparador</Link>
            <span style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "inline-block" }} />
            <Link href="/garage"  style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none" }}>Garagem</Link>
          </div>
        </div>
      </section>
    </>
  )
}
