import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { loadCatalogue, unitRate, type CurrencyCatalogue } from "@mizan/core/market/currency"
import { useMetals } from "@/features/metals/useMetals"

let shared: Promise<CurrencyCatalogue> | null = null

/** The offered currencies and countries, fetched once per page load and kept on the device. */
export function useCatalogue(): CurrencyCatalogue | undefined {
  const [catalogue, setCatalogue] = useState<CurrencyCatalogue>()
  useEffect(() => {
    let cancelled = false
    shared ??= loadCatalogue().catch((error: unknown) => {
      shared = null
      throw error
    })
    shared.then((c) => !cancelled && setCatalogue(c)).catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])
  return catalogue
}

/** A currency's name in the app's language, or its code when the browser has none. */
export function useCurrencyName(): (code: string) => string {
  const { i18n } = useTranslation()
  return useMemo(() => {
    let display: Intl.DisplayNames | undefined
    try {
      display = new Intl.DisplayNames([i18n.language], { type: "currency" })
    } catch {
      display = undefined
    }
    return (code: string) => {
      const name = display?.of(code)
      return name && name !== code ? name : code
    }
  }, [i18n.language])
}

export function useCountryName(): (code: string) => string {
  const { i18n } = useTranslation()
  return useMemo(() => {
    let display: Intl.DisplayNames | undefined
    try {
      display = new Intl.DisplayNames([i18n.language], { type: "region" })
    } catch {
      display = undefined
    }
    return (code: string) => display?.of(code) ?? code
  }, [i18n.language])
}

/**
 * Today's rate as people type it (base units for one unit of the currency), to start a form
 * with; empty when there is no rate, so the person types one.
 */
export function useTodayRate(base: string): (currency: string) => string {
  const { prices } = useMetals()
  return (currency: string) => {
    const rate = unitRate(currency, base, prices.perUsd)
    return rate === null ? "" : String(Number(rate.toPrecision(6)))
  }
}
