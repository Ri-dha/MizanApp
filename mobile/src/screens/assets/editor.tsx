import { router, Stack } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert, StyleSheet, View } from "react-native"

import { ATTRIBUTE_KEYS, createAsset, DEFAULT_LIQUIDITY, updateAsset } from "@mizan/core/db/assets"
import { RATE_SCALE } from "@mizan/core/db/income"
import { marketFxRateMicros } from "@mizan/core/market/currency"
import { defaultsOf, livePrivacySetting } from "@mizan/core/db/privacy"
import { softDelete } from "@mizan/core/db/write"
import { fromMinorUnits, toMinorUnits } from "@mizan/core/domain/money/format"
import type { DepreciationMethod } from "@mizan/core/domain/asset/depreciation"
import type { AssetType } from "@mizan/core/schema"
import { table } from "@mizan/core/store/store"
import { Button } from "@/components/button"
import { Chips } from "@/components/chips"
import { DateField } from "@/components/date-field"
import { Screen } from "@/components/screen"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { ToggleRow } from "@/components/toggle-row"
import { useLiveQuery, useSession } from "@/hooks/use-core"
import { useMetals } from "@/hooks/use-views"
import { spacing } from "@/theme"
import { ASSET_TYPES } from "."
import { CurrencyField } from "@/components/currency-field"

const METHODS: DepreciationMethod[] = ["NONE", "STRAIGHT_LINE", "DECLINING_BALANCE"]
const NUMERIC_ATTRIBUTES: ReadonlySet<string> = new Set(["year", "mileageKm", "areaSqm", "headCount"])
const DEFAULT_RATE_PERCENT = "15"
const BASIS_POINTS_PER_PERCENT = 100

export function AssetEditor({ id }: { id?: string }) {
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

  return (
    <Screen sheet>
      <Stack.Screen options={{ title: id ? t("assets.edit") : t("assets.add"), headerRight: () => <Button testID="save-asset" variant="ghost" title={t("accounts.save")} disabled={!name.trim()} onPress={() => void save()} /> }} />
      <View style={styles.field}>
        <ThemedText variant="subhead">{t("assets.type")}</ThemedText>
        <Chips testID="asset-type" options={ASSET_TYPES.map((k) => ({ value: k, label: t(`assets.types.${k}`) }))} value={type} onChange={(next) => next && changeType(next as AssetType)} />
      </View>
      <TextField testID="asset-name" label={t("accounts.name")} maxLength={80} value={name} onChangeText={setName} autoFocus={!id} />
      {ATTRIBUTE_KEYS[type].map((key) => (
        <TextField
          key={key}
          testID={`asset-attr-${key}`}
          label={t(`assets.attributes.${key}`)}
          keyboardType={NUMERIC_ATTRIBUTES.has(key) ? "number-pad" : "default"}
          maxLength={120}
          value={attributes[key] ?? ""}
          onChangeText={(v) => setAttributes({ ...attributes, [key]: v })}
        />
      ))}
      <View style={styles.pair}>
        <View style={styles.wide}><TextField testID="asset-price" label={t("assets.purchasePrice")} keyboardType="decimal-pad" value={price} onChangeText={setPrice} /></View>
        <View style={styles.narrow}>
          <CurrencyField testID="asset-currency" value={currency} onChange={setCurrency} />
        </View>
      </View>
      <DateField label={t("assets.purchaseDate")} value={purchaseDate} onChange={setPurchaseDate} optional />
      <View style={styles.field}>
        <ThemedText variant="subhead">{t("assets.depreciation")}</ThemedText>
        <Chips testID="asset-method" options={METHODS.map((m) => ({ value: m, label: t(`assets.methods.${m}`) }))} value={method} onChange={(next) => next && setMethod(next as DepreciationMethod)} />
        <ThemedText variant="caption">{t(`assets.methodHints.${method}`)}</ThemedText>
      </View>
      {method !== "NONE" ? (
        <View style={styles.pair}>
          <View style={styles.half}><TextField testID="asset-rate" label={t("assets.annualRate")} keyboardType="decimal-pad" value={rate} onChangeText={setRate} /></View>
          <View style={styles.half}><TextField testID="asset-salvage" label={t("assets.salvage")} keyboardType="decimal-pad" value={salvage} onChangeText={setSalvage} /></View>
        </View>
      ) : null}
      <ToggleRow label={t("assets.illiquid")} value={illiquid} onChange={setIlliquid} />
      <TextField label={t("transactions.note")} maxLength={200} value={note} onChangeText={setNote} />
      <ToggleRow label={t("accounts.private")} value={isPrivate} onChange={setIsPrivate} />
      {id ? <Button testID="delete-asset" variant="destructive" title={t("accounts.delete")} onPress={confirmDelete} /> : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  pair: { flexDirection: "row", gap: spacing.md, alignItems: "flex-end" },
  wide: { flex: 3 },
  narrow: { flex: 2, gap: spacing.xs },
  half: { flex: 1 },
  field: { gap: spacing.xs },
})
