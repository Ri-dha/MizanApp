import { router } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert } from "react-native"

import { ATTRIBUTE_KEYS, createAsset, DEFAULT_LIQUIDITY, updateAsset } from "@mizan/core/db/assets"
import { RATE_SCALE } from "@mizan/core/db/income"
import { marketFxRateMicros } from "@mizan/core/market/currency"
import { defaultsOf, livePrivacySetting } from "@mizan/core/db/privacy"
import { softDelete } from "@mizan/core/db/write"
import { fromMinorUnits, toMinorUnits } from "@mizan/core/domain/money/format"
import type { DepreciationMethod } from "@mizan/core/domain/asset/depreciation"
import type { AssetType } from "@mizan/core/schema"
import { table } from "@mizan/core/store/store"
import { useLiveQuery, useSession } from "@/hooks/use-core"
import { useMetals } from "@/hooks/use-views"

export const METHODS: DepreciationMethod[] = ["NONE", "STRAIGHT_LINE", "DECLINING_BALANCE"]
export const NUMERIC_ATTRIBUTES: ReadonlySet<string> = new Set(["year", "mileageKm", "areaSqm", "headCount"])
const DEFAULT_RATE_PERCENT = "15"
const BASIS_POINTS_PER_PERCENT = 100

export function useAssetEditorScreen({ id }: { id?: string }) {
  const { t } = useTranslation()
  const session = useSession()
  const metals = useMetals()
  const base = session?.baseCurrency ?? "IQD"
  const asset = useLiveQuery(() => (id ? table("assets").get(id) : Promise.resolve(undefined)), [id], undefined)
  const privacy = useLiveQuery(async () => defaultsOf(await livePrivacySetting()), [], defaultsOf(undefined))
  const [type, setType] = useState<AssetType>("VEHICLE")
  const [name, setName] = useState("")
  const [purchaseDate, setPurchaseDate] = useState<string | null>(null)
  const [price, setPrice] = useState("")
  const [currency, setCurrency] = useState(base)
  const [illiquid, setIlliquid] = useState(DEFAULT_LIQUIDITY.VEHICLE === "ILLIQUID")
  const [method, setMethod] = useState<DepreciationMethod>("NONE")
  const [rate, setRate] = useState(DEFAULT_RATE_PERCENT)
  const [salvage, setSalvage] = useState("")
  const [attributes, setAttributes] = useState<Record<string, string>>({})
  const [note, setNote] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)
  const [loaded, setLoaded] = useState(!id)

  useEffect(() => {
    if (!asset || loaded) return
    setType(asset.type)
    setName(asset.name)
    setPurchaseDate(asset.purchaseDate)
    setPrice(fromMinorUnits(asset.purchasePrice, asset.currency))
    setCurrency(asset.currency)
    setIlliquid(asset.liquidity === "ILLIQUID")
    setMethod(asset.depreciationMethod)
    setRate(String(asset.annualRateBasisPoints / BASIS_POINTS_PER_PERCENT))
    setSalvage(fromMinorUnits(asset.salvageValue, asset.currency))
    setAttributes(Object.fromEntries(Object.entries(asset.attributes).map(([k, v]) => [k, String(v)])))
    setNote(asset.note ?? "")
    setIsPrivate(asset.visibility === "PRIVATE")
    setLoaded(true)
  }, [asset, loaded])

  useEffect(() => {
    if (!id) setIsPrivate(privacy.assets === "PRIVATE")
  }, [id, privacy.assets])

  function changeType(next: AssetType) {
    setType(next)
    if (!id) setIlliquid(DEFAULT_LIQUIDITY[next] === "ILLIQUID")
  }

  function rateFor(): number {
    if (asset?.currency === currency) return asset.fxRateMicros
    if (currency === base) return RATE_SCALE
    return marketFxRateMicros(currency, base, metals.prices.perUsd)
  }

  async function save() {
    const kept = ATTRIBUTE_KEYS[type]
    const input = {
      type,
      name: name.trim(),
      purchaseDate,
      purchasePrice: toMinorUnits(price || "0", currency),
      currency,
      fxRateMicros: rateFor(),
      liquidity: illiquid ? ("ILLIQUID" as const) : ("LIQUID" as const),
      depreciationMethod: method,
      annualRateBasisPoints: method === "NONE" ? 0 : Math.round(Number(rate) * BASIS_POINTS_PER_PERCENT),
      salvageValue: method === "NONE" ? 0 : toMinorUnits(salvage || "0", currency),
      attributes: Object.fromEntries(kept.filter((k) => attributes[k]?.trim()).map((k) => [k, NUMERIC_ATTRIBUTES.has(k) ? Number(attributes[k]) : attributes[k].trim()])),
      note: note.trim() || null,
      visibility: isPrivate ? ("PRIVATE" as const) : ("SHARED" as const),
    }
    if (id) await updateAsset(id, input)
    else await createAsset(input)
    router.back()
  }

  function confirmDelete() {
    if (!id) return
    Alert.alert(t("accounts.delete"), name, [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("accounts.delete"), style: "destructive", onPress: () => void softDelete("asset", id).then(() => router.back()) },
    ])
  }

  return { id, type, name, setName, purchaseDate, setPurchaseDate, price, setPrice, currency, setCurrency, illiquid, setIlliquid, method, setMethod, rate, setRate, salvage, setSalvage, attributes, setAttributes, note, setNote, isPrivate, setIsPrivate, changeType, confirmDelete, ready: !!name.trim(), save: () => void save() }
}

export type AssetEditorModel = ReturnType<typeof useAssetEditorScreen>
