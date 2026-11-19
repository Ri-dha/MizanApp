import { Stack } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { RANGES, SERIES, SERIES_KEYS, type Range, type SeriesKey } from "@mizan/core/market/series"
import { LineChart } from "@/components/charts/line-chart"
import { Chips } from "@/components/chips"
import { Group, Row } from "@/components/row"
import { Screen } from "@/components/screen"
import { ThemedText } from "@/components/themed-text"
import { usePriceSeries } from "@/hooks/use-market"
import { spacing, useBrandColors } from "@/theme"
import { formatMoney } from "@/utils/money"

const SHORT_RANGES: ReadonlySet<Range> = new Set(["1D", "1W"])
const COMPACT_FROM = 100_000
const CENTS = 100
const CHANGES_LISTED = 20

/** The dollar moves a few dinars at a time, so its axis needs whole numbers; gold per mithqal does not. */
function axisNumber(value: number): string {
  return new Intl.NumberFormat("en", value >= COMPACT_FROM ? { notation: "compact", maximumFractionDigits: 2 } : { maximumFractionDigits: 0 }).format(value)
}

/** T-price-history: every recorded change of the dollar, gold and silver. */
export function Prices() {
  const { t, i18n } = useTranslation()
  const brand = useBrandColors()
  const [key, setKey] = useState<SeriesKey>("usdMarket")
  const [range, setRange] = useState<Range>("1M")
  const series = usePriceSeries(key, range)
  const official = usePriceSeries("usdOfficial", "1D")
  const usd = SERIES[key].unit === "usdPerOunce"
  const locale = i18n.language === "ar" ? "ar-IQ-u-nu-latn" : "en-GB"
  const format = (value: number) => (usd ? formatMoney(Math.round(value * CENTS), "USD", i18n.language) : formatMoney(Math.round(value), "IQD", i18n.language))
  const signed = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${format(Math.abs(value))}`
  const percent = (value: number, base: number) => (base === 0 ? "" : `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs((value / base) * 100).toFixed(2)}%`)
  const when = (iso: string, withTime: boolean) => new Intl.DateTimeFormat(locale, withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }).format(new Date(iso))
  const tick = (iso: string) => new Intl.DateTimeFormat(locale, SHORT_RANGES.has(range) ? { day: "numeric", hour: "2-digit" } : { month: "short", day: "numeric" }).format(new Date(iso))
  const moveColour = (v: number) => (v > 0 ? { color: brand.chart[3] } : v < 0 ? { color: brand.destructive } : null)

  const latest = series.changes[0]
  const first = series.points[0]
  const moved = latest && first ? latest.value - first.value : null
  const officialNow = official.changes[0]?.value
  const gap = key === "usdMarket" && latest && officialNow ? ((latest.value - officialNow) / officialNow) * 100 : null

  return (
    <Screen>
      <Stack.Screen options={{ title: t("prices.title") }} />
      <Chips testID="prices-series" options={SERIES_KEYS.map((k) => ({ value: k, label: t(`prices.series.${k}`) }))} value={key} onChange={(next) => next && setKey(next as SeriesKey)} />
      <View style={styles.section}>
        <ThemedText variant="caption">{`${t(`prices.series.${key}`)} · ${t(`prices.units.${SERIES[key].unit}`)}`}</ThemedText>
        <ThemedText testID="prices-latest" variant="largeTitle">{latest ? format(latest.value) : "—"}</ThemedText>
        {moved !== null && first ? <ThemedText variant="subhead" style={moveColour(moved)}>{`${signed(moved)} (${percent(moved, first.value)}) ${t(`prices.since.${range}`)}`}</ThemedText> : null}
        {gap !== null ? <ThemedText variant="caption">{t("prices.gap", { percent: gap.toFixed(1) })}</ThemedText> : null}
        {latest ? <ThemedText variant="caption">{t("prices.updated", { when: when(latest.at, true), source: latest.source })}</ThemedText> : null}
      </View>
      <Chips testID="prices-range" options={RANGES.map((r) => ({ value: r, label: t(`prices.ranges.${r}`) }))} value={range} onChange={(next) => next && setRange(next as Range)} />
      {series.points.length < 2 ? (
        <ThemedText variant="subhead">{series.loading ? t("common.loading") : t("prices.notEnough")}</ThemedText>
      ) : (
        <LineChart
          testID="prices-chart"
          formatY={axisNumber}
          labels={series.points.map((p) => tick(p.at))}
          series={[{ key, label: t(`prices.series.${key}`), colour: brand.primary, values: series.points.map((p) => p.value), step: SHORT_RANGES.has(range) }]}
        />
      )}
      <View style={styles.section}>
        <ThemedText variant="headline">{t("prices.changes")}</ThemedText>
        <ThemedText variant="caption">{t("prices.changesBody")}</ThemedText>
        <Group>
          {series.changes.length === 0 ? <Row last><ThemedText variant="subhead">{t("prices.noChanges")}</ThemedText></Row> : null}
          {series.changes.slice(0, CHANGES_LISTED).map((c, index, shown) => {
            const delta = c.previous === null ? null : c.value - c.previous
            return (
              <Row key={c.id} last={index === shown.length - 1} trailing={<ThemedText style={delta === null ? null : moveColour(delta)}>{delta === null ? t("prices.firstPrice") : `${signed(delta)} (${percent(delta, c.previous!)})`}</ThemedText>}>
                <ThemedText>{format(c.value)}</ThemedText>
                <ThemedText variant="caption">{`${when(c.at, true)} · ${c.source}`}</ThemedText>
              </Row>
            )
          })}
        </Group>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  section: { gap: spacing.xs },
})
