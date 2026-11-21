import { api, unwrap } from "../api/client"
import { readMeta, writeMeta } from "../db/meta"
import { minorUnitsPerMajor } from "../domain/money/format"

const MICROS = 1_000_000
const CATALOGUE_KEY = "market.currencyCatalogue"

export const IRAQ = "IQ"

export interface CurrencyCatalogue {
  currencies: string[]
  countries: { code: string; currency: string }[]
}

/** Offered before sign-in too, for the registration form; the device keeps the last copy. */
export async function loadCatalogue(): Promise<CurrencyCatalogue> {
  try {
    const fresh = await unwrap(api().GET("/api/v1/market/currencies"))
    await writeMeta(CATALOGUE_KEY, fresh)
    return fresh
  } catch (error) {
    const cached = await readMeta<CurrencyCatalogue>(CATALOGUE_KEY)
    if (cached) return cached
    throw error
  }
}

/**
 * Whole units of each currency per US dollar: the world list, the dollar itself, and the dinar
 * at the household's own dollar rate (ADR rates-2).
 */
export function perUsdTable(world: { currency: string; perUsd: number }[], usdIqdMicros: number): Record<string, number> {
  const table: Record<string, number> = {}
  for (const rate of world) table[rate.currency] = rate.perUsd
  table.USD = 1
  if (usdIqdMicros > 0) table.IQD = usdIqdMicros / MICROS
  else delete table.IQD
  return table
}

/** Base minor units per US dollar, in micros; 0 while the base currency has no rate. */
export function usdToBaseMicros(base: string, perUsd: Record<string, number>): number {
  const units = perUsd[base]
  return units ? Math.round(units * minorUnitsPerMajor(base) * MICROS) : 0
}

/**
 * Today's rate for a record in {@code currency}, as stored (ADR rates-1): base minor units per
 * minor unit of the currency, in micros. 0 while either side has no rate.
 */
export function marketFxRateMicros(currency: string, base: string, perUsd: Record<string, number>): number {
  if (currency === base) return MICROS
  const from = perUsd[currency]
  const to = perUsd[base]
  if (!from || !to) return 0
  return Math.round((to / from) * MICROS * (minorUnitsPerMajor(base) / minorUnitsPerMajor(currency)))
}

/** Whole units of {@code to} per unit of {@code from}, for showing and for a base change; null without rates. */
export function unitRate(from: string, to: string, perUsd: Record<string, number>): number | null {
  if (from === to) return 1
  const a = perUsd[from]
  const b = perUsd[to]
  return a && b ? b / a : null
}

/** An amount in any currency's minor units, in base minor units at today's rates; null without a rate. */
export function inBase(amount: number, currency: string, base: string, perUsd: Record<string, number>): number | null {
  const rate = marketFxRateMicros(currency, base, perUsd)
  return rate ? Math.round((amount * rate) / MICROS) : null
}

/** Those Iraqis ask about most, listed first for them; others start from the world's main currencies. */
const IRAQ_DEFAULTS = ["USD", "EUR", "TRY", "IRR", "SAR", "AED", "JOD", "KWD", "GBP", "CNY", "SYP", "EGP", "LBP"]
const WORLD_DEFAULTS = ["USD", "EUR", "GBP", "JPY", "CNY", "CHF", "CAD", "AUD", "TRY", "SAR", "AED"]

/** The currencies a person follows on the Prices screen, never the household's own. */
export function trackedCurrencies(session: { country?: string; trackedCurrencies?: string[]; baseCurrency: string } | null | undefined): string[] {
  const chosen = session?.trackedCurrencies?.length ? session.trackedCurrencies : (session?.country ?? IRAQ) === IRAQ ? IRAQ_DEFAULTS : WORLD_DEFAULTS
  return chosen.filter((code) => code !== session?.baseCurrency)
}
