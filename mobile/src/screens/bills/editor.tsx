import { SegmentedControl } from "@expo/ui/community/segmented-control"
import { router, Stack } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { createRecurringExpense, updateRecurringExpense } from "@mizan/core/db/expenses"
import { microsToRate, RATE_SCALE, rateToMicros } from "@mizan/core/db/income"
import { liveBucketsOf, livePlans, planFor } from "@mizan/core/db/plan"
import { defaultsOf, livePrivacySetting } from "@mizan/core/db/privacy"
import { todayIso } from "@mizan/core/domain/calendar/month"
import { SUBSCRIPTION_CATEGORY, isSubscription } from "@mizan/core/domain/expense/subscriptions"
import { fromMinorUnits, toMinorUnits } from "@mizan/core/domain/money/format"
import type { ExpenseFrequency, RecurringExpense } from "@mizan/core/schema"
import { table } from "@mizan/core/store/store"
import { Button } from "@/components/button"
import { Chips } from "@/components/chips"
import { DateField } from "@/components/date-field"
import { Screen } from "@/components/screen"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { ToggleRow } from "@/components/toggle-row"
import { useLiveQuery, useSession } from "@/hooks/use-core"
import { currentMonthKey } from "@/hooks/use-views"
import { spacing } from "@/theme"

const FREQUENCIES: ExpenseFrequency[] = ["MONTHLY", "QUARTERLY", "ANNUAL", "CUSTOM"]
const CURRENCIES = ["IQD", "USD"]
const MAX_REMINDER_DAYS = 30
const DEFAULT_INTERVAL_DAYS = "30"

