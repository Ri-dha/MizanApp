import { useLiveQuery } from "dexie-react-hooks"
import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { useSession } from "@/api/auth"
import { useDateFormat } from "@/app/dates"
import { formatMoney, toMinorUnits } from "@/app/money"
import { usePreferences } from "@/app/preferences"
import { db, type Asset, type AssetType } from "@/db/schema"
import { useMetals } from "@/features/metals/useMetals"
import { useScreenTour } from "@/tours/useTour"
import { addValuation, currentValue, liveAssets, liveValuations, realisedGain, removeValuation, sellAsset, unsellAsset, valuationsOf } from "@mizan/core/db/assets"
import { restore, softDelete } from "@mizan/core/db/write"
import { todayIso } from "@mizan/core/domain/calendar/month"
import { inBase } from "@mizan/core/market/currency"

const TYPE_ORDER: AssetType[] = ["VEHICLE", "PROPERTY", "ELECTRONICS", "EQUIPMENT", "FURNITURE", "LIVESTOCK", "OTHER"]
const HISTORY_SHOWN = 3

export type AssetAction = { kind: "value" | "sell"; asset: Asset } | null

/** The display switch already marks converted amounts; mark the rest the same way, once. */
const approximately = (text: string) => (text.startsWith("≈") ? text : `≈ ${text}`)

export function useAssetsPage() {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const prefs = usePreferences()
  const assets = useLiveQuery(liveAssets, [], [])
  const valuations = useLiveQuery(liveValuations, [], [])
  const runningCosts = useLiveQuery(async () => {
    const rows = await db.transactions.filter((x) => x.deletedAt === null && x.type === "EXPENSE" && x.assetId !== null && x.assetId !== undefined).toArray()
    const totals: Record<string, number> = {}
    for (const row of rows) totals[row.assetId!] = (totals[row.assetId!] ?? 0) + row.baseAmount
    return totals
  }, [], {} as Record<string, number>)
  const [editing, setEditing] = useState<Asset | null | "new">(null)
  const [action, setAction] = useState<AssetAction>(null)
  const [amount, setAmount] = useState("")
  const [on, setOn] = useState(todayIso())
  const [note, setNote] = useState("")
  const [showSold, setShowSold] = useState(false)
  const today = todayIso()
  const { prices } = useMetals()
  useScreenTour("assets")

  const money = (v: number, currency = base) => formatMoney(v, currency, i18n.language)
  const signed = (v: number, currency = base) => (v > 0 ? "+" : "") + money(v, currency)
  const date = useDateFormat()
  const held = assets.filter((a) => a.status === "HELD")
  const sold = assets.filter((a) => a.status === "SOLD")

  async function remove(asset: Asset) {
    await softDelete("asset", asset.id)
    setEditing(null)
    toast(t("assets.deleted"), { action: { label: t("accounts.restore"), onClick: () => void restore("asset", asset.id) } })
  }

  async function submitAction(event: FormEvent) {
    event.preventDefault()
    if (!action) return
    const value = toMinorUnits(amount, action.asset.currency)
    if (action.kind === "value") await addValuation(action.asset, on, value, note.trim() || null)
    else await sellAsset(action.asset.id, on, value)
    setAction(null)
    setAmount("")
    setNote("")
  }

  function openAction(kind: "value" | "sell", asset: Asset) {
    setAmount("")
    setOn(todayIso())
    setNote("")
    setAction({ kind, asset })
  }

  const rows = held.map((asset) => {
    const value = currentValue(asset, valuations, today, prices)
    const change = value.value - asset.purchasePrice
    const costs = runningCosts[asset.id] ?? 0
    const paidInBase = inBase(asset.purchasePrice, asset.currency, base, prices.perUsd)
    return {
      asset,
      first: asset.id === held[0]?.id,
      value: money(value.value, asset.currency),
      baseValue: value.baseValue,
      inBaseLine: asset.currency !== base ? approximately(money(value.baseValue)) : null,
      // Left out of the headline change when there is no rate to compare the two in one currency.
      changeInBase: paidInBase === null ? null : value.baseValue - paidInBase,
      change,
      changeLine: t("assets.sincePurchase", { amount: signed(change, asset.currency) }),
      attributes: Object.entries(asset.attributes).map(([k, v]) => `${t(`assets.attributes.${k}`)}: ${v}`).join(" · "),
      stale: value.monthsSinceBaseline >= prefs.valuationReminderMonths,
      sourceLine: t(value.baselineSource === "VALUATION" ? "assets.valueFromValuation" : "assets.valueFromPurchase", { date: date(value.baselineDate) })
        + (asset.depreciationMethod !== "NONE" ? ` · ${t("assets.depreciatedLine", { months: value.monthsSinceBaseline, rate: asset.annualRateBasisPoints / 100 })}` : ""),
      tcoLine: costs > 0 ? t("assets.tco", { costs: money(costs), total: money(asset.purchasePrice + costs - value.value, asset.currency) }) : null,
      history: valuationsOf(asset.id, valuations).slice(0, HISTORY_SHOWN).map((v) => ({ id: v.id, label: date(v.valuedOn) + (v.note ? ` · ${v.note}` : ""), value: money(v.value, asset.currency) })),
    }
  })
  const totalBase = rows.reduce((sum, r) => sum + r.baseValue, 0)
  const changeBase = rows.reduce((sum, r) => sum + (r.changeInBase ?? 0), 0)

  return {
    money,
    signed,
    total: money(totalBase),
    changeBase,
    heldCount: held.length,
    groups: TYPE_ORDER.filter((type) => held.some((a) => a.type === type)).map((type) => ({ type, first: type === held[0]?.type, rows: rows.filter((r) => r.asset.type === type) })),
    sold: sold.map((asset) => {
      const gain = realisedGain(asset) ?? 0
      return { asset, gain, gainText: signed(gain, asset.currency), line: t("assets.soldLine", { date: asset.soldOn ? date(asset.soldOn) : "", price: money(asset.salePrice ?? 0, asset.currency) }) }
    }),
    showSold, setShowSold,
    editing, setEditing,
    action, setAction,
    amount, setAmount,
    on, setOn,
    note, setNote,
    remove,
    submitAction,
    openAction,
    removeValuation: (id: string) => void removeValuation(id),
    unsell: (id: string) => void unsellAsset(id),
  }
}

export type AssetsPageModel = ReturnType<typeof useAssetsPage>
