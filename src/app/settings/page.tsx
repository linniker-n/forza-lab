"use client"

import { useSettings } from "@/lib/settings/context"
import type { AppSettings } from "@/lib/settings/context"

interface ToggleGroupProps<T extends string> {
  label: string
  description: string
  options: { value: T; label: string; sub?: string }[]
  current: T
  onChange(v: T): void
}

function ToggleGroup<T extends string>({ label, description, options, current, onChange }: ToggleGroupProps<T>) {
  return (
    <div className="r-card p-5 space-y-4">
      <div>
        <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>{label}</p>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3, lineHeight: 1.55 }}>{description}</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              padding: "8px 18px",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 700,
              border: current === opt.value
                ? "1px solid var(--fh6-teal)"
                : "1px solid var(--border-strong)",
              background: current === opt.value
                ? "var(--fh6-teal-dim)"
                : "var(--bg-elevated)",
              color: current === opt.value ? "var(--fh6-teal)" : "var(--text-muted)",
              cursor: "pointer",
              transition: "all 0.15s ease",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 1,
            }}
          >
            <span>{opt.label}</span>
            {opt.sub && (
              <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.65 }}>{opt.sub}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { settings, update } = useSettings()

  return (
    <div className="dot-grid" style={{ minHeight: "100dvh" }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-8">

        {/* Header */}
        <div className="anim-up">
          <p className="section-label">Preferências</p>
          <h1 className="page-title">Configurações</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.6 }}>
            As configurações ficam salvas no navegador e se aplicam em todas as tunes geradas.
          </p>
        </div>

        {/* ── Idioma das peças ── */}
        <ToggleGroup<AppSettings["partsLanguage"]>
          label="Idioma das peças"
          description="Nome das peças do jogo no resultado da tune. Em português, os nomes ficam como aparecem para jogadores do Brasil."
          current={settings.partsLanguage}
          onChange={(v) => update({ partsLanguage: v })}
          options={[
            {
              value: "en",
              label: "English",
              sub: "Race brakes · Sport intake",
            },
            {
              value: "ptbr",
              label: "Português",
              sub: "Freios de corrida · Admissão esportiva",
            },
          ]}
        />

        {/* ── Pressão dos pneus ── */}
        <ToggleGroup<AppSettings["pressureUnit"]>
          label="Pressão dos pneus"
          description="Unidade de medida para ajuste de pressão. O jogo usa PSI nativamente."
          current={settings.pressureUnit}
          onChange={(v) => update({ pressureUnit: v })}
          options={[
            {
              value: "psi",
              label: "PSI",
              sub: "28.0 PSI — padrão do jogo",
            },
            {
              value: "bar",
              label: "BAR",
              sub: "1.93 bar — sistema métrico",
            },
          ]}
        />

        {/* ── Potência ── */}
        <ToggleGroup<AppSettings["powerUnit"]>
          label="Potência"
          description="Unidade de potência dos carros. CV é o cavalo-vapor métrico, usado em fichas brasileiras."
          current={settings.powerUnit}
          onChange={(v) => update({ powerUnit: v })}
          options={[
            {
              value: "hp",
              label: "HP",
              sub: "Horsepower — imperial",
            },
            {
              value: "cv",
              label: "CV",
              sub: "Cavalo-vapor — métrico",
            },
          ]}
        />

        {/* ── Torque ── */}
        <ToggleGroup<AppSettings["torqueUnit"]>
          label="Torque"
          description="Unidade de torque. kgf·m é comum em fichas técnicas de carros brasileiros mais antigos."
          current={settings.torqueUnit}
          onChange={(v) => update({ torqueUnit: v })}
          options={[
            {
              value: "nm",
              label: "Nm",
              sub: "Newton-metro — padrão",
            },
            {
              value: "kgfm",
              label: "kgf·m",
              sub: "Quilograma-força metro",
            },
          ]}
        />

        {/* Preview box */}
        <div className="r-card bracket p-5 space-y-3 anim-up">
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>
            Prévia com suas configurações
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {[
              {
                label: "Pressão dianteira",
                value: settings.pressureUnit === "bar" ? "1.93 bar" : "28.0 PSI",
              },
              {
                label: "Pressão traseira",
                value: settings.pressureUnit === "bar" ? "1.97 bar" : "28.5 PSI",
              },
              {
                label: "Potência",
                value: settings.powerUnit === "cv" ? "686 CV" : "677 HP",
              },
              {
                label: "Torque",
                value: settings.torqueUnit === "kgfm" ? "91.2 kgf·m" : "894 Nm",
              },
              {
                label: "Freios",
                value: settings.partsLanguage === "ptbr" ? "Freios de corrida" : "Race brakes",
              },
              {
                label: "Suspensão",
                value: settings.partsLanguage === "ptbr" ? "Suspensão de corrida" : "Race suspension",
              },
            ].map(({ label, value }) => (
              <div key={label} className="telem-row">
                <span className="telem-label">{label}</span>
                <span className="telem-value">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 11, color: "var(--text-subtle)", textAlign: "center" }}>
          Configurações salvas automaticamente neste navegador.
        </p>
      </div>
    </div>
  )
}
