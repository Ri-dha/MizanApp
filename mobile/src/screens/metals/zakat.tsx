import { Stack } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { perGramFor } from "@mizan/core/db/metals"
import { formatHijri } from "@mizan/core/domain/calendar/hijri"
import { todayIso } from "@mizan/core/domain/calendar/month"
import { valueOf } from "@mizan/core/domain/metal/valuation"
import { formatMoney } from "@/utils/money"
import type { Metal } from "@mizan/core/schema"
import { DateField } from "@/components/date-field"
import { Notice } from "@/components/notice"
import { Group, Row } from "@/components/row"
import { Screen } from "@/components/screen"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { useSession } from "@/hooks/use-core"
import { useMetals } from "@/hooks/use-views"
import { spacing } from "@/theme"
import { SHORT_DATE, formatDay } from "@/utils/dates"
import { grams, wholeFromMicros } from "./format"

/** Classical nisab: 20 mithqal of gold (85 g) or 200 dirhams of silver (595 g); both editable. */
const DEFAULT_NISAB_G: Record<Metal, string> = { GOLD: "85", SILVER: "595" }
const ZAKAT_RATE_BP = 250
const BP = 10_000
const MG = 1000
const PURE = 9990
const METALS: Metal[] = ["GOLD", "SILVER"]

/** FR-MTL-12: the base and the inputs only; the screen says so in its first line and makes no ruling. */
export function Zakat() {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const currency = session?.baseCurrency ?? "IQD"
  const view = useMetals()
  const [asOf, setAsOf] = useState(todayIso())
  const [nisab, setNisab] = useState(DEFAULT_NISAB_G)
  const [prices, setPrices] = useState<Record<Metal, string>>({ GOLD: "", SILVER: "" })
  const money = (v: number) => formatMoney(v, currency, i18n.language)
  const perGram24k = (metal: Metal) => perGramFor(metal, PURE, view.prices, view.setting)

  function rowFor(metal: Metal) {
    const held = view.valued.filter((v) => v.lot.metal === metal && v.remainingMg > 0 && v.lot.purchaseDate <= asOf)
    const pureMg = held.reduce((sum, v) => sum + Math.round((v.remainingMg * v.lot.purityBasisPoints) / BP), 0)
    const perGramMicros = prices[metal].trim() ? Math.round(Number(prices[metal]) * 1_000_000) : perGram24k(metal)
    const value = valueOf(perGramMicros, pureMg)
    const nisabMg = Math.round(Number(nisab[metal]) * MG)
    return { pureMg, value, reaches: nisabMg > 0 && pureMg >= nisabMg, base: Math.round((value * ZAKAT_RATE_BP) / BP) }
  }

  return (
    <Screen sheet>
      <Stack.Screen options={{ title: t("zakat.title") }} />
      <ThemedText variant="subhead">{t("zakat.disclaimer")}</ThemedText>
      <DateField label={t("zakat.asOf")} value={asOf} onChange={(iso) => iso && setAsOf(iso)} />
      <ThemedText variant="caption">{formatHijri(asOf, i18n.language)}</ThemedText>
      {METALS.map((metal) => {
        const row = rowFor(metal)
        const name = t(`metals.metal.${metal}`)
        return (
          <View key={metal} style={styles.section}>
            <View style={styles.pair}>
              <View style={styles.half}>
                <TextField testID={`nisab-${metal}`} label={t("zakat.nisab", { metal: name })} keyboardType="decimal-pad" value={nisab[metal]} onChangeText={(v) => setNisab({ ...nisab, [metal]: v })} />
              </View>
              <View style={styles.half}>
                <TextField label={t("zakat.price", { metal: name })} keyboardType="decimal-pad" value={prices[metal]} onChangeText={(v) => setPrices({ ...prices, [metal]: v })} />
              </View>
            </View>
            <ThemedText variant="caption">{t("zakat.priceHint", { price: money(wholeFromMicros(perGram24k(metal))) })}</ThemedText>
            <Group>
              <Row last>
                <ThemedText variant="headline">{name}</ThemedText>
                <ThemedText>{t("zakat.pureWeight", { weight: grams(row.pureMg, i18n.language) })}</ThemedText>
                <ThemedText>{t("zakat.value", { value: money(row.value), date: formatDay(asOf, i18n.language, SHORT_DATE) })}</ThemedText>
                <ThemedText testID={`zakat-${metal}`}>{row.reaches ? t("zakat.reaches") : t("zakat.below")}</ThemedText>
                {row.reaches ? <ThemedText variant="headline">{t("zakat.base", { amount: money(row.base) })}</ThemedText> : null}
              </Row>
            </Group>
          </View>
        )
      })}
      <Notice>{t("zakat.footer")}</Notice>
    </Screen>
  )
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  pair: { flexDirection: "row", gap: spacing.md, alignItems: "flex-end" },
  half: { flex: 1 },
})
