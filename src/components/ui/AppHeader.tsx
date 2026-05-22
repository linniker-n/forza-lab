"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { MobileMenu } from "@/components/ui/MobileMenu"

const NAV_LINKS = [
  { href: "/tune",       label: "Criar tune" },
  { href: "/community",  label: "Comunidade" },
  { href: "/diagnostics",label: "Diagnostico" },
  { href: "/calculator", label: "Calculadora" },
  { href: "/cars",       label: "Carros" },
  { href: "/meta",       label: "Meta" },
  { href: "/compare",    label: "Comparar" },
  { href: "/garage",     label: "Garagem" },
]

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppHeader() {
  const pathname = usePathname()
  const { loading, user, signOut } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement | null>(null)

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

        <nav className="hidden xl:flex items-center gap-3" aria-label="Navegacao principal">
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
          <ThemeToggle />
          <div className="profile-menu" ref={profileRef}>
            {!loading && !user ? (
              <Link href="/login" className="profile-trigger">
                Entrar
              </Link>
            ) : loading ? (
              <button type="button" className="profile-trigger" disabled>
                <span className="profile-avatar">P</span>
                <span className="profile-label">Perfil</span>
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
                  <span className="profile-avatar">{(user?.displayName || user?.email)?.[0]?.toUpperCase() ?? "P"}</span>
                  <span className="profile-label">{user?.displayName || "Perfil"}</span>
                </button>
                {profileOpen && (
                  <div className="profile-popover" role="menu">
                    <p className="profile-email">{user?.displayName ? `${user.displayName} · ${user.email}` : user?.email}</p>
                    <Link href="/profile" className="profile-item" role="menuitem">
                      Editar perfil
                    </Link>
                    <Link href="/settings" className="profile-item" role="menuitem">
                      Configuracoes
                    </Link>
                    <Link href="/support" className="profile-item" role="menuitem">
                      Suporte
                    </Link>
                    <button
                      type="button"
                      className="profile-item danger"
                      role="menuitem"
                      onClick={() => void signOut()}
                    >
                      Sair da conta
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
