import { SegmentedControl } from "@expo/ui/community/segmented-control"
import { router, Stack } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { currentAmount, liveAmountHistory, microsToRate, RATE_SCALE, rateToMicros, recordReceipt, toBaseAmount } from "@mizan/core/db/income"
import { softDelete, writeFields } from "@mizan/core/db/write"
import { todayIso } from "@mizan/core/domain/calendar/month"
import { formatMoney, fromMinorUnits, toMinorUnits } from "@/utils/money"
import type { IncomeReceipt } from "@mizan/core/schema"
import { table } from "@mizan/core/store/store"
import { Button } from "@/components/button"
import { DateField } from "@/components/date-field"
import { Screen } from "@/components/screen"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { useLiveQuery, useSession } from "@/hooks/use-core"
import { spacing } from "@/theme"

const CURRENCIES = ["IQD", "USD"]

interface Props {
  monthKey: string
  sourceId?: string
  date?: string
  receiptId?: string
}

/** Marks a planned payment received, records money that came in without a plan, or corrects either afterwards. */
export function IncomeReceiptSheet({ monthKey, sourceId, date, receiptId }: Props) {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const today = todayIso()
  const existing = useLiveQuery(() => (receiptId ? table("incomeReceipts").get(receiptId) : Promise.resolve(undefined)), [receiptId], undefined)
  const source = useLiveQuery(() => (sourceId ? table("incomeSources").get(sourceId) : Promise.resolve(undefined)), [sourceId], undefined)
  const history = useLiveQuery(liveAmountHistory, [], [])
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState(base)
  const [rate, setRate] = useState("1")
  const [receivedOn, setReceivedOn] = useState(date && date <= today ? date : today)
  const [note, setNote] = useState("")
  const [loaded, setLoaded] = useState(!receiptId && !sourceId)

  useEffect(() => {
    if (loaded) return
    if (existing) {
      setAmount(fromMinorUnits(existing.amount, existing.currency))
      setCurrency(existing.currency)
      setRate(microsToRate(existing.fxRateMicros, existing.currency, base))
      setReceivedOn(existing.receivedOn)
      setNote(existing.note ?? "")
      setLoaded(true)
    } else if (source) {
      setAmount(fromMinorUnits(currentAmount(source, history, date ?? today), source.currency))
      setCurrency(source.currency)
      setRate(microsToRate(source.fxRateMicros, source.currency, base))
      setLoaded(true)
    }
  }, [existing, source, history, date, today, loaded])

  const needsRate = currency !== base
  const fxRateMicros = needsRate ? rateToMicros(rate, currency, base) : RATE_SCALE
  const minor = amount ? toMinorUnits(amount, currency) : 0

  async function save() {
    const fields = { receivedOn, amount: minor, currency, fxRateMicros, note: note.trim() || null }
    if (existing) await writeFields<IncomeReceipt>("income_receipt", existing.id, { ...fields, baseAmount: toBaseAmount(minor, fxRateMicros) })
    else await recordReceipt({ ...fields, incomeSourceId: sourceId ?? null, monthKey, visibility: "SHARED" })
    router.back()
  }

  async function remove() {
    if (!existing) return
    await softDelete("income_receipt", existing.id)
    router.back()
  }

  const planned = sourceId ?? existing?.incomeSourceId
  return (
    <Screen sheet>
      <Stack.Screen options={{ title: planned ? t("income.markReceived") : t("income.addIrregular"), headerRight: () => <Button testID="save-receipt" variant="ghost" title={t("accounts.save")} disabled={!amount} onPress={() => void save()} /> }} />
      <View style={styles.pair}>
        <View style={styles.wide}><TextField testID="receipt-amount" label={t("income.amount")} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} autoFocus={!receiptId} /></View>
        <View style={styles.narrow}>
          <ThemedText variant="subhead">{t("accounts.currency")}</ThemedText>
          <SegmentedControl values={CURRENCIES} selectedIndex={Math.max(0, CURRENCIES.indexOf(currency))} onChange={(event) => setCurrency(CURRENCIES[event.nativeEvent.selectedSegmentIndex])} />
        </View>
      </View>
      {needsRate ? (
        <>
          <TextField testID="receipt-rate" label={t("income.fxRate", { from: currency, to: base })} keyboardType="decimal-pad" value={rate} onChangeText={setRate} />
          <ThemedText variant="caption">{`= ${formatMoney(toBaseAmount(minor, fxRateMicros), base, i18n.language)}`}</ThemedText>
        </>
      ) : null}
      <DateField label={t("income.receivedOnLabel")} value={receivedOn} onChange={(iso) => iso && setReceivedOn(iso)} />
      <TextField testID="receipt-note" label={t("income.note")} maxLength={120} value={note} onChangeText={setNote} />
      {existing ? <Button testID="delete-receipt" variant="destructive" title={t("accounts.delete")} onPress={() => void remove()} /> : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  pair: { flexDirection: "row", gap: spacing.md, alignItems: "flex-end" },
  wide: { flex: 3 },
  narrow: { flex: 2, gap: spacing.xs },
})
