"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import {
  GoogleAuthProvider,
  getRedirectResult,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth"
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client"

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

interface AuthContextValue {
  configured: boolean
  loading: boolean
  user: User | null
  signInWithEmail(email: string): Promise<void>
  completeEmailSignIn(email?: string): Promise<void>
  signInWithGoogle(): Promise<void>
  signOut(): Promise<void>
}

// Mantém ambas as chaves para compatibilidade com sessões antigas
const EMAIL_STORAGE_KEY     = "forza-tune-lab:email-for-sign-in"
const EMAIL_STORAGE_KEY_NEW = "forza-lab:email-for-sign-in"
const AuthContext = createContext<AuthContextValue | null>(null)

function actionCodeSettings() {
  return {
    url: `${window.location.origin}/auth/callback`,
    handleCodeInApp: true,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useMemo(() => getFirebaseAuth(), [])
  const configured = isFirebaseConfigured()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(() => configured)

  useEffect(() => {
    if (!auth) return

    // Process any pending redirect-based sign-in (used on mobile)
    getRedirectResult(auth).catch(() => {})

    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })
  }, [auth])

  const signInWithEmail = useCallback(async (email: string) => {
    if (!auth) throw new Error("Firebase não configurado.")
    // Salva em ambas as chaves para compatibilidade
    window.localStorage.setItem(EMAIL_STORAGE_KEY,     email)
    window.localStorage.setItem(EMAIL_STORAGE_KEY_NEW, email)
    await sendSignInLinkToEmail(auth, email, actionCodeSettings())
  }, [auth])

  const completeEmailSignIn = useCallback(async (fallbackEmail?: string) => {
    if (!auth) throw new Error("Firebase não configurado.")

    // Se a URL não contém os parâmetros do magic link, não é um link válido
    if (!isSignInWithEmailLink(auth, window.location.href)) {
      throw new Error("Link de acesso inválido ou expirado. Solicite um novo na página de login.")
    }

    // Tenta ler o email de ambas as chaves (compatibilidade entre versões)
    const savedEmail =
      fallbackEmail ||
      window.localStorage.getItem(EMAIL_STORAGE_KEY_NEW) ||
      window.localStorage.getItem(EMAIL_STORAGE_KEY)

    if (!savedEmail) {
      throw new Error(
        "Você abriu o link em um browser diferente do que usou para enviar o email. " +
        "Por favor, informe seu email novamente para concluir."
      )
    }

    await signInWithEmailLink(auth, savedEmail, window.location.href)
    window.localStorage.removeItem(EMAIL_STORAGE_KEY)
    window.localStorage.removeItem(EMAIL_STORAGE_KEY_NEW)
  }, [auth])

  const signInWithGoogle = useCallback(async () => {
    if (!auth) throw new Error("Firebase não configurado.")
    const provider = new GoogleAuthProvider()
    if (isMobileDevice()) {
      // Mobile browsers block popups — use redirect-based flow instead
      await signInWithRedirect(auth, provider)
    } else {
      await signInWithPopup(auth, provider)
    }
  }, [auth])

  const signOut = useCallback(async () => {
    if (!auth) return
    await firebaseSignOut(auth)
    setUser(null)
  }, [auth])

  const value = useMemo<AuthContextValue>(() => ({
    configured,
    loading,
    user,
    signInWithEmail,
    completeEmailSignIn,
    signInWithGoogle,
    signOut,
  }), [configured, loading, user, signInWithEmail, completeEmailSignIn, signInWithGoogle, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error("useAuth precisa estar dentro de AuthProvider")
  return value
}
