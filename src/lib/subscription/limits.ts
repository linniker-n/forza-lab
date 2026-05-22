export const FREE_LIMITS = {
  tunesPerDay:    3,
  garageSlots:    5,
  rankingVisible: 3,   // top N visíveis no meta/ranking
} as const

export const PRO_LIMITS = {
  tunesPerDay:    Infinity,
  garageSlots:    Infinity,
  rankingVisible: Infinity,
} as const

export type SubscriptionTier = "free" | "pro"
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing" | null
