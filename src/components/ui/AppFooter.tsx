"use client"

import Link from "next/link"
import { useLanguage } from "@/lib/i18n/context"
import { useTranslations } from "@/lib/i18n/translations"

export function AppFooter() {
  const { lang } = useLanguage()
  const t = useTranslations(lang)

  return (
    <footer className="app-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="footer-badge">FL</span>
          <span className="footer-brand">Forza Lab</span>
        </div>
        <p className="footer-copy">
          {t.footer.builtBy}{" "}
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
          <Link href="/tune"        className="footer-link">{t.footer.tune}</Link>
          <Link href="/community"   className="footer-link">{t.footer.community}</Link>
          <Link href="/diagnostics" className="footer-link">{t.footer.diagnostics}</Link>
          <Link href="/calculator"  className="footer-link">{t.footer.calculator}</Link>
          <Link href="/cars"        className="footer-link">{t.footer.cars}</Link>
          <Link href="/meta"        className="footer-link">{t.footer.meta}</Link>
          <Link href="/garage"      className="footer-link">{t.footer.garage}</Link>
          <Link href="/pricing"     className="footer-link">{t.footer.pro}</Link>
          <Link href="/support"     className="footer-link">{t.footer.support}</Link>
        </nav>
      </div>
    </footer>
  )
}
