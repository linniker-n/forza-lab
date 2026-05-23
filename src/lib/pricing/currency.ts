export type Currency = "BRL" | "USD"

// All Brazilian timezones defined by IANA
const BRAZIL_TIMEZONES = new Set([
  "America/Sao_Paulo", "America/Fortaleza", "America/Recife",
  "America/Belem", "America/Maceio", "America/Bahia",
  "America/Manaus", "America/Porto_Velho", "America/Boa_Vista",
  "America/Rio_Branco", "America/Noronha", "America/Araguaina",
  "America/Campo_Grande", "America/Cuiaba",
])

export function detectCurrency(): Currency {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (BRAZIL_TIMEZONES.has(tz)) return "BRL"
  } catch { /* fallback to USD */ }
  return "USD"
}

export interface PlanPrices {
  currency: Currency
  monthly: {
    priceId: string
    display: string       // "R$ 9,90" | "$9.90"
    buttonLabel: string   // "R$ 9,90/mês" | "$9.90/mo"
  }
  yearly: {
    priceId: string
    perMonthDisplay: string // "R$ 6,60" | "$1.67"
    totalDisplay: string    // "R$ 79,90/ano" | "$19.99/yr"
    savings: string         // "R$ 79,90/ano · economize R$ 38,90" | "$19.99/yr · save $15.89"
    discountLabel: string   // "-33%" | "-44%"
    buttonLabel: string     // "R$ 79,90/ano" | "$19.99/yr"
  }
  freeDisplay: string       // "R$ 0" | "$0"
}

export function getPlanPrices(): PlanPrices {
  const currency = detectCurrency()

  if (currency === "BRL") {
    return {
      currency: "BRL",
      monthly: {
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY ?? "",
        display: "R$ 9,90",
        buttonLabel: "R$ 9,90/mês",
      },
      yearly: {
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY ?? "",
        perMonthDisplay: "R$ 6,60",
        totalDisplay: "R$ 79,90/ano",
        savings: "R$ 79,90/ano · economize R$ 38,90",
        discountLabel: "-33%",
        buttonLabel: "R$ 79,90/ano",
      },
      freeDisplay: "R$ 0",
    }
  }

  // International (USD)
  // $9.90/mo × 12 = $118.80/yr vs $79.90/yr → save $38.90 = ~33% off
  return {
    currency: "USD",
    monthly: {
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY_USD ?? "",
      display: "$9.90",
      buttonLabel: "$9.90/mo",
    },
    yearly: {
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY_USD ?? "",
      perMonthDisplay: "$6.66",
      totalDisplay: "$79.90/yr",
      savings: "$79.90/yr · save $38.90",
      discountLabel: "-33%",
      buttonLabel: "$79.90/yr",
    },
    freeDisplay: "$0",
  }
}
