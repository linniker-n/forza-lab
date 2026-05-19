import Image from "next/image"
import Link from "next/link"
import { CARS, getCarImageUrl } from "@/data/cars"
import { CarCard } from "@/components/cars/CarCard"
import { JDMCarousel } from "@/components/home/JDMCarousel"

/* Carro capa oficial FH6 */
const HERO_CAR = CARS.find((c) => c.id === "gr_gt_prototype_2025")
              ?? CARS.find((c) => c.id === "toyota_gr_supra_2020")
              ?? CARS[0]

/* Carros destaque JDM para o bloco estático abaixo do carrossel */
const FEATURED = CARS.filter((c) =>
  ["toyota_gr_supra_2020", "honda_nsx_r_1992_1992", "lexus_lfa_2010",
   "mazda_furai_2008", "subaru_brz_2022_2022", "acura_nsx_type_s_2022"].includes(c.id)
)

const TUNE_TYPES = [
  { slug: "street",        label: "Rua",         cls: "tag-street" },
  { slug: "drag",          label: "Arrancada",   cls: "tag-drag" },
  { slug: "drift",         label: "Drift",       cls: "tag-drift" },
  { slug: "rally",         label: "Rally",       cls: "tag-rally" },
  { slug: "cross_country", label: "Off-Road",    cls: "tag-cross_country" },
  { slug: "top_speed",     label: "Top Speed",   cls: "tag-top_speed" },
  { slug: "grip",          label: "Grip",        cls: "tag-grip" },
]

const FEATURES = [
  {
    num: "01",
    title: "Gerador de Tune",
    body: "Escolha o carro, a classe e onde você vai correr. O app devolve peças, câmbio, suspensão, diferencial e alinhamento calculados do zero.",
    href: "/tune",
    color: "var(--fh6-teal)",
  },
  {
    num: "02",
    title: "Diagnóstico",
    body: "Carro empurrando pra fora na curva? Traseira soltando? Descreva o problema — o app diz o que mexer e quanto.",
    href: "/diagnostics",
    color: "var(--fh6-pink)",
  },
  {
    num: "03",
    title: "618 Carros",
    body: "Todo carro confirmado do FH6 com ficha técnica, scores por uso e filtros por classe, tração e tipo de prova.",
    href: "/cars",
    color: "var(--fh6-teal)",
  },
  {
    num: "04",
    title: "Ranking por Contexto",
    body: "Qual carro domina drift na Classe A? Qual hypercar acelera mais em X? O ranking responde pela prova certa, não pela classe genérica.",
    href: "/meta",
    color: "var(--fh6-pink)",
  },
  {
    num: "05",
    title: "Comparador",
    body: "Antes de gastar PI no setup errado, compare dois carros pelo que importa pra sua prova: velocidade, handling, torque, peso.",
    href: "/compare",
    color: "var(--fh6-teal)",
  },
  {
    num: "06",
    title: "Garagem",
    body: "Salve o setup, abra no celular no meio da corrida. Tunes na conta, com cópia local no navegador — sem depender de conexão.",
    href: "/garage",
    color: "var(--fh6-pink)",
  },
]

