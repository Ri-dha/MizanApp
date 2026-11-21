import { api, unwrap } from "../api/client"
import { readMeta, writeMeta } from "../db/meta"

const DAY_MS = 86_400_000
const RATES_KEY = "market.worldRates"
const HISTORY_PREFIX = "market.worldRates.history."

export interface WorldRate {
  currency: string
  perUsd: number
  day: string
}

export interface WorldRates {
  source: string
  rates: WorldRate[]
}

export interface WorldPoint {
  day: string
  perUsd: number
}

/** T-world-rates: pulled with every sync like the quotes, so the converter works offline. */
export async function refreshWorldRates(): Promise<WorldRates> {
  const fresh = await unwrap(api().GET("/api/v1/market/world-rates"))
  const rates: WorldRates = { source: fresh.source, rates: fresh.rates.map((r) => ({ currency: r.currency, perUsd: Number(r.perUsd), day: r.day })) }
  await writeMeta(RATES_KEY, rates)
  return rates
}

export async function cachedWorldRates(): Promise<WorldRates | undefined> {
  return readMeta<WorldRates>(RATES_KEY)
}

const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10)

export async function cachedWorldHistory(currency: string): Promise<WorldPoint[] | undefined> {
  return readMeta<WorldPoint[]>(HISTORY_PREFIX + currency)
}

/** A year of daily rates per US dollar, kept on the device for the next visit. */
export async function refreshWorldHistory(currency: string, days = 365): Promise<WorldPoint[]> {
  const points = await unwrap(api().GET("/api/v1/market/world-rates/history", {
    params: { query: { currency, from: isoDay(Date.now() - days * DAY_MS), to: isoDay(Date.now()) } },
  }))
  const history = points.map((p) => ({ day: p.day, perUsd: Number(p.perUsd) }))
  await writeMeta(HISTORY_PREFIX + currency, history)
  return history
}
