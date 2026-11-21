import { useEffect } from "react"

import { inBase } from "@mizan/core/market/currency"
import { useSession } from "@/hooks/use-core"
import { useMetals } from "@/hooks/use-views"
import { preferences, refreshPreferences, usePreferences } from "@/preferences"

interface Rates {
  base: string
  perUsd: Record<string, number>
}

let rates: Rates | null = null

/** Keeps today's rates where the money formatter can read them while rendering. Mounted once, signed in. */
export function DisplayRatesSync() {
  const base = useSession()?.baseCurrency
  const { prices } = useMetals()
  useEffect(() => {
    rates = base ? { base, perUsd: prices.perUsd } : null
    if (preferences().displayCurrency) refreshPreferences()
  }, [base, prices.perUsd])
  return null
}

/** An amount in the household currency, in the chosen display currency at today's rate; null to show it as stored. */
export function inDisplayCurrency(minorUnits: number, currency: string): { amount: number; currency: string } | null {
  const display = preferences().displayCurrency
  if (!display || !rates || currency !== rates.base || display === currency) return null
  const amount = inBase(minorUnits, currency, display, rates.perUsd)
  return amount === null ? null : { amount, currency: display }
}

/** The currency amounts are being shown in, when the switch is on and a rate is known. */
export function useShownCurrency(): string | null {
  const { displayCurrency } = usePreferences()
  const base = useSession()?.baseCurrency
  return displayCurrency && displayCurrency !== base && rates?.perUsd[displayCurrency] ? displayCurrency : null
}
