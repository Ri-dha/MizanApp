import { SegmentedControl } from "@expo/ui/community/segmented-control"
import { router, Stack } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { microsToRate, RATE_SCALE, rateToMicros } from "@mizan/core/db/income"
import { createLot, perGramFor, removeLot, updateLot } from "@mizan/core/db/metals"
import { defaultsOf, livePrivacySetting } from "@mizan/core/db/privacy"
import { todayIso } from "@mizan/core/domain/calendar/month"
import { PURITIES, toMilligrams, valueOf } from "@mizan/core/domain/metal/valuation"
import { formatMoney, fromMinorUnits, toMinorUnits } from "@/utils/money"
import type { Metal, MetalForm, WeightUnit } from "@mizan/core/schema"
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
import { UNITS, wholeFromMicros } from "./format"
import { inBase } from "@mizan/core/market/currency"
import { CurrencyField } from "@/components/currency-field"
import { useTodayRate } from "@/hooks/use-currency"

const METALS: Metal[] = ["GOLD", "SILVER"]
const FORMS: MetalForm[] = ["JEWELLERY", "COIN", "BAR", "SCRAP"]
const DEFAULT_PURITY: Record<Metal, string> = { GOLD: "21k", SILVER: "999" }

export function LotEditor({ id }: { id?: string }) {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const lot = useLiveQuery(() => (id ? table("metalLots").get(id) : Promise.resolve(undefined)), [id], undefined)
  const privacy = useLiveQuery(async () => defaultsOf(await livePrivacySetting()), [], defaultsOf(undefined))
  const market = useMetals()
  const [metal, setMetal] = useState<Metal>("GOLD")
  const [purity, setPurity] = useState(DEFAULT_PURITY.GOLD)
  const [quantity, setQuantity] = useState("1")
  const [unit, setUnit] = useState<WeightUnit>("MITHQAL")
  const [purchaseDate, setPurchaseDate] = useState(todayIso())
  const [metalCost, setMetalCost] = useState("")
  const [making, setMaking] = useState("")
  const [fees, setFees] = useState("")
  const [currency, setCurrency] = useState(base)
  const [rate, setRate] = useState("1")
  const todayRate = useTodayRate(base)
  const pickCurrency = (code: string) => {
    setCurrency(code)
    setRate(todayRate(code))
  }
  const [form, setForm] = useState<MetalForm>("JEWELLERY")
  const [dealer, setDealer] = useState("")
  const [location, setLocation] = useState("")
  const [serial, setSerial] = useState("")
  const [heldFor, setHeldFor] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)
  const [costTouched, setCostTouched] = useState(!!id)
  const [loaded, setLoaded] = useState(!id)

  useEffect(() => {
    if (!lot || loaded) return
    setMetal(lot.metal)
    setPurity(lot.purityLabel)
    setQuantity(lot.quantityEntered)
    setUnit(lot.weightUnitEntered)
    setPurchaseDate(lot.purchaseDate)
    setMetalCost(fromMinorUnits(lot.metalCost, lot.currency))
    setMaking(fromMinorUnits(lot.makingCharge, lot.currency))
    setFees(fromMinorUnits(lot.fees, lot.currency))
    setCurrency(lot.currency)
    setRate(microsToRate(lot.fxRateMicros, lot.currency, base))
    setForm(lot.form)
    setDealer(lot.dealer ?? "")
    setLocation(lot.location ?? "")
    setSerial(lot.serial ?? "")
    setHeldFor(lot.heldFor ?? "")
    setIsPrivate(lot.visibility === "PRIVATE")
    setLoaded(true)
  }, [lot, loaded])

  useEffect(() => {
    if (!id) setIsPrivate(privacy.metals === "PRIVATE")
  }, [id, privacy.metals])

  const purities = Object.values(PURITIES).filter((p) => p.metal === metal)
  const weightMg = toMilligrams(Number(quantity) || 0, unit)
  const needsRate = currency !== base
  const perGramMicros = perGramFor(metal, PURITIES[purity]?.basisPoints ?? 0, market.prices, market.setting)
  const todayBase = valueOf(perGramMicros, weightMg)
  const todayInCurrency = inBase(todayBase, base, currency, market.prices.perUsd) ?? 0
  const hasPrice = perGramMicros > 0 && weightMg > 0

  useEffect(() => {
    if (id || costTouched || !hasPrice) return
    setMetalCost(fromMinorUnits(todayInCurrency, currency))
  }, [id, costTouched, hasPrice, todayInCurrency, currency])

  function chooseMetal(next: Metal) {
    setMetal(next)
    setPurity(DEFAULT_PURITY[next])
  }

  async function save() {
    const input = {
      metal,
      purityLabel: purity,
      purityBasisPoints: PURITIES[purity].basisPoints,
      weightMg,
      weightUnitEntered: unit,
      quantityEntered: quantity,
      purchaseDate,
      metalCost: toMinorUnits(metalCost || "0", currency),
      makingCharge: toMinorUnits(making || "0", currency),
      fees: toMinorUnits(fees || "0", currency),
      currency,
      fxRateMicros: needsRate ? rateToMicros(rate, currency, base) : RATE_SCALE,
      form,
      dealer: dealer.trim() || null,
      location: location.trim() || null,
      serial: serial.trim() || null,
      heldFor: heldFor.trim() || null,
      note: null,
      visibility: isPrivate ? ("PRIVATE" as const) : ("SHARED" as const),
    }
    if (id) await updateLot(id, input)
    else await createLot(input)
    router.back()
  }

  async function remove() {
    if (!id) return
    await removeLot(id)
    router.back()
  }

  return (
    <Screen sheet>
      <Stack.Screen options={{ title: id ? t("metals.editLot") : t("metals.addLot"), headerRight: () => <Button testID="save-lot" variant="ghost" title={t("accounts.save")} disabled={weightMg <= 0} onPress={() => void save()} /> }} />
      <SegmentedControl values={METALS.map((m) => t(`metals.metal.${m}`))} selectedIndex={METALS.indexOf(metal)} onChange={(event) => chooseMetal(METALS[event.nativeEvent.selectedSegmentIndex])} />
      <View style={styles.field}>
        <ThemedText variant="subhead">{t("metals.purity")}</ThemedText>
        <Chips testID="lot-purity" options={purities.map((p) => ({ value: p.label, label: `${p.label} (${p.basisPoints / 100}%)` }))} value={purity} onChange={(next) => next && setPurity(next)} />
      </View>
      <TextField testID="lot-quantity" label={t("metals.weight")} keyboardType="decimal-pad" value={quantity} onChangeText={setQuantity} />
      <View style={styles.field}>
        <Chips testID="lot-unit" options={UNITS.map((u) => ({ value: u, label: t(`metals.units.${u}`) }))} value={unit} onChange={(next) => next && setUnit(next as WeightUnit)} />
        <ThemedText variant="caption">{t("metals.inGrams", { grams: (weightMg / 1000).toFixed(3) })}</ThemedText>
      </View>
      <View style={styles.field}>
        <ThemedText variant="subhead">{t("metals.form")}</ThemedText>
        <Chips testID="lot-form" options={FORMS.map((f) => ({ value: f, label: t(`metals.forms.${f}`) }))} value={form} onChange={(next) => next && setForm(next as MetalForm)} />
      </View>
      <DateField label={t("metals.purchaseDate")} value={purchaseDate} onChange={(iso) => iso && setPurchaseDate(iso)} />
      <View style={styles.pair}>
        <View style={styles.wide}>
          <TextField testID="lot-cost" label={t("metals.metalCost")} keyboardType="decimal-pad" value={metalCost} onChangeText={(v) => { setCostTouched(true); setMetalCost(v) }} />
        </View>
        <View style={styles.narrow}>
          <CurrencyField testID="lot-currency" value={currency} onChange={pickCurrency} />
        </View>
      </View>
      {hasPrice ? (
        <ThemedText variant="caption">{t("metals.todayHint", { perGram: formatMoney(wholeFromMicros(perGramMicros), base, i18n.language), total: formatMoney(todayInCurrency, currency, i18n.language) })}</ThemedText>
      ) : null}
      {hasPrice && costTouched ? (
        <Button variant="ghost" title={t("metals.useToday")} style={styles.start} onPress={() => { setMetalCost(fromMinorUnits(todayInCurrency, currency)); setCostTouched(false) }} />
      ) : null}
      {needsRate ? <TextField testID="lot-rate" label={t("income.fxRate", { from: currency, to: base })} keyboardType="decimal-pad" value={rate} onChangeText={setRate} /> : null}
      <View style={styles.pair}>
        <View style={styles.half}><TextField testID="lot-making" label={t("metals.makingCharge")} keyboardType="decimal-pad" value={making} onChangeText={setMaking} /></View>
        <View style={styles.half}><TextField testID="lot-fees" label={t("metals.fees")} keyboardType="decimal-pad" value={fees} onChangeText={setFees} /></View>
      </View>
      <ThemedText variant="caption">{t("metals.makingHint")}</ThemedText>
      <View style={styles.pair}>
        <View style={styles.half}><TextField label={t("metals.dealer")} maxLength={80} value={dealer} onChangeText={setDealer} /></View>
        <View style={styles.half}><TextField label={t("metals.location")} maxLength={80} value={location} onChangeText={setLocation} /></View>
      </View>
      <View style={styles.pair}>
        <View style={styles.half}><TextField label={t("metals.serial")} maxLength={80} value={serial} onChangeText={setSerial} /></View>
        <View style={styles.half}><TextField label={t("metals.heldFor")} maxLength={80} value={heldFor} onChangeText={setHeldFor} /></View>
      </View>
      <ToggleRow label={t("accounts.private")} value={isPrivate} onChange={setIsPrivate} />
      {id ? <Button testID="delete-lot" variant="destructive" title={t("accounts.delete")} onPress={() => void remove()} /> : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  pair: { flexDirection: "row", gap: spacing.md, alignItems: "flex-end" },
  wide: { flex: 3 },
  narrow: { flex: 2, gap: spacing.xs },
  half: { flex: 1 },
  field: { gap: spacing.xs },
  start: { alignSelf: "flex-start" },
})
