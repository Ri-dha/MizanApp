import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { IRAQ, loadCatalogue, unitRate, type CurrencyCatalogue } from "@mizan/core/market/currency"
import { NAMES } from "@/i18n/names.generated"
import { useSession } from "./use-core"
import { useMetals } from "./use-views"

let shared: Promise<CurrencyCatalogue> | null = null

/** The offered currencies and countries, fetched once per launch and kept on the device. */
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

/** Hermes has no Intl.DisplayNames, so names come from the table baked in at build time (scripts/bundle-names.mjs). */
function namer(language: string, kind: "currencies" | "countries"): (code: string) => string {
  const table = NAMES[language.startsWith("ar") ? "ar" : "en"][kind]
  return (code: string) => table[code] ?? code
}

/** A currency's name in the app's language, or its code when none is known. */
export function useCurrencyName(): (code: string) => string {
  const { i18n } = useTranslation()
  return useMemo(() => namer(i18n.language, "currencies"), [i18n.language])
}

export function useCountryName(): (code: string) => string {
  const { i18n } = useTranslation()
  return useMemo(() => namer(i18n.language, "countries"), [i18n.language])
}

/** Today's rate as people type it (base units for one unit of the currency); empty without a rate, so the person types one. */
export function useTodayRate(base: string): (currency: string) => string {
  const { prices } = useMetals()
  return (currency: string) => {
    const rate = unitRate(currency, base, prices.perUsd)
    return rate === null ? "" : String(Number(rate.toPrecision(6)))
  }
}

/** ADR currency-1: the Baghdad market and Central Bank screens are for people in Iraq. */
export function useIraqi(): boolean {
  return (useSession()?.country ?? IRAQ) === IRAQ
}
