import { router, Stack } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { RATE_SCALE, toBaseAmount } from "@mizan/core/db/income"
import { recordSale } from "@mizan/core/db/metals"
import { todayIso } from "@mizan/core/domain/calendar/month"
import { InsufficientWeightError, planDisposal } from "@mizan/core/domain/metal/disposal"
import { toMilligrams } from "@mizan/core/domain/metal/valuation"
import { formatMoney, toMinorUnits } from "@mizan/core/domain/money/format"
import type { DisposalMethod, Metal, WeightUnit } from "@mizan/core/schema"
import { Button } from "@/components/button"
import { Chips } from "@/components/chips"
import { DateField } from "@/components/date-field"
import { Notice } from "@/components/notice"
import { Group, Row } from "@/components/row"
import { Screen } from "@/components/screen"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { ToggleRow } from "@/components/toggle-row"
import { useSession } from "@/hooks/use-core"
import { useMetals } from "@/hooks/use-views"
import { spacing } from "@/theme"
import { UNITS } from "./format"

const METHODS: DisposalMethod[] = ["FIFO", "SPECIFIC", "WEIGHTED_AVERAGE"]

export function SellMetal({ metal }: { metal: Metal }) {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const view = useMetals()
  const [quantity, setQuantity] = useState("1")
  const [unit, setUnit] = useState<WeightUnit>("MITHQAL")
  const [proceeds, setProceeds] = useState("")
  const [fees, setFees] = useState("")
  const [soldOn, setSoldOn] = useState(todayIso())
  const [method, setMethod] = useState<DisposalMethod | null>(null)
  const [chosen, setChosen] = useState<string[]>([])
  const [buyer, setBuyer] = useState("")
  const [error, setError] = useState<string | null>(null)
  const preferred = (metal === "GOLD" ? view.setting?.goldMethod : view.setting?.silverMethod) ?? "FIFO"
  const activeMethod = method ?? preferred

  useEffect(() => setError(null), [quantity, unit, proceeds, activeMethod, chosen])

  const money = (v: number) => formatMoney(v, base, i18n.language)
  const signed = (v: number) => (v > 0 ? "+" : "") + money(v)
  const candidates = view.valued.filter((v) => v.lot.metal === metal && v.remainingMg > 0)
  const weightMg = toMilligrams(Number(quantity) || 0, unit)
  const proceedsBase = toBaseAmount(toMinorUnits(proceeds || "0", base) - toMinorUnits(fees || "0", base), RATE_SCALE)
  let preview: ReturnType<typeof planDisposal> | null = null
  let previewError: string | null = null
  try {
    preview = planDisposal(
      candidates.map((v) => ({ id: v.lot.id, purchaseDate: v.lot.purchaseDate, weightMg: v.lot.weightMg, remainingMg: v.remainingMg, metalCost: v.metalCostBase, makingCharge: v.makingBase, fees: v.feesBase })),
      weightMg, activeMethod, chosen, proceedsBase,
    )
  } catch (e) {
    previewError = e instanceof InsufficientWeightError ? t("metals.notEnough") : String(e)
  }

  async function save() {
    try {
      await recordSale(view.valued, {
        metal, weightMg, proceeds: toMinorUnits(proceeds || "0", base), fees: toMinorUnits(fees || "0", base), currency: base, fxRateMicros: RATE_SCALE,
        soldOn, method: activeMethod, specificLotIds: chosen, buyer: buyer.trim() || null, note: null,
      })
      router.back()
    } catch (e) {
      setError(e instanceof InsufficientWeightError ? t("metals.notEnough") : String(e))
    }
  }

  return (
    <Screen sheet>
      <Stack.Screen options={{ title: t("metals.sell", { metal: t(`metals.metal.${metal}`) }), headerRight: () => <Button testID="confirm-sale" variant="ghost" title={t("metals.confirmSale")} disabled={!preview || !proceeds} onPress={() => void save()} /> }} />
      {error ? <Notice tone="error">{error}</Notice> : null}
      <TextField testID="sell-quantity" label={t("metals.weight")} keyboardType="decimal-pad" value={quantity} onChangeText={setQuantity} />
      <Chips testID="sell-unit" options={UNITS.map((u) => ({ value: u, label: t(`metals.units.${u}`) }))} value={unit} onChange={(next) => next && setUnit(next as WeightUnit)} />
      <View style={styles.pair}>
        <View style={styles.half}><TextField testID="sell-proceeds" label={t("metals.proceeds")} keyboardType="decimal-pad" value={proceeds} onChangeText={setProceeds} /></View>
        <View style={styles.half}><TextField testID="sell-fees" label={t("metals.fees")} keyboardType="decimal-pad" value={fees} onChangeText={setFees} /></View>
      </View>
      <DateField label={t("transactions.date")} value={soldOn} onChange={(iso) => iso && setSoldOn(iso)} />
      <TextField label={t("metals.buyer")} maxLength={80} value={buyer} onChangeText={setBuyer} />
      <View style={styles.field}>
        <ThemedText variant="subhead">{t("metals.method")}</ThemedText>
        <Chips testID="sell-method" options={METHODS.map((m) => ({ value: m, label: t(`metals.methods.${m}`) }))} value={activeMethod} onChange={(next) => next && setMethod(next as DisposalMethod)} />
        <ThemedText variant="caption">{t("metals.methodHint")}</ThemedText>
      </View>
      {activeMethod === "SPECIFIC" ? (
        <View style={styles.field}>
          <ThemedText variant="subhead">{t("metals.chooseLots")}</ThemedText>
          {candidates.map((v) => (
            <ToggleRow
              key={v.lot.id}
              label={`${v.lot.purchaseDate} · ${v.lot.purityLabel} · ${(v.remainingMg / 1000).toFixed(3)} g · ${money(v.costPerGramBase)}/g`}
              value={chosen.includes(v.lot.id)}
              onChange={(on) => setChosen(on ? [...chosen, v.lot.id] : chosen.filter((lotId) => lotId !== v.lot.id))}
            />
          ))}
        </View>
      ) : null}
      <Group>
        {previewError ? <Row last><ThemedText>{previewError}</ThemedText></Row> : null}
        {preview ? (
          <Row last>
            <ThemedText variant="subhead">{t("metals.costLeaving", { amount: money(preview.costBasis) })}</ThemedText>
            <ThemedText testID="sale-preview" variant="headline">{t("metals.realised", { amount: signed(preview.realisedGain) })}</ThemedText>
            <ThemedText variant="caption">{t("metals.excludingMaking", { amount: signed(preview.realisedGainExcludingMaking) })}</ThemedText>
          </Row>
        ) : null}
      </Group>
    </Screen>
  )
}

const styles = StyleSheet.create({
  pair: { flexDirection: "row", gap: spacing.md, alignItems: "flex-end" },
  half: { flex: 1 },
  field: { gap: spacing.xs },
})