export function BillEditor({ id }: { id?: string }) {
  const { t } = useTranslation()
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const startDay = session?.monthStartDay ?? 1
  const expense = useLiveQuery(() => (id ? table("recurringExpenses").get(id) : Promise.resolve(undefined)), [id], undefined)
  const privacy = useLiveQuery(async () => defaultsOf(await livePrivacySetting()), [], defaultsOf(undefined))
  const buckets = useLiveQuery(async () => liveBucketsOf(planFor(await livePlans(), currentMonthKey(startDay))?.id), [startDay], [])
  const [name, setName] = useState("")
  const [bucketId, setBucketId] = useState<string | null>(null)
  const [amount, setAmount] = useState("")
  const [isEstimate, setIsEstimate] = useState(false)
  const [reminderDays, setReminderDays] = useState("")
  const [currency, setCurrency] = useState(base)
  const [rate, setRate] = useState("1")
  const [frequency, setFrequency] = useState<ExpenseFrequency>("MONTHLY")
  const [dueDay, setDueDay] = useState("1")
  const [anchorDate, setAnchorDate] = useState(todayIso())
  const [intervalDays, setIntervalDays] = useState(DEFAULT_INTERVAL_DAYS)
  const [activeFrom, setActiveFrom] = useState(todayIso())
  const [activeTo, setActiveTo] = useState<string | null>(null)
  const [category, setCategory] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)
  const [loaded, setLoaded] = useState(!id)
  const needsRate = currency !== base

  useEffect(() => {
    if (!expense || loaded) return
    setName(expense.name)
    setBucketId(expense.bucketId)
    setAmount(fromMinorUnits(expense.amount, expense.currency))
    setIsEstimate(expense.isEstimate)
    setReminderDays(expense.reminderDays == null ? "" : String(expense.reminderDays))
    setCurrency(expense.currency)
    setRate(microsToRate(expense.fxRateMicros, expense.currency, base))
    setFrequency(expense.frequency)
    setDueDay(String(expense.dueDay ?? 1))
    setAnchorDate(expense.anchorDate ?? todayIso())
    setIntervalDays(String(expense.intervalDays ?? DEFAULT_INTERVAL_DAYS))
    setActiveFrom(expense.activeFrom)
    setActiveTo(expense.activeTo)
    setCategory(expense.category ?? "")
    setIsPrivate(expense.visibility === "PRIVATE")
    setLoaded(true)
  }, [expense, loaded])

  useEffect(() => {
    if (!id) setIsPrivate(privacy.transactions === "PRIVATE")
  }, [id, privacy.transactions])

  useEffect(() => {
    if (!id && bucketId === null && buckets[0]) setBucketId(buckets[0].id)
  }, [id, bucketId, buckets])

  async function save() {
    const input = {
      name: name.trim(),
      bucketId,
      amount: toMinorUnits(amount, currency),
      isEstimate,
      reminderDays: reminderDays.trim() === "" ? null : Math.max(0, Math.min(MAX_REMINDER_DAYS, Number(reminderDays))),
      currency,
      fxRateMicros: needsRate ? rateToMicros(rate, currency, base) : RATE_SCALE,
      frequency,
      dueDay: frequency === "MONTHLY" ? Number(dueDay) : null,
      anchorDate: frequency === "MONTHLY" ? null : anchorDate,
      intervalDays: frequency === "CUSTOM" ? Number(intervalDays) : null,
      activeFrom,
      activeTo,
      category: category.trim() || null,
      note: null,
      visibility: isPrivate ? ("PRIVATE" as const) : ("SHARED" as const),
    }
    if (id) await updateRecurringExpense(id, input)
    else await createRecurringExpense(input)
    router.back()
  }

  async function end() {
    if (!id) return
    await updateRecurringExpense(id, { activeTo: todayIso() })
    router.back()
  }

  return (
    <Screen sheet>
      <Stack.Screen options={{ title: id ? t("bills.edit") : t("bills.add"), headerRight: () => <Button testID="save-bill" variant="ghost" title={t("accounts.save")} disabled={!name.trim() || !amount} onPress={() => void save()} /> }} />
      <TextField testID="bill-name" label={t("income.name")} maxLength={80} value={name} onChangeText={setName} autoFocus={!id} />
      <View style={styles.field}>
        <ThemedText variant="subhead">{t("transactions.bucket")}</ThemedText>
        <Chips options={buckets.map((b) => ({ value: b.id, label: b.name, swatch: b.colour }))} value={bucketId} onChange={setBucketId} />
      </View>
      <View style={styles.pair}>
        <View style={styles.wide}><TextField testID="bill-amount" label={t("income.amount")} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} /></View>
        <View style={styles.narrow}>
          <ThemedText variant="subhead">{t("accounts.currency")}</ThemedText>
          <SegmentedControl values={CURRENCIES} selectedIndex={Math.max(0, CURRENCIES.indexOf(currency))} onChange={(event) => setCurrency(CURRENCIES[event.nativeEvent.selectedSegmentIndex])} />
        </View>
      </View>
      {needsRate ? <TextField testID="bill-rate" label={t("income.fxRate", { from: currency, to: base })} keyboardType="decimal-pad" value={rate} onChangeText={setRate} /> : null}
      <ToggleRow label={t("bills.isEstimate")} value={isEstimate} onChange={setIsEstimate} />
      <TextField testID="bill-reminder" label={t("bills.reminderDays")} keyboardType="number-pad" placeholder="3" value={reminderDays} onChangeText={setReminderDays} />
      <ThemedText variant="caption">{t("bills.reminderDaysHint")}</ThemedText>
      <View style={styles.field}>
        <ThemedText variant="subhead">{t("income.frequency")}</ThemedText>
        <Chips testID="bill-frequency" options={FREQUENCIES.map((f) => ({ value: f, label: t(`bills.frequencies.${f}`) }))} value={frequency} onChange={(next) => next && setFrequency(next as ExpenseFrequency)} />
      </View>
      {frequency === "MONTHLY" ? (
        <TextField testID="bill-due-day" label={t("bills.dueDay")} keyboardType="number-pad" maxLength={2} value={dueDay} onChangeText={setDueDay} />
      ) : (
        <>
          <DateField label={t("bills.anchorDate")} value={anchorDate} onChange={(iso) => iso && setAnchorDate(iso)} />
          <ThemedText variant="caption">{t("bills.anchorHint")}</ThemedText>
        </>
      )}
      {frequency === "CUSTOM" ? <TextField testID="bill-interval" label={t("bills.everyDays")} keyboardType="number-pad" value={intervalDays} onChangeText={setIntervalDays} /> : null}
      <DateField label={t("income.activeFrom")} value={activeFrom} onChange={(iso) => iso && setActiveFrom(iso)} />
      <DateField label={t("income.activeTo")} value={activeTo} onChange={setActiveTo} optional />
      <ToggleRow label={t("subscriptions.switch")} value={isSubscription({ category } as RecurringExpense)} onChange={(on) => setCategory(on ? SUBSCRIPTION_CATEGORY : "")} />
      <TextField testID="bill-category" label={t("transactions.category")} maxLength={40} value={category} onChangeText={setCategory} />
      <ThemedText variant="caption">{t("subscriptions.categoryHint")}</ThemedText>
      <ToggleRow label={t("accounts.private")} value={isPrivate} onChange={setIsPrivate} />
      {id ? <Button testID="end-bill" variant="secondary" title={t("bills.end")} onPress={() => void end()} /> : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  pair: { flexDirection: "row", gap: spacing.md, alignItems: "flex-end" },
  wide: { flex: 3 },
  narrow: { flex: 2, gap: spacing.xs },
  field: { gap: spacing.xs },
})
