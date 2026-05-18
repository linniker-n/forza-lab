import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import Link from "next/link"
import "./globals.css"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Forza Tune Lab — Tunes para Forza Horizon 6",
  description: "Motor de regras competitivo para FH6. Peças, ajustes finos e diagnóstico.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="app-root">
        <header className="app-header">
          <div className="header-top-line" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-6">
            <Link href="/" className="app-logo">
              <span className="logo-icon">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M3 2v11M3 2h9l-3 4h3l-3 4H3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span className="logo-text">
                <b className="logo-forza">FORZA</b>
                <b className="logo-tune">TUNE</b>
                <b className="logo-lab">LAB</b>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/tune"        className="nav-item">Criar Tune</Link>
              <Link href="/diagnostics" className="nav-item">Diagnóstico</Link>
              <Link href="/cars"        className="nav-item">Carros</Link>
              <Link href="/meta"        className="nav-item">Meta</Link>
              <Link href="/compare"     className="nav-item">Comparar</Link>
              <Link href="/garage"      className="nav-item">Garagem</Link>
            </nav>
            <Link href="/tune" className="r-btn r-btn-primary">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              Nova tune
            </Link>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="app-footer">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="footer-badge">FT</span>
              <span className="footer-brand">Forza Tune Lab</span>
            </div>
            <p className="footer-copy">Baseado em padrões de FH4/FH5 — preparado para Forza Horizon 6</p>
            <nav className="flex gap-4">
              <Link href="/tune"        className="footer-link">Tune</Link>
              <Link href="/diagnostics" className="footer-link">Diagnóstico</Link>
              <Link href="/cars"        className="footer-link">Carros</Link>
              <Link href="/meta"        className="footer-link">Meta</Link>
              <Link href="/garage"      className="footer-link">Garagem</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  )
}
