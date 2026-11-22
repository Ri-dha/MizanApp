import { router } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { currentValue, liveAssets, liveValuations, realisedGain, removeValuation, unsellAsset, valuationsOf } from "@mizan/core/db/assets"
import { todayIso } from "@mizan/core/domain/calendar/month"
import type { Asset, AssetType } from "@mizan/core/schema"
import { rows } from "@mizan/core/store/store"
import { useLiveQuery, useSession } from "@/hooks/use-core"
import { useMetals } from "@/hooks/use-views"
import { usePreferences } from "@/preferences"
import { useScreenTour } from "@/tours"
import { SHORT_DATE, formatDay } from "@/utils/dates"
import { formatMoney } from "@/utils/money"

export const ASSET_TYPES: AssetType[] = ["VEHICLE", "PROPERTY", "ELECTRONICS", "EQUIPMENT", "FURNITURE", "LIVESTOCK", "OTHER"]
const RECENT_VALUATIONS = 3

async function runningCosts(): Promise<Record<string, number>> {
  const expenses = await rows("transactions", (x) => x.deletedAt === null && x.type === "EXPENSE" && !!x.assetId)
  const totals: Record<string, number> = {}
  for (const row of expenses) totals[row.assetId!] = (totals[row.assetId!] ?? 0) + row.baseAmount
  return totals
}

/** Counted at today's rate, so marked ≈; amounts the display switch converts are already marked. */
const approximately = (text: string) => (text.startsWith("≈") ? text : `≈ ${text}`)

/** Everything the Other assets screen knows and can do; the templates only decide how it is drawn (ADR styles-1). */
export function useAssetsScreen() {
  const { t, i18n } = useTranslation()
  useScreenTour("assets")
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const assets = useLiveQuery(liveAssets, [], [])
  const valuations = useLiveQuery(liveValuations, [], [])
  const costs = useLiveQuery(runningCosts, [], {})
  const [showSold, setShowSold] = useState(false)
  const prefs = usePreferences()
  const { prices } = useMetals()
  const today = todayIso()
  const money = (v: number, currency = base) => formatMoney(v, currency, i18n.language)
  const signed = (v: number, currency = base) => (v > 0 ? "+" : "") + money(v, currency)
  const date = (iso: string) => formatDay(iso, i18n.language, SHORT_DATE)
  const held = assets.filter((a) => a.status === "HELD")
  const sold = assets.filter((a) => a.status === "SOLD")
  const openAction = (kind: "value" | "sell", asset: Asset) => router.push({ pathname: "/asset-action", params: { id: asset.id, kind } })

  function card(asset: Asset) {
    const value = currentValue(asset, valuations, today, prices)
    const change = value.value - asset.purchasePrice
    const cost = costs[asset.id] ?? 0
    return {
      id: asset.id,
      name: asset.name,
      edit: () => router.push({ pathname: "/asset-edit", params: { id: asset.id } }),
      value: money(value.value, asset.currency),
      inBase: asset.currency !== base ? approximately(money(value.baseValue)) : null,
      attributes: Object.entries(asset.attributes).map(([k, v]) => `${t(`assets.attributes.${k}`)}: ${v}`).join(" · "),
      illiquid: asset.liquidity === "ILLIQUID",
      isPrivate: asset.visibility === "PRIVATE",
      stale: value.monthsSinceBaseline >= prefs.valuationReminderMonths,
      basis: `${t(value.baselineSource === "VALUATION" ? "assets.valueFromValuation" : "assets.valueFromPurchase", { date: date(value.baselineDate) })}${asset.depreciationMethod !== "NONE" ? ` · ${t("assets.depreciatedLine", { months: value.monthsSinceBaseline, rate: asset.annualRateBasisPoints / 100 })}` : ""}`,
      sincePurchase: t("assets.sincePurchase", { amount: signed(change, asset.currency) }),
      lost: change < 0,
      tco: cost > 0 ? t("assets.tco", { costs: money(cost), total: money(asset.purchasePrice + cost - value.value, asset.currency) }) : null,
      addValuation: () => openAction("value", asset),
      sell: () => openAction("sell", asset),
      history: valuationsOf(asset.id, valuations).slice(0, RECENT_VALUATIONS).map((v) => ({
        id: v.id,
        value: money(v.value, asset.currency),
        detail: `${date(v.valuedOn)}${v.note ? ` · ${v.note}` : ""}`,
        undo: () => void removeValuation(v.id),
      })),
    }
  }

  return {
    add: () => router.push("/asset-edit"),
    total: money(held.reduce((sum, a) => sum + currentValue(a, valuations, today, prices).baseValue, 0)),
    count: held.length,
    groups: ASSET_TYPES.filter((type) => held.some((a) => a.type === type)).map((type) => ({ type, title: t(`assets.types.${type}`), cards: held.filter((a) => a.type === type).map(card) })),
    showSold,
    toggleSold: () => setShowSold(!showSold),
    sold: sold.map((asset) => {
      const gain = realisedGain(asset) ?? 0
      return {
        id: asset.id,
        name: asset.name,
        detail: t("assets.soldLine", { date: asset.soldOn ? date(asset.soldOn) : "", price: money(asset.salePrice ?? 0, asset.currency) }),
        gain: signed(gain, asset.currency),
        lost: gain < 0,
        undo: () => void unsellAsset(asset.id),
      }
    }),
  }
}

export type AssetsScreenModel = ReturnType<typeof useAssetsScreen>
