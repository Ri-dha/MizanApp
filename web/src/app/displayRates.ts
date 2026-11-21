import { useEffect } from "react"

import { useSession } from "@/api/auth"
import { useMetals } from "@/features/metals/useMetals"
import { inBase } from "@mizan/core/market/currency"
import { preferences, refreshPreferences, usePreferences } from "./preferences"

interface Rates {
  base: string
  perUsd: Record<string, number>
}

let rates: Rates | null = null

/** Keeps today's rates where the money formatter can read them while rendering. Mounted once in the shell. */
export function DisplayRatesSync() {
  const base = useSession()?.baseCurrency
  const { prices } = useMetals()
  useEffect(() => {
    rates = base ? { base, perUsd: prices.perUsd } : null
    if (preferences().displayCurrency) refreshPreferences()
  }, [base, prices.perUsd])
  return null
}

/**
 * The display switch: an amount in the household currency, in the chosen display currency at
 * today's rate. Null when there is nothing to convert, so the amount is shown as stored.
 */
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
