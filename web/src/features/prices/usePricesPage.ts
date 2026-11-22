import { useState } from "react"
import { useTranslation } from "react-i18next"

import { DATE, DATE_TIME, formatWhen } from "@/app/dates"
import { formatMoney } from "@/app/money"
import { usePreferences } from "@/app/preferences"
import { useIraqi } from "@/app/region"
import { SERIES, SERIES_KEYS, usePriceSeries, type Range, type SeriesKey } from "@/market/prices"

const WORLD_SERIES: SeriesKey[] = ["goldSpot"]
const SHORT_RANGES: ReadonlySet<Range> = new Set(["1D", "1W"])
const COMPACT_FROM = 100_000

/** The dollar moves a few dinars at a time, so its axis needs whole numbers; gold per mithqal does not. */
export function axisNumber(value: number): string {
  return new Intl.NumberFormat("en", value >= COMPACT_FROM ? { notation: "compact", maximumFractionDigits: 2 } : { maximumFractionDigits: 0 }).format(value)
}

/** T-price-history: every recorded change of the dollar, gold and silver, for anyone signed in. */
export function usePricesPage() {
  const { i18n } = useTranslation()
  usePreferences()
  // The dinar series are the Baghdad market's; elsewhere only the world gold price applies (ADR currency-1).
  const iraqi = useIraqi()
  const keys = iraqi ? SERIES_KEYS : WORLD_SERIES
  const [chosen, setKey] = useState<SeriesKey>(iraqi ? "usdMarket" : "goldSpot")
  const key = keys.includes(chosen) ? chosen : keys[0]
  const [range, setRange] = useState<Range>("1M")
  const series = usePriceSeries(key, range)
  const official = usePriceSeries("usdOfficial", "1D")
  const usd = SERIES[key].unit === "usdPerOunce"
  const locale = i18n.language === "ar" ? "ar-IQ" : "en-GB"

  const format = (value: number) => (usd ? formatMoney(Math.round(value * 100), "USD", i18n.language) : formatMoney(Math.round(value), "IQD", i18n.language))
  const formatSigned = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${format(Math.abs(value))}`
  const percent = (value: number, base: number) => (base === 0 ? "" : `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs((value / base) * 100).toFixed(2)}%`)
  const when = (iso: string, withTime: boolean) => formatWhen(iso, locale, withTime ? DATE_TIME : DATE)

  const latest = series.changes[0]
  const first = series.points[0]
  const moved = latest && first ? latest.value - first.value : null
  const officialNow = official.changes[0]?.value
  const gap = key === "usdMarket" && latest && officialNow ? ((latest.value - officialNow) / officialNow) * 100 : null
  const shortRange = SHORT_RANGES.has(range)

  return {
    iraqi,
    keys,
    seriesKey: key,
    setKey,
    range,
    setRange,
    unit: SERIES[key].unit,
    loading: series.loading,
    latest,
    moved: moved !== null && first ? { value: moved, text: `${formatSigned(moved)} (${percent(moved, first.value)})` } : null,
    gap,
    data: series.points.map((p) => ({ at: p.at, value: p.value })),
    changes: series.changes.map((c) => {
      const delta = c.previous === null ? null : c.value - c.previous
      return { id: c.id, at: when(c.at, true), value: format(c.value), source: c.source, delta, deltaText: delta === null ? null : `${formatSigned(delta)} (${percent(delta, c.previous!)})` }
    }),
    format,
    when,
    shortRange,
    tick: (iso: string) => formatWhen(iso, locale, shortRange ? { day: "numeric", hour: "2-digit" } : { month: "short", day: "numeric" }),
  }
}

export type PricesPageModel = ReturnType<typeof usePricesPage>
