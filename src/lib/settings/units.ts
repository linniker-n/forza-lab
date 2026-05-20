import type { AppSettings } from "./context"

// ── Pressão ─────────────────────────────────────────────
export function formatPressure(psi: number, unit: AppSettings["pressureUnit"]): string {
  if (unit === "bar") {
    return `${(psi * 0.06895).toFixed(2)} bar`
  }
  return `${psi} PSI`
}

// ── Potência ─────────────────────────────────────────────
// 1 HP = 1.01387 CV (métrico)
export function formatPower(hp: number, unit: AppSettings["powerUnit"]): string {
  if (unit === "cv") {
    return `${Math.round(hp * 1.01387)} CV`
  }
  return `${hp} HP`
}

// ── Torque ──────────────────────────────────────────────
// 1 Nm = 0.10197 kgf·m
export function formatTorque(nm: number, unit: AppSettings["torqueUnit"]): string {
  if (unit === "kgfm") {
    return `${(nm * 0.10197).toFixed(1)} kgf·m`
  }
  return `${nm} Nm`
}

// ── Rigidez de molas ─────────────────────────────────────
// O jogo (PT-BR) exibe em kgf/mm (máx. 338,1).
// Internamente calculamos em lbf/in.  1 lbf/in = 0.175127 kgf/mm
export function formatSpring(lbfin: number, unit: AppSettings["springUnit"]): string {
  if (unit === "kgfmm") {
    return `${(lbfin * 0.175127).toFixed(1)} kgf/mm`
  }
  return `${lbfin} lbf/in`
}

export function springLabel(unit: AppSettings["springUnit"]): string {
  return unit === "kgfmm" ? "kgf/mm" : "lbf/in"
}

// ── Labels de unidade ────────────────────────────────────
export function pressureLabel(unit: AppSettings["pressureUnit"]): string {
  return unit === "bar" ? "bar" : "PSI"
}

export function powerLabel(unit: AppSettings["powerUnit"]): string {
  return unit === "cv" ? "CV" : "HP"
}

export function torqueLabel(unit: AppSettings["torqueUnit"]): string {
  return unit === "kgfm" ? "kgf·m" : "Nm"
}

// ── Valor numérico bruto (para exibição em campos separados) ──
export function pressureValue(psi: number, unit: AppSettings["pressureUnit"]): string {
  return unit === "bar" ? (psi * 0.06895).toFixed(2) : String(psi)
}

export function powerValue(hp: number, unit: AppSettings["powerUnit"]): string {
  return unit === "cv" ? String(Math.round(hp * 1.01387)) : String(hp)
}

export function torqueValue(nm: number, unit: AppSettings["torqueUnit"]): string {
  return unit === "kgfm" ? (nm * 0.10197).toFixed(1) : String(nm)
}
