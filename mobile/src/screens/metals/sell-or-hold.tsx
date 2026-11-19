import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import type { MetalsView } from "@mizan/core/db/metalsView"
import { todayIso } from "@mizan/core/domain/calendar/month"
import { dayRange, holdingsSeries, sellVerdict } from "@mizan/core/domain/metal/series"
import { MICROGRAMS_PER_TROY_OUNCE } from "@mizan/core/domain/metal/valuation"
import type { Metal } from "@mizan/core/schema"
import { LineChart } from "@/components/charts/line-chart"
import { Chips } from "@/components/chips"
import { ThemedText } from "@/components/themed-text"
import { useMarketHistoryFor } from "./history"
import { spacing, useBrandColors } from "@/theme"
import { formatMoney } from "@/utils/money"

const CHART_DAYS = 180
const DAY_MS = 86_400_000
const METALS: Metal[] = ["GOLD", "SILVER"]

/** FR-MTL-08 and FR-MTL-11 together: would selling today gain, and how has that answer moved. */
export function SellOrHold({ view, currency }: { view: MetalsView; currency: string }) {
  const { t, i18n } = useTranslation()
  const brand = useBrandColors()
  const [metal, setMetal] = useState<Metal>("GOLD")
  const history = useMarketHistoryFor(metal)
  const money = (v: number) => formatMoney(v, currency, i18n.language)
  const open = view.valued.filter((v) => v.lot.metal === metal && v.remainingMg > 0)
  const lots = view.lots.filter((l) => l.metal === metal)
  const bidQuote = view.quotes.find((q) => q.instrument === (metal === "GOLD" ? "XAU_LOCAL_BID" : "XAG_LOCAL_BID"))
  const bidPerGram = bidQuote?.priceMicros ?? null

  const series = useMemo(() => {
    const local = history[metal === "GOLD" ? "XAU_LOCAL" : "XAG_LOCAL"] ?? {}
    const bid = history[metal === "GOLD" ? "XAU_LOCAL_BID" : "XAG_LOCAL_BID"] ?? {}
    const spot = history[metal === "GOLD" ? "XAU" : "XAG"] ?? {}
    const rate = history.USDIQD_PARALLEL ?? {}
    // Before the local feed existed, world spot × the dollar rate stands in for the ask.
    const ask: Record<string, number> = { ...local }
    for (const [day, oz] of Object.entries(spot)) {
      if (ask[day] === undefined && rate[day] !== undefined) ask[day] = Number((BigInt(oz) * BigInt(rate[day]) + MICROGRAMS_PER_TROY_OUNCE / 2n) / MICROGRAMS_PER_TROY_OUNCE)
    }
    const first = lots.map((l) => l.purchaseDate).sort()[0]
    const to = todayIso()
    const from = new Date(Date.parse(to) - CHART_DAYS * DAY_MS).toISOString().slice(0, 10)
    const start = first && first > from ? first : from
    return holdingsSeries(lots, view.disposals, view.disposalLots, dayRange(start, to), { ask, bid }).filter((p) => p.cost > 0 || p.valueAsk)
  }, [history, lots, metal, view.disposals, view.disposalLots])

  const verdict = sellVerdict(open, bidPerGram)
  const dayLabel = (iso: string) => new Intl.DateTimeFormat(i18n.language === "ar" ? "ar-IQ-u-nu-latn" : "en-GB", { day: "numeric", month: "short" }).format(new Date(iso))
  const negative = verdict.gain < 0 ? { color: brand.destructive } : null

  return (
    <View style={styles.section}>
      <ThemedText variant="headline">{t("metals.sellOrHold")}</ThemedText>
      <ThemedText variant="caption">{t("metals.sellOrHoldBody")}</ThemedText>
      <Chips testID="sell-or-hold-metal" options={METALS.map((m) => ({ value: m, label: t(`metals.metal.${m}`) }))} value={metal} onChange={(next) => next && setMetal(next as Metal)} />
      {open.length === 0 ? <ThemedText variant="subhead">{t("metals.noLots")}</ThemedText> : bidPerGram === null ? <ThemedText variant="subhead">{t("metals.noBid")}</ThemedText> : (
        <>
          <ThemedText variant="subhead">{verdict.gain >= 0 ? t("metals.verdictGain") : t("metals.verdictLoss")}</ThemedText>
          <ThemedText testID="sell-verdict" variant="title" style={negative}>{`${(verdict.gain > 0 ? "+" : "") + money(verdict.gain)}${verdict.gainPercent !== null ? ` (${verdict.gainPercent}%)` : ""}`}</ThemedText>
          <ThemedText variant="caption">{t("metals.verdictLine", { proceeds: money(verdict.proceeds), cost: money(verdict.cost), source: bidQuote?.source ?? "" })}</ThemedText>
        </>
      )}
      {open.length > 0 && verdict.breakEvenPerGram24kMicros !== null ? (
        <ThemedText variant="caption">{t("metals.breakEven", { price: money(Math.round(verdict.breakEvenPerGram24kMicros / 1e6)), bid: bidPerGram === null ? "—" : money(Math.round(bidPerGram / 1e6)) })}</ThemedText>
      ) : null}
      {series.length > 1 ? (
        <LineChart
          testID="sell-or-hold-chart"
          labels={series.map((p) => dayLabel(p.day))}
          series={[
            { key: "cost", label: t("metals.seriesNames.cost"), colour: brand.chart[4], values: series.map((p) => p.cost), dashed: true, step: true },
            { key: "valueAsk", label: t("metals.seriesNames.valueAsk"), colour: brand.primary, values: series.map((p) => p.valueAsk ?? null) },
            { key: "valueBid", label: t("metals.seriesNames.valueBid"), colour: brand.chart[3], values: series.map((p) => p.valueBid ?? null) },
          ]}
        />
      ) : open.length > 0 ? <ThemedText variant="caption">{t("metals.seriesGrows")}</ThemedText> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
})
