"use client"

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from "react"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { getFirebaseDb } from "@/lib/firebase/client"
import { useAuth } from "@/components/auth/AuthProvider"
import { FREE_LIMITS, type SubscriptionStatus, type SubscriptionTier } from "./limits"

export interface SubscriptionData {
  tier:               SubscriptionTier
  status:             SubscriptionStatus
  stripeCustomerId:   string | null
  tuneUsageDate:      string | null  // ISO date "2026-05-22"
  tuneUsageCount:     number
}

interface SubscriptionCtx {
  loading:            boolean
  tier:               SubscriptionTier
  isPro:              boolean
  status:             SubscriptionStatus
  tuneUsageToday:     number
  canGenerate:        boolean   // true if can still generate today
  remainingTunes:     number    // -1 = unlimited
  incrementTuneUsage(): Promise<void>
}

const Ctx = createContext<SubscriptionCtx | null>(null)

const today = () => new Date().toISOString().split("T")[0]

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<SubscriptionData>({
    tier: "free", status: null, stripeCustomerId: null,
    tuneUsageDate: null, tuneUsageCount: 0,
  })

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      const handle = window.setTimeout(() => {
        setData({ tier: "free", status: null, stripeCustomerId: null, tuneUsageDate: null, tuneUsageCount: 0 })
        setLoading(false)
      }, 0)
      return () => window.clearTimeout(handle)
    }

    let active = true

    async function load() {
      // Verifica custom claim 'admin: true' no JWT (server-controlled, não falsificável)
      // Para conceder: chamar a function setAdminClaim (ou Firebase Admin SDK)
      try {
        const tokenResult = await user!.getIdTokenResult()
        if (!active) return
        if (tokenResult.claims["admin"] === true) {
          setData({ tier: "pro", status: "active", stripeCustomerId: null, tuneUsageDate: null, tuneUsageCount: 0 })
          setLoading(false)
          return
        }
      } catch { /* se falhar lê do Firestore normalmente */ }

      if (!active) return
      const db = getFirebaseDb()
      if (!db) { setLoading(false); return }

      try {
        const snap = await getDoc(doc(db, "userProfiles", user!.uid))
        if (!active) return
        if (!snap.exists()) { setLoading(false); return }
        const d = snap.data()
        setData({
          tier:             (d.subscription_tier as SubscriptionTier) ?? "free",
          status:           (d.subscription_status as SubscriptionStatus) ?? null,
          stripeCustomerId: d.stripe_customer_id ?? null,
          tuneUsageDate:    d.tune_usage?.date ?? null,
          tuneUsageCount:   d.tune_usage?.count ?? 0,
        })
      } catch { /* ignora */ }
      finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => { active = false }
  }, [user, authLoading])

  const tuneUsageToday = useMemo(() => {
    if (data.tuneUsageDate !== today()) return 0
    return data.tuneUsageCount
  }, [data.tuneUsageDate, data.tuneUsageCount])

  const canGenerate = useMemo(() => {
    if (data.tier === "pro") return true
    return tuneUsageToday < FREE_LIMITS.tunesPerDay
  }, [data.tier, tuneUsageToday])

  const remainingTunes = useMemo(() => {
    if (data.tier === "pro") return -1
    return Math.max(0, FREE_LIMITS.tunesPerDay - tuneUsageToday)
  }, [data.tier, tuneUsageToday])

  const incrementTuneUsage = useCallback(async () => {
    if (!user || data.tier === "pro") return
    const db = getFirebaseDb()
    if (!db) return

    const todayStr = today()
    const newCount = data.tuneUsageDate === todayStr ? data.tuneUsageCount + 1 : 1
    const newUsage = { date: todayStr, count: newCount }

    setData((prev) => ({ ...prev, tuneUsageDate: todayStr, tuneUsageCount: newCount }))
    await updateDoc(doc(db, "userProfiles", user.uid), { tune_usage: newUsage }).catch(() => {})
  }, [user, data])

  const value = useMemo<SubscriptionCtx>(() => ({
    loading,
    tier:           data.tier,
    isPro:          data.tier === "pro",
    status:         data.status,
    tuneUsageToday,
    canGenerate,
    remainingTunes,
    incrementTuneUsage,
  }), [loading, data, tuneUsageToday, canGenerate, remainingTunes, incrementTuneUsage])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSubscription(): SubscriptionCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useSubscription must be inside SubscriptionProvider")
  return ctx
}
