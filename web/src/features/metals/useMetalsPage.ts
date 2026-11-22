import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { useSession } from "@/api/auth"
import { formatCount } from "@/app/dates"
import { describeError } from "@/app/errors"
import { formatMoney } from "@/app/money"
import { usePreferences } from "@/app/preferences"
import type { Metal, MetalLot } from "@/db/schema"
import { fetchLiveQuotes } from "@/market/store"
import { useScreenTour } from "@/tours/useTour"
import { perGramFor, priceTable, realisedGain, undoSale } from "@mizan/core/db/metals"
import { useMetals } from "./useMetals"

/** Rates for a household not counting in dinars come from the daily world list (ADR rates-2). */
export const WORLD_SOURCE = { kind: "feed" as const, label: "frankfurter.dev", at: null, stale: false }

export const METALS = ["GOLD", "SILVER"] as const

export function useMetalsPage() {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const dinar = base === "IQD"
  const view = useMetals()
  const [editing, setEditing] = useState<MetalLot | null | "new">(null)
  const [selling, setSelling] = useState<Metal | null>(null)
  const [overriding, setOverriding] = useState(false)
  const [settings, setSettings] = useState(false)
  const [explaining, setExplaining] = useState(false)
  const [zakat, setZakat] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const prefs = usePreferences()
  useScreenTour("metals")

  async function refreshPrices() {
    setRefreshing(true)
    try {
      await fetchLiveQuotes()
      toast(t("metals.refreshed"))
    } catch (e) {
      toast(describeError(e))
    } finally {
      setRefreshing(false)
    }
  }

  const money = (v: number) => formatMoney(v, base, i18n.language)
  const openLots = view.valued.filter((v) => v.remainingMg > 0)

  return {
    view,
    base,
    dinar,
    language: i18n.language,
    money,
    signed: (v: number) => (v > 0 ? "+" : "") + money(v),
    usd: (micros: number) => formatMoney(Math.round(micros / 1e4), "USD", i18n.language),
    grams: (mg: number) => `${formatCount(mg / 1000, i18n.language, { maximumFractionDigits: 3 })} g`,
    table: priceTable(view.prices, view.setting),
    goldAt: view.prices.spot.GOLD.source.at,
    showUsdNote: prefs.showUsd === false,
    openLots,
    canSell: (metal: Metal) => openLots.some((v) => v.lot.metal === metal),
    totals: view.lines.reduce((acc, l) => ({ cost: acc.cost + l.costBasis, value: acc.value + l.valueNow, gain: acc.gain + l.gain, gainX: acc.gainX + l.gainExcludingMaking }), { cost: 0, value: 0, gain: 0, gainX: 0 }),
    sales: view.disposals.map((disposal) => ({ disposal, realised: realisedGain(disposal, view.disposalLots) })),
    undoSale: (disposal: (typeof view.disposals)[number]) => void undoSale(disposal, view.disposalLots),
    perGram24k: { GOLD: perGramFor("GOLD", 9990, view.prices, view.setting), SILVER: perGramFor("SILVER", 9990, view.prices, view.setting) },
    online: navigator.onLine,
    refreshing,
    refreshPrices,
    editing, setEditing,
    selling, setSelling,
    overriding, setOverriding,
    settings, setSettings,
    explaining, setExplaining,
    zakat, setZakat,
  }
}

export type MetalsPageModel = ReturnType<typeof useMetalsPage>
