import { useState } from "react"
import { useTranslation } from "react-i18next"

import { formatMoney } from "@mizan/core/domain/money/format"
import { RANGES, SERIES, SERIES_KEYS, type Range, type SeriesKey } from "@mizan/core/market/series"
import { useIraqi } from "@/hooks/use-currency"
import { usePriceSeries } from "@/hooks/use-market"
import { preferences } from "@/preferences"
import { DATE_TIME, formatWhen } from "@/utils/dates"

const SHORT_RANGES: ReadonlySet<Range> = new Set(["1D", "1W"])
const COMPACT_FROM = 100_000
const CENTS = 100
const CHANGES_LISTED = 20
const WORLD_SERIES: SeriesKey[] = ["goldSpot"]

/** The dollar moves a few dinars at a time, so its axis needs whole numbers; gold per mithqal does not. */
function axisNumber(value: number): string {
  return new Intl.NumberFormat("en", value >= COMPACT_FROM ? { notation: "compact", maximumFractionDigits: 2 } : { maximumFractionDigits: 0 }).format(value)
}

const direction = (value: number) => (value > 0 ? ("up" as const) : value < 0 ? ("down" as const) : ("flat" as const))

/** T-price-history: every recorded change of the dollar, gold and silver. */
export function usePricesScreen() {
  const { t, i18n } = useTranslation()
  // The dinar series are the Baghdad market's; elsewhere only the world gold price applies (ADR currency-1).
  const iraqi = useIraqi()
  const keys = iraqi ? SERIES_KEYS : WORLD_SERIES
  const [chosen, setKey] = useState<SeriesKey>(iraqi ? "usdMarket" : "goldSpot")
  const key = keys.includes(chosen) ? chosen : keys[0]
  const [range, setRange] = useState<Range>("1M")
  const series = usePriceSeries(key, range)
  const official = usePriceSeries("usdOfficial", "1D")
  const usd = SERIES[key].unit === "usdPerOunce"
  const locale = i18n.language
  // Prices, not amounts: shown in their own currency even while amounts are shown in another one.
  const digits = preferences().digitStyle
  const format = (value: number) => (usd ? formatMoney(Math.round(value * CENTS), "USD", locale, digits) : formatMoney(Math.round(value), "IQD", locale, digits))
  const signed = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${format(Math.abs(value))}`
  const percent = (value: number, base: number) => (base === 0 ? "" : `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs((value / base) * 100).toFixed(2)}%`)
  const when = (iso: string) => formatWhen(iso, locale, DATE_TIME)
  const tick = (iso: string) => formatWhen(iso, locale, SHORT_RANGES.has(range) ? { day: "numeric", hour: "2-digit" } : { month: "short", day: "numeric" })

  const latest = series.changes[0]
  const first = series.points[0]
  const moved = latest && first ? latest.value - first.value : null
  const officialNow = official.changes[0]?.value
  const gap = key === "usdMarket" && latest && officialNow ? ((latest.value - officialNow) / officialNow) * 100 : null

  return {
    iraqi, key, range, axisNumber,
    seriesOptions: keys.map((k) => ({ value: k as string, label: t(`prices.series.${k}`) })),
    setKey: (next: string | null) => { if (next) setKey(next as SeriesKey) },
    rangeOptions: RANGES.map((r) => ({ value: r as string, label: t(`prices.ranges.${r}`) })),
    setRange: (next: string | null) => { if (next) setRange(next as Range) },
    heading: `${t(`prices.series.${key}`)} · ${t(`prices.units.${SERIES[key].unit}`)}`,
    seriesLabel: t(`prices.series.${key}`),
    latest: latest ? format(latest.value) : "—",
    moved: moved !== null && first ? { text: `${signed(moved)} (${percent(moved, first.value)}) ${t(`prices.since.${range}`)}`, direction: direction(moved) } : null,
    gap: gap !== null ? t("prices.gap", { percent: gap.toFixed(1) }) : null,
    updated: latest ? t("prices.updated", { when: when(latest.at), source: latest.source }) : null,
    loading: series.loading,
    chart: series.points.length < 2 ? null : { labels: series.points.map((p) => tick(p.at)), values: series.points.map((p) => p.value), step: SHORT_RANGES.has(range) },
    changes: series.changes.slice(0, CHANGES_LISTED).map((c) => {
      const delta = c.previous === null ? null : c.value - c.previous
      return {
        id: c.id,
        value: format(c.value),
        detail: `${when(c.at)} · ${c.source}`,
        delta: delta === null || c.previous === null ? null : `${signed(delta)} (${percent(delta, c.previous)})`,
        direction: delta === null ? ("flat" as const) : direction(delta),
      }
    }),
  }
}

export type PricesScreenModel = ReturnType<typeof usePricesScreen>
