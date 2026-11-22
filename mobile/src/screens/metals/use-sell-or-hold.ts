import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import type { MetalsView } from "@mizan/core/db/metalsView"
import { todayIso } from "@mizan/core/domain/calendar/month"
import { dayRange, holdingsSeries, sellVerdict } from "@mizan/core/domain/metal/series"
import { MICROGRAMS_PER_TROY_OUNCE } from "@mizan/core/domain/metal/valuation"
import type { Metal } from "@mizan/core/schema"
import { formatWhen } from "@/utils/dates"
import { formatMoney } from "@/utils/money"
import { useMarketHistoryFor } from "./history"

const CHART_DAYS = 180
const DAY_MS = 86_400_000
const METALS: Metal[] = ["GOLD", "SILVER"]

/** FR-MTL-08 and FR-MTL-11 together: would selling today gain, and how has that answer moved. */
export function useSellOrHold(view: MetalsView, currency: string) {
  const { t, i18n } = useTranslation()
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
  const hasLots = open.length > 0
  return {
    metalOptions: METALS.map((m) => ({ value: m as string, label: t(`metals.metal.${m}`) })),
    metal: metal as string,
    setMetal: (next: string | null) => { if (next) setMetal(next as Metal) },
    /** Why there is no verdict, when there is none. */
    empty: !hasLots ? t("metals.noLots") : bidPerGram === null ? t("metals.noBid") : null,
    verdict: {
      title: verdict.gain >= 0 ? t("metals.verdictGain") : t("metals.verdictLoss"),
      figure: `${(verdict.gain > 0 ? "+" : "") + money(verdict.gain)}${verdict.gainPercent !== null ? ` (${verdict.gainPercent}%)` : ""}`,
      negative: verdict.gain < 0,
      line: t("metals.verdictLine", { proceeds: money(verdict.proceeds), cost: money(verdict.cost), source: bidQuote?.source ?? "" }),
    },
    breakEven: hasLots && verdict.breakEvenPerGram24kMicros !== null
      ? t("metals.breakEven", { price: money(Math.round(verdict.breakEvenPerGram24kMicros / 1e6)), bid: bidPerGram === null ? "—" : money(Math.round(bidPerGram / 1e6)) })
      : null,
    chart: series.length > 1
      ? {
          labels: series.map((p) => formatWhen(p.day, i18n.language, { day: "numeric", month: "short" })),
          cost: series.map((p) => p.cost),
          valueAsk: series.map((p) => p.valueAsk ?? null),
          valueBid: series.map((p) => p.valueBid ?? null),
        }
      : null,
    grows: series.length <= 1 && hasLots,
  }
}

export type SellOrHoldModel = ReturnType<typeof useSellOrHold>
