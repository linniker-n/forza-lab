import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import Link from "next/link"
import { AuthProvider } from "@/components/auth/AuthProvider"
import { AuthStatus } from "@/components/auth/AuthStatus"
import { ThemeProvider } from "@/lib/theme/context"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { SettingsProvider } from "@/lib/settings/context"
import "./globals.css"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Forza Tune Lab — Tunes para Forza Horizon 6",
  description: "Motor de regras competitivo para FH6. Peças, ajustes finos e diagnóstico.",
}

// Script inline que roda antes do React para evitar flash de tema errado
const themeScript = `
  try {
    var t = localStorage.getItem('forza-tune-lab:theme');
    if (t === 'light' || t === 'dark') {
      document.documentElement.setAttribute('data-theme', t);
    }
  } catch(e) {}
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Anti-FOUC: define o tema antes do primeiro paint */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="app-root">
        <ThemeProvider>
        <AuthProvider>
        <SettingsProvider>
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
              <nav className="hidden lg:flex items-center gap-5">
                <Link href="/tune"        className="nav-item">Criar Tune</Link>
                <Link href="/diagnostics" className="nav-item">Diagnóstico</Link>
                <Link href="/cars"        className="nav-item">Carros</Link>
                <Link href="/meta"        className="nav-item">Meta</Link>
                <Link href="/compare"     className="nav-item">Comparar</Link>
                <Link href="/garage"      className="nav-item">Garagem</Link>
                <Link href="/settings"    className="nav-item" aria-label="Configurações">
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <path d="M7.5 1C7.5 1 6.5 2.5 6 3.5C5 3.2 3.8 3.5 3 4.3L2.2 5.8C2.7 6.3 3 7 3 7.5C3 8 2.7 8.7 2.2 9.2L3 10.7C3.8 11.5 5 11.8 6 11.5C6.5 12.5 7.5 14 7.5 14C7.5 14 8.5 12.5 9 11.5C10 11.8 11.2 11.5 12 10.7L12.8 9.2C12.3 8.7 12 8 12 7.5C12 7 12.3 6.3 12.8 5.8L12 4.3C11.2 3.5 10 3.2 9 3.5C8.5 2.5 7.5 1 7.5 1Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="7.5" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="1.4"/>
                  </svg>
                </Link>
              </nav>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <AuthStatus />
                <Link href="/tune" className="r-btn r-btn-primary">
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                  Nova tune
                </Link>
              </div>
            </div>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="app-footer">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="footer-badge">FT</span>
                <span className="footer-brand">Forza Tune Lab</span>
              </div>
              <p className="footer-copy">
                Desenvolvido por{" "}
                <a
                  href="https://www.instagram.com/linniker.n"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--fh6-teal)", textDecoration: "none", fontWeight: 600 }}
                >
                  @linnikern_
                </a>
              </p>
              <nav className="flex gap-4 flex-wrap justify-center">
                <Link href="/tune"        className="footer-link">Tune</Link>
                <Link href="/diagnostics" className="footer-link">Diagnóstico</Link>
                <Link href="/cars"        className="footer-link">Carros</Link>
                <Link href="/meta"        className="footer-link">Meta</Link>
                <Link href="/garage"      className="footer-link">Garagem</Link>
              </nav>
            </div>
          </footer>
        </SettingsProvider>
        </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
