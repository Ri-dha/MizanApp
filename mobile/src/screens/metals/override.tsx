import { router, Stack } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { View, StyleSheet } from "react-native"

import { MILLIGRAMS_PER_UNIT, PURITIES } from "@mizan/core/domain/metal/valuation"
import { setOverride } from "@mizan/core/market/prices"
import type { MarketInstrument } from "@mizan/core/schema"
import { Button } from "@/components/button"
import { Chips } from "@/components/chips"
import { Screen } from "@/components/screen"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { useSession } from "@/hooks/use-core"
import { useMetals } from "@/hooks/use-views"
import { spacing } from "@/theme"
import { wholeFromMicros } from "./format"

const INSTRUMENTS: MarketInstrument[] = ["XAU", "XAG", "USDIQD"]
const LOCAL_UNITS = ["GRAM", "MITHQAL", "TOLA"]
const PURE_BASIS_POINTS = 10_000
const MG_PER_GRAM = 1000

/** People know the price of a mithqal of 21k, not a gram of pure gold; the form converts. */
export function PriceOverride() {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const view = useMetals()
  const [instrument, setInstrument] = useState<MarketInstrument>("XAU")
  const [purity, setPurity] = useState("21k")
  const [unit, setUnit] = useState("MITHQAL")
  const [price, setPrice] = useState("")
  const [note, setNote] = useState("")
  const isRate = instrument === "USDIQD"
  const perGram24kMicros = isRate
    ? Math.round(Number(price) * 1e6)
    : Math.round(((Number(price) * 1e6) / (MILLIGRAMS_PER_UNIT[unit] / MG_PER_GRAM)) * (PURE_BASIS_POINTS / PURITIES[purity].basisPoints))
  const purities = Object.values(PURITIES).filter((p) => p.metal === (instrument === "XAG" ? "SILVER" : "GOLD"))
  const instrumentLabel = (i: MarketInstrument) => (i === "XAU" ? t("metals.metal.GOLD") : i === "XAG" ? t("metals.metal.SILVER") : `USD → ${base}`)

  function choose(next: MarketInstrument) {
    setInstrument(next)
    setPurity(next === "XAG" ? "999" : "21k")
  }

  async function save() {
    await setOverride(instrument, perGram24kMicros, note.trim() || null)
    router.back()
  }

  return (
    <Screen sheet>
      <Stack.Screen options={{ title: t("metals.enterPrice"), headerRight: () => <Button testID="save-override" variant="ghost" title={t("accounts.save")} disabled={!price} onPress={() => void save()} /> }} />
      <ThemedText variant="subhead">{t("metals.overrideBody")}</ThemedText>
      <View style={styles.field}>
        <ThemedText variant="subhead">{t("metals.priceOf")}</ThemedText>
        <Chips testID="override-instrument" options={INSTRUMENTS.map((i) => ({ value: i, label: instrumentLabel(i) }))} value={instrument} onChange={(next) => next && choose(next as MarketInstrument)} />
      </View>
      {isRate ? null : (
        <>
          <View style={styles.field}>
            <ThemedText variant="subhead">{t("metals.purity")}</ThemedText>
            <Chips options={purities.map((p) => ({ value: p.label, label: p.label }))} value={purity} onChange={(next) => next && setPurity(next)} />
          </View>
          <View style={styles.field}>
            <ThemedText variant="subhead">{t("metals.unit")}</ThemedText>
            <Chips options={LOCAL_UNITS.map((u) => ({ value: u, label: t(`metals.units.${u}`) }))} value={unit} onChange={(next) => next && setUnit(next)} />
          </View>
        </>
      )}
      <TextField testID="override-price" label={isRate ? t("metals.ratePrice", { base }) : t("metals.localPrice", { base })} keyboardType="decimal-pad" value={price} onChangeText={setPrice} autoFocus />
      {isRate || !price ? null : (
        <ThemedText variant="caption">{t("metals.perGram24k", { amount: new Intl.NumberFormat(i18n.language === "ar" ? "ar-IQ-u-nu-latn" : "en-GB").format(wholeFromMicros(perGram24kMicros)) })}</ThemedText>
      )}
      <TextField label={t("income.note")} maxLength={120} placeholder={t("metals.overrideNoteHint")} value={note} onChangeText={setNote} />
      {view.overrides.length > 0 ? <ThemedText variant="caption">{t("metals.overrideCount", { count: view.overrides.length })}</ThemedText> : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
})
