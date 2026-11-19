import { api, unwrap } from "../api/client"
import { readMeta, writeMeta } from "../db/meta"
import type { Quote } from "./prices"

type Instrument = Quote["instrument"]

const MICROS = 1_000_000
const MITHQAL_GRAMS = 5
const KARAT_21 = 0.875
const DAY_MS = 86_400_000
const CACHE_PREFIX = "prices.series."

/** What the Prices screen charts; each maps a stored instrument to the number people quote. */
export const SERIES = {
  usdMarket: { instrument: "USDIQD_PARALLEL", unit: "iqdPerUsd", scale: 1 / MICROS },
  usdOfficial: { instrument: "USDIQD_OFFICIAL", unit: "iqdPerUsd", scale: 1 / MICROS },
  gold21Mithqal: { instrument: "XAU_LOCAL", unit: "iqdPerMithqal", scale: (KARAT_21 * MITHQAL_GRAMS) / MICROS },
  gold24Gram: { instrument: "XAU_LOCAL", unit: "iqdPerGram", scale: 1 / MICROS },
  silverGram: { instrument: "XAG_LOCAL", unit: "iqdPerGram", scale: 1 / MICROS },
  goldSpot: { instrument: "XAU", unit: "usdPerOunce", scale: 1 / MICROS },
} as const satisfies Record<string, { instrument: Instrument; unit: string; scale: number }>

export type SeriesKey = keyof typeof SERIES
export const SERIES_KEYS = Object.keys(SERIES) as SeriesKey[]

export type Range = "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL"
export const RANGES: Range[] = ["1D", "1W", "1M", "3M", "1Y", "ALL"]

/** Short ranges plot every recorded change; longer ones plot a close per day, week or month. */
const RANGE_PLAN: Record<Range, { days: number; source: "changes" | "DAY" | "WEEK" | "MONTH" }> = {
  "1D": { days: 1, source: "changes" },
  "1W": { days: 7, source: "changes" },
  "1M": { days: 31, source: "DAY" },
  "3M": { days: 92, source: "DAY" },
  "1Y": { days: 366, source: "WEEK" },
  ALL: { days: 1825, source: "MONTH" },
}

export interface Point {
  at: string
  value: number
}

export interface Change {
  id: number
  at: string
  value: number
  previous: number | null
  source: string
}

export interface Series {
  points: Point[]
  changes: Change[]
  fetchedAt: number | null
}

export const EMPTY_SERIES: Series = { points: [], changes: [], fetchedAt: null }
const CHANGES_SHOWN = 50

const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10)

export async function fetchSeries(key: SeriesKey, range: Range): Promise<Series> {
  const { instrument, scale } = SERIES[key]
  const plan = RANGE_PLAN[range]
  const from = Date.now() - plan.days * DAY_MS
  const page = await unwrap(api().GET("/api/v1/market/changes", { params: { query: { instrument, limit: CHANGES_SHOWN } } }))
  const changes: Change[] = (page.changes ?? []).map((c) => ({
    id: c.id ?? 0,
    at: c.observedAt ?? "",
    value: (c.priceMicros ?? 0) * scale,
    previous: c.previousMicros == null ? null : c.previousMicros * scale,
    source: c.source ?? "",
  }))
  let points: Point[]
  if (plan.source === "changes") {
    const recent = await unwrap(api().GET("/api/v1/market/changes", {
      params: { query: { instrument, from: new Date(from).toISOString(), limit: 500 } },
    }))
    const inRange = (recent.changes ?? []).map((c) => ({ at: c.observedAt ?? "", value: (c.priceMicros ?? 0) * scale })).reverse()
    const before = (recent.changes ?? []).at(-1)?.previousMicros
    points = before == null ? inRange : [{ at: new Date(from).toISOString(), value: before * scale }, ...inRange]
  } else {
    const history = await unwrap(api().GET("/api/v1/market/history", {
      params: { query: { instrument, from: isoDay(from), to: isoDay(Date.now()), interval: plan.source } },
    }))
    points = history.map((p) => ({ at: p.day ?? "", value: (p.priceMicros ?? 0) * scale }))
  }
  return { points, changes, fetchedAt: Date.now() }
}


const seriesCacheKey = (key: SeriesKey, range: Range) => `${CACHE_PREFIX}${key}.${range}`

export const cachedSeries = (key: SeriesKey, range: Range) => readMeta<Series>(seriesCacheKey(key, range))

/** Fetches and keeps the copy each app shows first, so the screen works offline. */
export async function refreshSeries(key: SeriesKey, range: Range): Promise<Series> {
  const fresh = await fetchSeries(key, range)
  await writeMeta(seriesCacheKey(key, range), fresh)
  return fresh
}

export type HistoryInstrument = Quote["instrument"]
export type History = Partial<Record<HistoryInstrument, Record<string, number>>>

const HISTORY_KEY = "market.history"
const DAYS = 365

export async function fetchHistory(instrument: HistoryInstrument): Promise<Record<string, number>> {
  const to = new Date().toISOString().slice(0, 10)
  const from = new Date(Date.now() - DAYS * 86_400_000).toISOString().slice(0, 10)
  const points = await unwrap(api().GET("/api/v1/market/history", { params: { query: { instrument, from, to } } }))
  return Object.fromEntries(points.map((p) => [p.day ?? "", p.priceMicros ?? 0]))
}


export const cachedHistory = async (): Promise<History> => (await readMeta<History>(HISTORY_KEY)) ?? {}

/** Daily closes for charts (FR-MTL-08); an instrument that fails keeps its cached series. */
export async function refreshHistory(instruments: HistoryInstrument[]): Promise<History> {
  const fresh: History = await cachedHistory()
  for (const instrument of instruments) {
    try {
      fresh[instrument] = await fetchHistory(instrument)
    } catch {
      // keep the cached series for this instrument
    }
  }
  await writeMeta(HISTORY_KEY, fresh)
  return fresh
}
