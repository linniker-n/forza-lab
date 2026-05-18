import Image from "next/image"
import Link from "next/link"
import { CARS, FANDOM_SOURCE_URL, getCarImageUrl } from "@/data/cars"
import { CarCard } from "@/components/cars/CarCard"

const HERO_CAR = CARS.find((c) => c.id === "lamborghini_revuelto_2024") ?? CARS[0]

const TUNE_TYPES = [
  { label: "Rua",     slug: "street",        cls: "tag-street" },
  { label: "Drag",    slug: "drag",           cls: "tag-drag" },
  { label: "Drift",   slug: "drift",          cls: "tag-drift" },
  { label: "Rally",   slug: "rally",          cls: "tag-rally" },
  { label: "Off-Road",slug: "cross_country",  cls: "tag-cross_country" },
  { label: "Top Speed",slug:"top_speed",      cls: "tag-top_speed" },
  { label: "Grip",    slug: "grip",           cls: "tag-grip" },
]

const STATS = [
  { val: String(CARS.length), label: "Carros FH6" },
  { val: "7",     label: "Tipos de tune" },
  { val: "8",     label: "Diagnósticos" },
  { val: "100%",  label: "Motor de regras" },
]

const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7" stroke="#3b82f6" strokeWidth="1.5"/>
        <path d="M7 10l2 2 4-4" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Gerador de Tune",
    desc: "Selecione carro, classe e objetivo. Receba peças, câmbio, suspensão e diferencial calculados.",
    href: "/tune",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 3v4M10 13v4M3 10h4M13 10h4" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="10" cy="10" r="3" stroke="#f59e0b" strokeWidth="1.5"/>
      </svg>
    ),
    title: "Diagnóstico",
    desc: "Carro saindo de frente? Traseira escapando? Receba correções técnicas com parâmetros exatos.",
    href: "/diagnostics",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="8" width="14" height="9" rx="2" stroke="#10b981" strokeWidth="1.5"/>
        <path d="M6 8V6a4 4 0 018 0v2" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Banco de Carros",
    desc: "Lista sincronizada do Forza Wiki com fichas técnicas, scores por categoria e filtros avançados.",
    href: "/cars",
  },
]

const FEATURED_IDS = [
  "lamborghini_revuelto_2024",
  "koenigsegg_jesko_2020",
  "toyota_gr_yaris_2020",
  "nissan_skyline_gt_r_v_spec_1997_1997",
]

const FEATURED = FEATURED_IDS
  .map((id) => CARS.find((car) => car.id === id))
  .filter((car): car is (typeof CARS)[number] => Boolean(car))

