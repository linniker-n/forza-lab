import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import Link from "next/link"
import { AuthProvider } from "@/components/auth/AuthProvider"
import { AppHeader } from "@/components/ui/AppHeader"
import { SettingsProvider } from "@/lib/settings/context"
import { ThemeProvider } from "@/lib/theme/context"
import "./globals.css"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Forza Tune Lab - Tunes para Forza Horizon 6",
  description: "Motor competitivo para FH6 com tunagem, diagnostico, calculadora e garagem.",
}

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
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="app-root">
        <ThemeProvider>
          <AuthProvider>
            <SettingsProvider>
              <AppHeader />

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
                    <Link href="/tune" className="footer-link">Tune</Link>
                    <Link href="/diagnostics" className="footer-link">Diagnostico</Link>
                    <Link href="/calculator" className="footer-link">Calculadora</Link>
                    <Link href="/cars" className="footer-link">Carros</Link>
                    <Link href="/meta" className="footer-link">Meta</Link>
                    <Link href="/garage" className="footer-link">Garagem</Link>
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
