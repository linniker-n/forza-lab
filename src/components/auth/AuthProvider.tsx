"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import {
  GoogleAuthProvider,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth"
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client"

interface AuthContextValue {
  configured: boolean
  loading: boolean
  user: User | null
  signInWithEmail(email: string): Promise<void>
  completeEmailSignIn(email?: string): Promise<void>
  signInWithGoogle(): Promise<void>
  signOut(): Promise<void>
}

const EMAIL_STORAGE_KEY = "forza-tune-lab:email-for-sign-in"
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

    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })
  }, [auth])

  const signInWithEmail = useCallback(async (email: string) => {
    if (!auth) throw new Error("Firebase não configurado.")
    window.localStorage.setItem(EMAIL_STORAGE_KEY, email)
    await sendSignInLinkToEmail(auth, email, actionCodeSettings())
  }, [auth])

  const completeEmailSignIn = useCallback(async (fallbackEmail?: string) => {
    if (!auth) throw new Error("Firebase não configurado.")
    if (!isSignInWithEmailLink(auth, window.location.href)) return

    const email = fallbackEmail || window.localStorage.getItem(EMAIL_STORAGE_KEY)
    if (!email) throw new Error("Informe novamente o email para concluir o login.")

    await signInWithEmailLink(auth, email, window.location.href)
    window.localStorage.removeItem(EMAIL_STORAGE_KEY)
  }, [auth])

  const signInWithGoogle = useCallback(async () => {
    if (!auth) throw new Error("Firebase não configurado.")
    await signInWithPopup(auth, new GoogleAuthProvider())
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
