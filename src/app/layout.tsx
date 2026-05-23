import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { AuthProvider } from "@/components/auth/AuthProvider"
import { AppFooter } from "@/components/ui/AppFooter"
import { AppHeader } from "@/components/ui/AppHeader"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { SettingsProvider } from "@/lib/settings/context"
import { SubscriptionProvider } from "@/lib/subscription/context"
import { ThemeProvider } from "@/lib/theme/context"
import { LanguageProvider } from "@/lib/i18n/context"
import "./globals.css"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Forza Lab - Tunes para Forza Horizon 6",
  description: "Motor competitivo para FH6 com tunagem, diagnostico, calculadora, comunidade e garagem.",
}

const themeScript = `
  try {
    var t = localStorage.getItem('forza-lab:theme');
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
        <ErrorBoundary>
        <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <SubscriptionProvider>
            <SettingsProvider>
              <AppHeader />

              <main className="flex-1">{children}</main>

              <AppFooter />
            </SettingsProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </LanguageProvider>
        </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
