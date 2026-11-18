import { SegmentedControl } from "@expo/ui/community/segmented-control"
import { router, Stack } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { createDebt, updateDebt } from "@mizan/core/db/debts"
import { microsToRate, RATE_SCALE, rateToMicros } from "@mizan/core/db/income"
import { liveBucketsOf, livePlans, planFor } from "@mizan/core/db/plan"
import { defaultsOf, livePrivacySetting } from "@mizan/core/db/privacy"
import { softDelete } from "@mizan/core/db/write"
import { todayIso } from "@mizan/core/domain/calendar/month"
import { fromMinorUnits, toMinorUnits } from "@mizan/core/domain/money/format"
import type { DebtDirection } from "@mizan/core/schema"
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

const CURRENCIES = ["IQD", "USD"]
const DIRECTIONS: DebtDirection[] = ["OWING", "OWED"]

export function DebtEditor({ id }: { id?: string }) {
  const { t } = useTranslation()
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const startDay = session?.monthStartDay ?? 1
  const debt = useLiveQuery(() => (id ? table("debts").get(id) : Promise.resolve(undefined)), [id], undefined)
  const privacy = useLiveQuery(async () => defaultsOf(await livePrivacySetting()), [], defaultsOf(undefined))
  const buckets = useLiveQuery(async () => liveBucketsOf(planFor(await livePlans(), currentMonthKey(startDay))?.id), [startDay], [])
  const [direction, setDirection] = useState<DebtDirection>("OWING")
  const [name, setName] = useState("")
  const [counterparty, setCounterparty] = useState("")
  const [principal, setPrincipal] = useState("")
  const [currency, setCurrency] = useState(base)
  const [rate, setRate] = useState("1")
  const [annualPercent, setAnnualPercent] = useState("0")
  const [termMonths, setTermMonths] = useState("")
  const [monthlyPayment, setMonthlyPayment] = useState("")
  const [bucketId, setBucketId] = useState<string | null>(null)
  const [startDate, setStartDate] = useState(todayIso())
  const [isPrivate, setIsPrivate] = useState(false)
  const [loaded, setLoaded] = useState(!id)
  const needsRate = currency !== base

  useEffect(() => {
    if (!debt || loaded) return
    setDirection(debt.direction)
    setName(debt.name)
    setCounterparty(debt.counterparty ?? "")
    setPrincipal(fromMinorUnits(debt.principal, debt.currency))
    setCurrency(debt.currency)
    setRate(microsToRate(debt.fxRateMicros, debt.currency))
    setAnnualPercent(String(debt.annualRateBasisPoints / 100))
    setTermMonths(debt.termMonths ? String(debt.termMonths) : "")
    setMonthlyPayment(fromMinorUnits(debt.monthlyPayment, debt.currency))
    setBucketId(debt.bucketId)
    setStartDate(debt.startDate)
    setIsPrivate(debt.visibility === "PRIVATE")
    setLoaded(true)
  }, [debt, loaded])

  useEffect(() => {
    if (!id) setIsPrivate(privacy.debts === "PRIVATE")
  }, [id, privacy.debts])

  async function save() {
    const input = {
      name: name.trim(),
      counterparty: counterparty.trim() || null,
      direction,
      principal: toMinorUnits(principal, currency),
      currency,
      fxRateMicros: needsRate ? rateToMicros(rate, currency) : RATE_SCALE,
      annualRateBasisPoints: Math.round(Number(annualPercent || "0") * 100),
      termMonths: termMonths ? Number(termMonths) : null,
      monthlyPayment: toMinorUnits(monthlyPayment || "0", currency),
      bucketId: direction === "OWING" ? bucketId : null,
      startDate,
      note: null,
      visibility: isPrivate ? ("PRIVATE" as const) : ("SHARED" as const),
    }
    if (id) await updateDebt(id, input)
    else await createDebt(input)
    router.back()
  }

  async function remove() {
    if (!id) return
    await softDelete("debt", id)
    router.dismissTo("/debts")
  }

  return (
    <Screen sheet>
      <Stack.Screen options={{ title: id ? t("debts.edit") : t("debts.add"), headerRight: () => <Button testID="save-debt" variant="ghost" title={t("accounts.save")} disabled={!name.trim() || !principal} onPress={() => void save()} /> }} />
      <SegmentedControl
        values={DIRECTIONS.map((d) => t(`debts.directions.${d}`))}
        selectedIndex={DIRECTIONS.indexOf(direction)}
        onChange={(event) => setDirection(DIRECTIONS[event.nativeEvent.selectedSegmentIndex])}
      />
      <TextField testID="debt-name" label={t("income.name")} maxLength={80} value={name} onChangeText={setName} autoFocus={!id} />
      <TextField testID="debt-counterparty" label={t("debts.counterparty")} maxLength={80} value={counterparty} onChangeText={setCounterparty} />
      <View style={styles.pair}>
        <View style={styles.wide}><TextField testID="debt-principal" label={t("debts.principal")} keyboardType="decimal-pad" value={principal} onChangeText={setPrincipal} /></View>
        <View style={styles.narrow}>
          <ThemedText variant="subhead">{t("accounts.currency")}</ThemedText>
          <SegmentedControl values={CURRENCIES} selectedIndex={Math.max(0, CURRENCIES.indexOf(currency))} onChange={(event) => setCurrency(CURRENCIES[event.nativeEvent.selectedSegmentIndex])} />
        </View>
      </View>
      {needsRate ? <TextField testID="debt-rate" label={t("income.fxRate", { from: currency, to: base })} keyboardType="decimal-pad" value={rate} onChangeText={setRate} /> : null}
      <View style={styles.pair}>
        <View style={styles.half}><TextField testID="debt-annual" label={t("debts.annualRate")} keyboardType="decimal-pad" value={annualPercent} onChangeText={setAnnualPercent} /></View>
        <View style={styles.half}><TextField testID="debt-term" label={t("debts.termMonths")} keyboardType="number-pad" value={termMonths} onChangeText={setTermMonths} /></View>
      </View>
      <ThemedText variant="caption">{t("debts.rateHint")}</ThemedText>
      <TextField testID="debt-monthly" label={t("debts.monthlyPayment")} keyboardType="decimal-pad" value={monthlyPayment} onChangeText={setMonthlyPayment} />
      {direction === "OWING" ? (
        <View style={styles.field}>
          <ThemedText variant="subhead">{t("debts.paidFromBucket")}</ThemedText>
          <Chips options={buckets.map((b) => ({ value: b.id, label: b.name, swatch: b.colour }))} value={bucketId} onChange={setBucketId} />
        </View>
      ) : null}
      <DateField label={t("debts.startDate")} value={startDate} onChange={(iso) => iso && setStartDate(iso)} />
      <ToggleRow label={t("accounts.private")} value={isPrivate} onChange={setIsPrivate} />
      {id ? <Button testID="delete-debt" variant="destructive" title={t("accounts.delete")} onPress={() => void remove()} /> : null}
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
