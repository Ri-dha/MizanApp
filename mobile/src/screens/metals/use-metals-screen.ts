import { router } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { priceTable, realisedGain, undoSale } from "@mizan/core/db/metals"
import { fetchLiveQuotes } from "@mizan/core/market/prices"
import type { Metal } from "@mizan/core/schema"
import { useSession } from "@/hooks/use-core"
import { useMetals } from "@/hooks/use-views"
import { useScreenTour } from "@/tours"
import { formatWhen } from "@/utils/dates"
import { describeError } from "@/utils/errors"
import { formatMoney } from "@/utils/money"
import { grams, wholeFromMicros } from "./format"

const METALS: Metal[] = ["GOLD", "SILVER"]
const USD_MINOR_PER_MICROS = 1e4
const WORLD_SOURCE = "frankfurter.dev"

/** Everything the Gold & silver screen knows and can do; the templates only decide how it is drawn (ADR styles-1). */
export function useMetalsScreen() {
  const { t, i18n } = useTranslation()
  useScreenTour("metals")
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  // The dollar kind, the sell-or-hold history and the Baghdad dealer only mean something to a household counting in dinars.
  const dinar = base === "IQD"
  const view = useMetals()
  const [refreshing, setRefreshing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const money = (v: number) => formatMoney(v, base, i18n.language)
  const usd = (micros: number) => formatMoney(Math.round(micros / USD_MINOR_PER_MICROS), "USD", i18n.language)
  const signed = (v: number) => (v > 0 ? "+" : "") + money(v)
  const openLots = view.valued.filter((v) => v.remainingMg > 0)
  const totals = view.lines.reduce((acc, l) => ({ cost: acc.cost + l.costBasis, value: acc.value + l.valueNow, gain: acc.gain + l.gain, gainX: acc.gainX + l.gainExcludingMaking }), { cost: 0, value: 0, gain: 0, gainX: 0 })
  const gold = view.prices.spot.GOLD
  const metalName = (metal: Metal) => t(`metals.metal.${metal}`)
  const sourceLabel = (kind: string, label: string) => (kind === "override" ? t("metals.sources.override") : kind === "feed" || kind === "local" ? label : t("metals.sources.none"))

  async function refresh() {
    setRefreshing(true)
    try {
      await fetchLiveQuotes()
      setMessage(t("metals.refreshed"))
    } catch (e) {
      setMessage(describeError(e))
    } finally {
      setRefreshing(false)
    }
  }

  function spotLine(metal: Metal) {
    const spot = view.prices.spot[metal]
    if (spot.perGram24kOverrideMicros !== null) return `${money(wholeFromMicros(spot.perGram24kOverrideMicros))}/g`
    return `$${(spot.spotUsdPerOzMicros / 1e6).toFixed(2)}/oz`
  }

  return {
    view, base, dinar, message, refreshing,
    refresh: () => void refresh(),
    addLot: () => router.push("/metal-lot"),
    gain: signed(totals.gain),
    gainNegative: totals.gain < 0,
    totalsLine: `${t("metals.costBasis")}: ${money(totals.cost)} · ${t("metals.valueNow")}: ${money(totals.value)}${view.setting?.valuationBasis === "BUYBACK" ? ` · ${t("metals.buybackBadge")}` : ""}`,
    excludingMaking: t("metals.excludingMaking", { amount: signed(totals.gainX) }),
    lines: view.lines.map((line) => ({
      key: `${line.metal}-${line.purityLabel}`,
      name: `${metalName(line.metal)} ${line.purityLabel} · ${grams(line.weightMg, i18n.language)}`,
      cost: `${t("metals.costBasis")} ${money(line.costBasis)}`,
      value: `${t("metals.valueNow")} ${money(line.valueNow)}`,
      gain: signed(line.gain),
      negative: line.gain < 0,
    })),
    sells: METALS.map((metal) => ({
      metal,
      title: t("metals.sell", { metal: metalName(metal) }),
      disabled: !openLots.some((v) => v.lot.metal === metal),
      open: () => router.push({ pathname: "/metal-sell", params: { metal } }),
    })),
    priceNote: `${gold.source.at ? t("metals.priceTableBody", { at: formatWhen(gold.source.at, i18n.language), source: gold.source.label }) : t("metals.priceTableNoPrice")}${gold.source.stale ? ` · ${t("metals.stale")}` : ""}`,
    prices: priceTable(view.prices, view.setting).map((row) => ({
      key: `${row.metal}-${row.purityLabel}`,
      name: `${metalName(row.metal)} ${row.purityLabel}`,
      detail: `${money(wholeFromMicros(row.perMithqalMicros))}/${t("metals.units.MITHQAL")} · ${usd(row.perGramUsdMicros)}/g`,
      perGram: `${money(wholeFromMicros(row.perGramMicros))}/g`,
    })),
    sources: [
      ...METALS.map((metal) => ({
        key: metal as string,
        label: `${metalName(metal)}: ${spotLine(metal)}`,
        source: sourceLabel(view.prices.spot[metal].source.kind, view.prices.spot[metal].source.label),
        stale: view.prices.spot[metal].source.stale,
      })),
      dinar
        ? { key: "rate", label: `USD → ${base} (${t(`metals.rateKinds.${view.prices.rateKind}`)}): ${money(wholeFromMicros(view.prices.usdIqdMicros))}`, source: sourceLabel(view.prices.rateSource.kind, view.prices.rateSource.label), stale: false }
        // Rates for a household not counting in dinars come from the daily world list (ADR rates-2).
        : { key: "rate", label: `USD → ${base}: ${money(wholeFromMicros(view.prices.usdBaseMicros))}`, source: WORLD_SOURCE, stale: false },
    ],
    lots: openLots.map((v) => ({
      id: v.lot.id,
      href: { pathname: "/metal-lot" as const, params: { id: v.lot.id } },
      name: `${metalName(v.lot.metal)} ${v.lot.purityLabel} · ${grams(v.remainingMg, i18n.language)} · ${t(`metals.forms.${v.lot.form}`)}`,
      detail: `${v.lot.purchaseDate}${v.lot.dealer ? ` · ${v.lot.dealer}` : ""} · ${t("metals.perGram", { cost: money(v.costPerGramBase), now: money(v.perGramNowBase) })}`,
      value: money(v.valueNow),
      gain: `${signed(v.gain)}${v.gainPercent !== null ? ` (${v.gainPercent}%)` : ""}`,
      negative: v.gain < 0,
    })),
    sales: view.disposals.map((d) => {
      const r = realisedGain(d, view.disposalLots)
      return {
        id: d.id,
        name: `${d.soldOn} · ${metalName(d.metal)} ${grams(d.weightMg, i18n.language)}`,
        gain: signed(r.gain),
        negative: r.gain < 0,
        detail: `${t(`metals.methods.${d.method}`)} · ${t("metals.excludingMaking", { amount: signed(r.gainExcludingMaking) })}`,
        undo: () => void undoSale(d, view.disposalLots),
      }
    }),
  }
}

export type MetalsScreenModel = ReturnType<typeof useMetalsScreen>