export default function HomePage() {
  const heroImg = getCarImageUrl(HERO_CAR)

  return (
    <div className="dot-grid" style={{ minHeight: "100dvh" }}>

      {/* ══════════════════════════════════════════════
          HERO — full-bleed cinematic
         ══════════════════════════════════════════════ */}
      <section
        className="speed-lines relative overflow-hidden"
        style={{
          minHeight: "90dvh",
          background: "linear-gradient(135deg, #04080f 0%, #06101e 50%, #07121f 100%)",
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* Radial glow behind car */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 55% 65% at 68% 55%, rgba(37,99,235,0.13) 0%, transparent 70%)",
          }}
        />
        {/* Bottom fade to dot-grid */}
        <div
          className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, #04080f)" }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 w-full py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

          {/* ── Left — copy ── */}
          <div className="space-y-7 anim-up">
            {/* Live badge */}
            <div className="flex items-center gap-2.5">
              <span className="live-dot" />
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                FORZA HORIZON 6 · MOTOR DE REGRAS COMPETITIVO
              </span>
            </div>

            {/* H1 */}
            <h1
              style={{
                fontSize: "clamp(2.4rem, 5.5vw, 4rem)",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                lineHeight: 1.0,
                color: "var(--text)",
              }}
            >
              Tunes geradas<br />
              por{" "}
              <span style={{ color: "var(--blue-bright)" }}>lógica</span>
              <br />
              competitiva.
            </h1>

            <p style={{ fontSize: 15, color: "var(--text-muted)", maxWidth: 420, lineHeight: 1.65 }}>
              Motor de regras baseado em física real do Forza. Selecione carro, classe e estilo —
              receba peças, ajustes finos e diagnóstico completo.
            </p>

            {/* CTA row */}
            <div className="flex flex-wrap gap-3">
              <Link href="/tune" className="r-btn r-btn-primary" style={{ paddingLeft: 28, paddingRight: 28, paddingTop: 10, paddingBottom: 10 }}>
                Criar Tune agora
              </Link>
              <Link href="/diagnostics" className="r-btn r-btn-ghost" style={{ paddingLeft: 22, paddingRight: 22, paddingTop: 10, paddingBottom: 10 }}>
                Diagnosticar problema
              </Link>
            </div>

            {/* Tune type tags */}
            <div className="flex flex-wrap gap-2">
              {TUNE_TYPES.map((t) => (
                <Link key={t.slug} href={`/tune?type=${t.slug}`} className={`inline-tag ${t.cls}`}>
                  {t.label}
                </Link>
              ))}
            </div>
          </div>

          {/* ── Right — car image ── */}
          <div className="relative anim-up" style={{ animationDelay: "0.15s" }}>
            {/* Card container */}
            <div
              className="r-card bracket overflow-hidden"
              style={{
                aspectRatio: "16/10",
                background: "linear-gradient(135deg, #0a1428 0%, #0c1830 100%)",
                position: "relative",
              }}
            >
              {heroImg && (
                <Image
                  src={heroImg}
                  alt={`${HERO_CAR.brand} ${HERO_CAR.model}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="hero-car-render"
                  style={{ objectFit: "contain", padding: "24px" }}
                  priority
                />
              )}

              {/* Bottom info bar */}
              <div
                className="absolute inset-x-0 bottom-0 px-5 py-3"
                style={{
                  background: "linear-gradient(to top, rgba(6,12,24,0.96) 0%, rgba(6,12,24,0.5) 70%, transparent 100%)",
                }}
              >
                <div className="flex items-end justify-between">
                  <div>
                    <p style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      {HERO_CAR.brand} · {HERO_CAR.year}
                    </p>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em" }}>
                      {HERO_CAR.model}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge-class badge-${HERO_CAR.base_class}`}>{HERO_CAR.base_class}</span>
                    <span className="badge-class" style={{ color: "var(--amber)", background: "rgba(245,158,11,0.12)", borderColor: "rgba(245,158,11,0.3)" }}>
                      {HERO_CAR.power_hp} HP
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating chips */}
            <div
              className="absolute -top-3 -right-3 hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-strong)" }}
            >
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Potência</span>
              <span className="mono-val" style={{ fontSize: 13, color: "var(--blue-bright)" }}>{HERO_CAR.power_hp} HP</span>
            </div>
            <div
              className="absolute -bottom-3 -left-3 hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-strong)" }}
            >
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Tração</span>
              <span className="mono-val" style={{ fontSize: 13, color: "var(--green)" }}>{HERO_CAR.drivetrain}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          STATS BAR
         ══════════════════════════════════════════════ */}
      <div style={{ borderTop: "1px solid var(--border-strong)", borderBottom: "1px solid var(--border-strong)", background: "var(--bg-surface)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 grid grid-cols-2 md:grid-cols-4 divide-x" style={{ borderColor: "var(--border-strong)" }}>
          {STATS.map((s, i) => (
            <div key={s.label} className="flex flex-col items-center py-2 px-4 anim-up" style={{ animationDelay: `${i * 80}ms` }}>
              <span className="mono-val" style={{ fontSize: 22, color: "var(--blue-bright)" }}>{s.val}</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          FEATURES — 3 cards com bracket
         ══════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 space-y-10">
        <div className="space-y-2 anim-up">
          <p className="section-label">Funcionalidades</p>
          <h2 className="page-title">O que o app faz</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <Link
              key={f.href}
              href={f.href}
              className="r-card bracket block p-6 space-y-4 group anim-up"
              style={{ animationDelay: `${i * 100}ms`, textDecoration: "none" }}
            >
              <div className="flex items-center justify-between">
                <div
                  className="w-10 h-10 flex items-center justify-center rounded-lg"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-strong)" }}
                >
                  {f.icon}
                </div>
                <svg
                  width="16" height="16" viewBox="0 0 16 16" fill="none"
                  className="transition-transform group-hover:translate-x-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{f.title}</p>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          HOW IT WORKS — numbered steps
         ══════════════════════════════════════════════ */}
      <section style={{ borderTop: "1px solid var(--border-strong)", background: "var(--bg-surface)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 space-y-10">
          <p className="section-label">Processo</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { n: "01", title: "Escolha o carro",      desc: `Busque por marca, modelo ou ano entre ${CARS.length} carros do FH6.` },
              { n: "02", title: "Defina o objetivo",     desc: "Rua, drift, rally, drag, top speed ou grip." },
              { n: "03", title: "Configure",             desc: "Classe alvo, tração, dificuldade e tipo de controle." },
              { n: "04", title: "Receba a tune",         desc: "Peças, pneus, câmbio, alinhamento e diferencial." },
            ].map((s, i) => (
              <div
                key={s.n}
                className="r-card p-5 space-y-3 anim-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className="mono-val" style={{ fontSize: 28, color: "rgba(37,99,235,0.3)" }}>{s.n}</span>
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{s.title}</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FEATURED CARS
         ══════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 space-y-8">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <p className="section-label">Destaques</p>
            <h2 className="page-title">Carros em evidência</h2>
            <a href={FANDOM_SOURCE_URL} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Fonte: Forza Wiki
            </a>
          </div>
          <Link href="/cars" className="r-btn r-btn-ghost" style={{ fontSize: 12 }}>
            Ver todos →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURED.map((car, i) => (
            <CarCard key={car.id} car={car} index={i} />
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          CTA FINAL
         ══════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div
          className="r-card bracket p-10 md:p-14 grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
          style={{ background: "linear-gradient(135deg, #090f1e 0%, #0b1428 100%)" }}
        >
          <div className="space-y-3">
            <h2 className="page-title">Pronto para tunar?</h2>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.65, maxWidth: 380 }}>
              Cada ajuste é calculado pelo perfil do carro e tipo de prova —
              não por IA gerando valores aleatórios.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 md:justify-end">
            <Link href="/tune" className="r-btn r-btn-primary" style={{ paddingLeft: 32, paddingRight: 32, paddingTop: 11, paddingBottom: 11 }}>
              Criar tune agora
            </Link>
            <Link href="/diagnostics" className="r-btn r-btn-ghost" style={{ paddingLeft: 24, paddingRight: 24 }}>
              Diagnosticar
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
