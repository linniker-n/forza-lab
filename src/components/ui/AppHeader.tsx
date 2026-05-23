"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { useSubscription } from "@/lib/subscription/context"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { MobileMenu } from "@/components/ui/MobileMenu"
import { useLanguage } from "@/lib/i18n/context"
import { useTranslations } from "@/lib/i18n/translations"

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppHeader() {
  const pathname = usePathname()
  const { loading, user, signOut } = useAuth()
  const { isPro } = useSubscription()
  const { lang, setLang } = useLanguage()
  const t = useTranslations(lang)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement | null>(null)

  const NAV_LINKS = [
    { href: "/tune",        label: t.nav.createTune },
    { href: "/community",   label: t.nav.community },
    { href: "/diagnostics", label: t.nav.diagnostics },
    { href: "/calculator",  label: t.nav.calculator },
    { href: "/cars",        label: t.nav.cars },
    { href: "/meta",        label: t.nav.meta },
    { href: "/compare",     label: t.nav.compare },
    { href: "/garage",      label: t.nav.garage },
  ]

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!profileRef.current?.contains(event.target as Node)) setProfileOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [])

  useEffect(() => {
    const handle = window.setTimeout(() => setProfileOpen(false), 0)
    return () => window.clearTimeout(handle)
  }, [pathname])

  return (
    <header className="app-header">
      <div className="header-top-line" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="app-logo" aria-label="Forza Lab">
          <span className="logo-icon">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M3 2v11M3 2h9l-3 4h3l-3 4H3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className="logo-text">
            <b className="logo-forza">FORZA</b>
            <b className="logo-lab">LAB</b>
          </span>
        </Link>

        <nav className="hidden xl:flex items-center gap-3" aria-label="Main navigation">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item${isActive(pathname, item.href) ? " active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden xl:flex items-center gap-2">
          {/* Language toggle */}
          <div className="flex rounded overflow-hidden" style={{ border: "1px solid var(--border-strong)" }}>
            {(["pt", "en"] as const).map((l, i) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                style={{
                  fontSize: 10, fontWeight: 800, padding: "4px 9px", lineHeight: 1.4,
                  background: lang === l ? "var(--blue)" : "transparent",
                  color: lang === l ? "#fff" : "var(--text-muted)",
                  border: "none", cursor: "pointer", letterSpacing: "0.06em",
                  borderLeft: i > 0 ? "1px solid var(--border-strong)" : "none",
                }}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <ThemeToggle />
          <div className="profile-menu" ref={profileRef}>
            {!loading && !user ? (
              <Link href="/login" className="profile-trigger">
                {t.nav.signIn}
              </Link>
            ) : loading ? (
              <button type="button" className="profile-trigger" disabled>
                <span className="profile-avatar">P</span>
                <span className="profile-label">{t.nav.profile}</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="profile-trigger"
                  onClick={() => setProfileOpen((value) => !value)}
                  aria-expanded={profileOpen}
                  aria-haspopup="menu"
                >
                  <span className="profile-avatar" style={{ position: "relative" }}>
                    {(user?.displayName || user?.email)?.[0]?.toUpperCase() ?? "P"}
                    {isPro && (
                      <span style={{
                        position: "absolute", bottom: -3, right: -3,
                        width: 10, height: 10, borderRadius: "50%",
                        background: "var(--fh6-teal)", border: "1.5px solid var(--bg-card)",
                      }} />
                    )}
                  </span>
                  <span className="profile-label">
                    {user?.displayName || t.nav.profile}
                    {isPro && <span style={{ marginLeft: 5, fontSize: 8, fontWeight: 800, color: "var(--fh6-teal)", letterSpacing: "0.08em" }}>PRO</span>}
                  </span>
                </button>
                {profileOpen && (
                  <div className="profile-popover" role="menu">
                    <p className="profile-email">{user?.displayName ? `${user.displayName} · ${user.email}` : user?.email}</p>
                    <Link href="/profile" className="profile-item" role="menuitem">
                      {t.nav.editProfile}
                    </Link>
                    {!isPro && (
                      <Link href="/pricing" className="profile-item" role="menuitem" style={{ color: "var(--fh6-teal)", fontWeight: 700 }}>
                        {t.nav.upgradePro}
                      </Link>
                    )}
                    <Link href="/settings" className="profile-item" role="menuitem">
                      {t.nav.settings}
                    </Link>
                    <Link href="/support" className="profile-item" role="menuitem">
                      {t.nav.support}
                    </Link>
                    <button
                      type="button"
                      className="profile-item danger"
                      role="menuitem"
                      onClick={() => void signOut()}
                    >
                      {t.nav.signOut}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex xl:hidden items-center gap-2">
          <ThemeToggle />
          <MobileMenu />
        </div>
      </div>
    </header>
  )
}