export default function HomePage() {
  const heroCarImg = getCarImageUrl(HERO_CAR)

  return (
    <>
      {/* ════════════════════════════════════════════════════════
          HERO — vídeo keyart FH6 + carro capa sobreposto
          ════════════════════════════════════════════════════════ */}
      <section className="fh6-hero">

        {/* Vídeo fundo */}
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
          <source src="/hero.webm" type="video/webm" />
        </video>

        {/* Overlay progressivo — legibilidade do texto */}
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 38%, rgba(0,0,0,0.15) 70%, transparent 100%)",
        }} />
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.25) 55%, transparent 100%)",
        }} />

        {/* Carro capa — GR GT Prototype sobreposto à direita */}
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

        {/* Conteúdo — esquerda, verticalmente centralizado */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 w-full flex flex-col justify-center" style={{ zIndex: 2, flex: 1, paddingBottom: 80 }}>
          <div className="max-w-xl space-y-6 anim-up">

            <h1
              className="fh6-headline"
              style={{ fontSize: "clamp(2.2rem, 5.5vw, 5.5rem)" }}
            >
              <span style={{ whiteSpace: "nowrap" }}>O JAPÃO TE</span>{" "}
              <span className="fh6-headline-accent" style={{ whiteSpace: "nowrap" }}>AGUARDA,</span><br />
              TUNE E<br />
              <span style={{ color: "rgba(255,255,255,0.45)" }}>ACELERE.</span>
            </h1>

            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", maxWidth: 440, lineHeight: 1.7 }}>
              Seu assistente de tunagem. Agora você terá total liberdade com seus carros.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/tune" className="r-btn" style={{
                paddingLeft: 32, paddingRight: 32, paddingTop: 13, paddingBottom: 13,
                background: "var(--fh6-teal)", color: "#000", border: "none",
                fontWeight: 800, fontSize: 13, letterSpacing: "0.05em", textTransform: "uppercase",
                boxShadow: "0 4px 20px rgba(44,206,204,0.35)",
              }}>
                Criar Tune
              </Link>
              <Link href="/cars" className="r-btn" style={{
                paddingLeft: 28, paddingRight: 28, paddingTop: 13, paddingBottom: 13,
                background: "transparent", color: "#fff",
                border: "1px solid rgba(255,255,255,0.3)",
                fontWeight: 700, fontSize: 13, letterSpacing: "0.04em", textTransform: "uppercase",
              }}>
                Ver Carros
              </Link>
            </div>
          </div>

          {/* Car info chip bottom-right */}
          <div className="absolute right-4 sm:right-6 bottom-14 hidden lg:flex items-center gap-3 px-4 py-3 rounded anim-up" style={{
            background: "rgba(0,0,0,0.8)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(16px)",
            animationDelay: "0.35s",
          }}>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 divide-x" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          {[
            { val: "618",  label: "Carros do FH6" },
            { val: "7",    label: "Tipos de tune" },
            { val: "8",    label: "Diagnósticos" },
            { val: "100%", label: "Motor de regras" },
          ].map((s, i) => (
            <div key={s.label} className="fh6-stat anim-up" style={{ animationDelay: `${i * 80}ms` }}>
              <span className="fh6-stat-val">{s.val}</span>
              <span className="fh6-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          JAPAN — "Tokyo. Nikko. Hokkaido."
          ════════════════════════════════════════════════════════ */}
      <section style={{ background: "var(--bg-base)", position: "relative", overflow: "hidden" }}>
        <div className="origami-tr" aria-hidden="true" style={{ opacity: 0.08 }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 anim-up">
            <p className="fh6-eyebrow">O festival começa aqui</p>
            <h2 style={{
              fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 900,
              letterSpacing: "-0.03em", lineHeight: 1.05,
              color: "var(--text)", textTransform: "uppercase",
            }}>
              Tokyo. Nikko.<br />Hokkaido.<br />
              <span style={{ color: "var(--fh6-teal)" }}>O mapa inteiro<br />te espera.</span>
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.75, maxWidth: 450 }}>
              FH6 é o maior mapa da série. Tóquio, estradas de montanha, litoral — cada pista
              pede um setup diferente. Escolha o carro, a classe, o estilo. O app calcula o resto.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/tune" className="r-btn" style={{
                background: "var(--fh6-teal)", color: "#000", border: "none",
                fontWeight: 800, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase",
                paddingLeft: 24, paddingRight: 24, paddingTop: 11, paddingBottom: 11,
              }}>
                Gerar tune agora
              </Link>
              <Link href="/cars" className="r-btn r-btn-ghost" style={{ fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Ver todos os carros
              </Link>
            </div>
          </div>

          {/* Mini car grid 2x2 */}
          <div className="grid grid-cols-2 gap-3 anim-up" style={{ animationDelay: "0.15s" }}>
            {FEATURED.slice(0, 4).map((car) => {
              const img = getCarImageUrl(car)
              return (
                <Link key={car.id} href={`/tune?car=${car.id}`} className="fh6-card group" style={{ aspectRatio: "16/10" }}>
                  <div style={{ position: "relative", width: "100%", height: "100%", background: "var(--bg-card)" }}>
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
          FUNCIONALIDADES — 6 cards com hover real
          ════════════════════════════════════════════════════════ */}
      <section style={{ background: "var(--bg-surface)", position: "relative", overflow: "hidden" }}>
        <div className="origami-bl" aria-hidden="true" style={{ opacity: 0.08 }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 space-y-10">
          <div className="space-y-2 anim-up">
            <p className="fh6-eyebrow">O que você encontra aqui</p>
            <h2 style={{ fontSize: "clamp(1.75rem,3.5vw,2.5rem)", fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", textTransform: "uppercase" }}>
              Ferramentas para quem leva a sério.
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
          JDM CARROSSEL — slide automático
          ════════════════════════════════════════════════════════ */}
      <section style={{ background: "var(--bg-base)", paddingTop: 64, paddingBottom: 0 }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 pb-8">
          <div className="flex items-end justify-between flex-wrap gap-4 anim-up">
            <div className="space-y-1">
              <p className="fh6-eyebrow">JDM · O Japão na garagem</p>
              <h2 style={{ fontSize: "clamp(1.75rem,3.5vw,2.5rem)", fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", textTransform: "uppercase" }}>
                Lendas do Japão.
              </h2>
            </div>
            <Link href="/cars?type=street" style={{
              fontSize: 11, fontWeight: 700, color: "var(--fh6-teal)",
              letterSpacing: "0.1em", textTransform: "uppercase",
              display: "flex", alignItems: "center", gap: 6, textDecoration: "none",
            }}>
              Ver todos os 618 carros
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>

        {/* Carrossel infinito */}
        <JDMCarousel />

        {/* Cards abaixo do carrossel */}
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
          CTA FINAL
          ════════════════════════════════════════════════════════ */}
      <section style={{ background: "var(--bg-surface)", position: "relative", overflow: "hidden" }}>
        <div className="origami-tr" aria-hidden="true" style={{ opacity: 0.08 }} />
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 60% 80% at 50% 100%, rgba(44,206,204,0.08) 0%, transparent 60%)",
        }} />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-24 text-center space-y-8">
          <div className="space-y-4 anim-up">
            <p className="fh6-eyebrow" style={{ display: "block" }}>Sem improviso</p>
            <h2 className="fh6-headline" style={{ fontSize: "clamp(2.5rem,6vw,4.5rem)" }}>
              Pronto pra<br />
              <span className="fh6-headline-accent">largar.</span>
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-muted)", maxWidth: 460, margin: "0 auto", lineHeight: 1.75 }}>
              Sem IA inventando números. Cada valor saiu da combinação de carro,
              classe e tipo de prova — calculado pelo motor de regras.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center anim-up" style={{ animationDelay: "0.1s" }}>
            <Link href="/tune" className="r-btn" style={{
              paddingLeft: 40, paddingRight: 40, paddingTop: 15, paddingBottom: 15,
              background: "var(--fh6-teal)", color: "#000", border: "none",
              fontWeight: 900, fontSize: 14, letterSpacing: "0.06em", textTransform: "uppercase",
              boxShadow: "0 6px 28px rgba(44,206,204,0.4)",
            }}>
              Criar Tune
            </Link>
            <Link href="/diagnostics" className="r-btn" style={{
              paddingLeft: 32, paddingRight: 32, paddingTop: 15, paddingBottom: 15,
              background: "transparent", color: "#fff",
              border: "1px solid rgba(255,255,255,0.22)",
              fontWeight: 700, fontSize: 14, letterSpacing: "0.04em", textTransform: "uppercase",
            }}>
              Diagnosticar
            </Link>
          </div>

          {/* Links estilo plataforma */}
          <div className="flex flex-wrap items-center justify-center gap-5 pt-2 anim-up" style={{ animationDelay: "0.2s" }}>
            {[
              { href: "/cars",    label: "Banco de Carros" },
              { href: "/meta",    label: "Ranking" },
              { href: "/compare", label: "Comparar" },
              { href: "/garage",  label: "Garagem" },
            ].map(({ href, label }, i) => (
              <span key={href} className="flex items-center gap-5">
                {i > 0 && <span style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "inline-block" }} />}
                <Link href={href} style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none" }}>
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
