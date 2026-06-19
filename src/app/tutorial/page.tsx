import type { Metadata } from "next"
import Link from "next/link"
import {
  CLASS_OPTIMIZATION_GUIDE,
  PART_KNOWLEDGE_CATEGORIES,
  PI_MANAGEMENT_TIPS,
  PI_SYSTEM_SUMMARY,
} from "@/lib/tune-engine/part-knowledge"

export const metadata: Metadata = {
  title: "Tutorial de pecas e PI - Forza Lab",
  description: "Guia completo de pecas, impacto no PI e estrategia de otimizacao por classe para Forza Horizon.",
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="section-label" style={{ marginBottom: 8 }}>
      {children}
    </p>
  )
}

function KnowledgeTable({ category }: { category: (typeof PART_KNOWLEDGE_CATEGORIES)[number] }) {
  return (
    <section id={category.id} className="r-card p-4 sm:p-5 space-y-4 scroll-mt-20">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <SectionLabel>Mapa de pecas</SectionLabel>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em" }}>
            {category.title}
          </h2>
        </div>
        <span className="badge-class" style={{ color: "var(--blue-bright)", background: "var(--blue-dim)", borderColor: "var(--border-blue)" }}>
          {category.entries.length} itens
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full" style={{ minWidth: 760, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-strong)" }}>
              {["Nome no jogo (PT)", "Nome em ingles", "Impacto no PI", "Observacao / estrategia"].map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  style={{
                    textAlign: "left",
                    padding: "10px 12px",
                    fontSize: 10,
                    fontWeight: 900,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--text-subtle)",
                  }}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {category.entries.map((entry) => (
              <tr key={entry.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "12px", fontSize: 13, fontWeight: 800, color: "var(--text)" }}>
                  {entry.portugueseName}
                </td>
                <td style={{ padding: "12px", fontSize: 12, color: "var(--text-muted)" }}>
                  {entry.englishName}
                </td>
                <td style={{ padding: "12px" }}>
                  <span className="mono-val" style={{ fontSize: 11, color: "var(--blue-bright)" }}>
                    {entry.piImpact}
                  </span>
                </td>
                <td style={{ padding: "12px", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.55 }}>
                  {entry.observation}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default function TutorialPage() {
  return (
    <div className="dot-grid" style={{ minHeight: "100dvh" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <section className="anim-up grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6 items-end">
          <div className="space-y-4">
            <SectionLabel>Forza Lab Academy</SectionLabel>
            <h1 className="page-title" style={{ maxWidth: 760 }}>
              Tutorial de pecas, PI e otimizacao por classe
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 760 }}>
              Este guia transforma os documentos de tunagem em uma referencia pratica dentro do Forza Lab:
              cada peca mostra o nome em portugues, o nome tecnico em ingles, o impacto no Performance Index
              e a observacao de uso.
            </p>
          </div>

          <div className="r-card p-5 space-y-3">
            <SectionLabel>Regra central</SectionLabel>
            {PI_SYSTEM_SUMMARY.map((item, index) => (
              <div key={item} className="flex gap-3">
                <span className="mono-val shrink-0" style={{ color: "var(--blue-bright)", fontSize: 12 }}>
                  0{index + 1}
                </span>
                <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
                  {item}
                </p>
              </div>
            ))}
          </div>
        </section>

        <nav className="anim-up flex gap-2 flex-wrap" style={{ animationDelay: "60ms" }} aria-label="Categorias do tutorial">
          {PART_KNOWLEDGE_CATEGORIES.map((category) => (
            <a key={category.id} href={`#${category.id}`} className="filter-chip">
              {category.title.split(" (")[0]}
            </a>
          ))}
          <a href="#classes" className="filter-chip">Classes</a>
          <a href="#pi" className="filter-chip">Gestao de PI</a>
        </nav>

        <div className="grid grid-cols-1 gap-5 anim-up" style={{ animationDelay: "100ms" }}>
          {PART_KNOWLEDGE_CATEGORIES.map((category) => (
            <KnowledgeTable key={category.id} category={category} />
          ))}
        </div>

        <section id="classes" className="space-y-5 scroll-mt-20">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <SectionLabel>Estrategia</SectionLabel>
              <h2 style={{ fontSize: 26, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.04em" }}>
                Otimizacao por classe
              </h2>
            </div>
            <Link href="/tune" className="r-btn r-btn-primary">
              Criar tune
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {CLASS_OPTIMIZATION_GUIDE.map((guide) => (
              <article key={guide.id} className="r-card p-5 space-y-4">
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em" }}>
                    {guide.title}
                  </h3>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.65, marginTop: 8 }}>
                    {guide.description}
                  </p>
                </div>
                <div className="space-y-3">
                  {guide.bullets.map((bullet) => (
                    <div key={bullet.label} style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                      <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--blue-bright)" }}>
                        {bullet.label}
                      </p>
                      <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6, marginTop: 4 }}>
                        {bullet.text}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="pi" className="r-card p-5 sm:p-6 space-y-4 scroll-mt-20">
          <div>
            <SectionLabel>Controle fino</SectionLabel>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.04em" }}>
              Gestao do Performance Index
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PI_MANAGEMENT_TIPS.map((tip, index) => (
              <div key={tip.label} style={{ borderTop: "1px solid var(--border-strong)", paddingTop: 14 }}>
                <span className="mono-val" style={{ fontSize: 11, color: "var(--blue-bright)" }}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 style={{ fontSize: 14, fontWeight: 900, color: "var(--text)", marginTop: 8 }}>
                  {tip.label}
                </h3>
                <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6, marginTop: 6 }}>
                  {tip.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg p-4" style={{ border: "1px solid var(--border-strong)", background: "var(--bg-card)" }}>
          <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
            Referencia usada nos documentos: NO BS GUIDE TO UPGRADING AND TUNING BASICS IN FORZA HORIZON 5.
          </p>
          <a
            href="https://www.youtube.com/watch?v=nGevahfLwms"
            target="_blank"
            rel="noreferrer"
            className="r-btn r-btn-ghost"
            style={{ fontSize: 12 }}
          >
            Abrir referencia
          </a>
        </section>
      </div>
    </div>
  )
}
