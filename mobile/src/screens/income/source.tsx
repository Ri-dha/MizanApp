import { SegmentedControl } from "@expo/ui/community/segmented-control"
import { router, Stack } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { createIncomeSource, historyOf, liveAmountHistory, microsToRate, RATE_SCALE, rateToMicros, recordAmountChange, removeAmountChange, updateIncomeSource } from "@mizan/core/db/income"
import { defaultsOf, livePrivacySetting } from "@mizan/core/db/privacy"
import { todayIso } from "@mizan/core/domain/calendar/month"
import { formatMoney, fromMinorUnits, toMinorUnits } from "@/utils/money"
import type { Frequency } from "@mizan/core/schema"
import { table } from "@mizan/core/store/store"
import { Button } from "@/components/button"
import { Chips } from "@/components/chips"
import { DateField } from "@/components/date-field"
import { Group, Row } from "@/components/row"
import { Screen } from "@/components/screen"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { ToggleRow } from "@/components/toggle-row"
import { useLiveQuery, useSession } from "@/hooks/use-core"
import { spacing } from "@/theme"
import { SHORT_DATE, formatDay } from "@/utils/dates"

const FREQUENCIES: Frequency[] = ["MONTHLY", "BIWEEKLY", "WEEKLY", "ONE_OFF"]
const CURRENCIES = ["IQD", "USD"]
const DEFAULT_PAY_DAY = "25"

export function IncomeSourceEditor({ id }: { id?: string }) {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const source = useLiveQuery(() => (id ? table("incomeSources").get(id) : Promise.resolve(undefined)), [id], undefined)
  const history = useLiveQuery(liveAmountHistory, [], [])
  const privacy = useLiveQuery(async () => defaultsOf(await livePrivacySetting()), [], defaultsOf(undefined))
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState(base)
  const [rate, setRate] = useState("1")
  const [frequency, setFrequency] = useState<Frequency>("MONTHLY")
  const [payDay, setPayDay] = useState(DEFAULT_PAY_DAY)
  const [anchorDate, setAnchorDate] = useState(todayIso())
  const [activeFrom, setActiveFrom] = useState(todayIso())
  const [activeTo, setActiveTo] = useState<string | null>(null)
  const [isPrivate, setIsPrivate] = useState(false)
  const [raiseAmount, setRaiseAmount] = useState("")
  const [raiseFrom, setRaiseFrom] = useState(todayIso())
  const [raiseNote, setRaiseNote] = useState("")
  const [loaded, setLoaded] = useState(!id)
  const needsRate = currency !== base
  const usesPayDay = frequency === "MONTHLY"
  const oneOff = frequency === "ONE_OFF"
  const money = (value: number, code: string) => formatMoney(value, code, i18n.language)
  const date = (iso: string) => formatDay(iso, i18n.language, SHORT_DATE)
  const timeline = source ? historyOf(source, history) : []

  useEffect(() => {
    if (!source || loaded) return
    setName(source.name)
    setAmount(fromMinorUnits(source.amount, source.currency))
    setCurrency(source.currency)
    setRate(microsToRate(source.fxRateMicros, source.currency))
    setFrequency(source.frequency)
    setPayDay(String(source.payDay ?? DEFAULT_PAY_DAY))
    setAnchorDate(source.anchorDate ?? todayIso())
    setActiveFrom(source.activeFrom)
    setActiveTo(source.activeTo)
    setIsPrivate(source.visibility === "PRIVATE")
    setLoaded(true)
  }, [source, loaded])

  useEffect(() => {
    if (!id) setIsPrivate(privacy.accounts === "PRIVATE")
  }, [id, privacy.accounts])

  async function save() {
    const input = {
      name: name.trim(),
      amount: source ? source.amount : toMinorUnits(amount, currency),
      currency,
      fxRateMicros: needsRate ? rateToMicros(rate, currency) : RATE_SCALE,
      frequency,
      payDay: usesPayDay ? Number(payDay) : null,
      anchorDate: usesPayDay ? null : anchorDate,
      activeFrom: oneOff ? anchorDate : activeFrom,
      activeTo: oneOff ? anchorDate : activeTo,
      note: null,
      visibility: isPrivate ? ("PRIVATE" as const) : ("SHARED" as const),
    }
    if (id) await updateIncomeSource(id, input)
    else await createIncomeSource(input)
    router.back()
  }

  async function endSource() {
    if (!id) return
    await updateIncomeSource(id, { activeTo: todayIso() })
    router.back()
  }

  async function recordRaise() {
    if (!source) return
    await recordAmountChange(source, toMinorUnits(raiseAmount, source.currency), raiseFrom, raiseNote.trim() || null)
    setRaiseAmount("")
    setRaiseNote("")
  }

  return (
    <Screen sheet>
      <Stack.Screen options={{ title: id ? t("income.editSource") : t("income.addSource"), headerRight: () => <Button testID="save-source" variant="ghost" title={t("accounts.save")} disabled={!name.trim() || !amount} onPress={() => void save()} /> }} />
      <TextField testID="source-name" label={t("income.name")} maxLength={80} value={name} onChangeText={setName} autoFocus={!id} />
      <View style={styles.pair}>
        <View style={styles.wide}>
          <TextField testID="source-amount" label={id ? t("income.currentAmount") : t("income.amount")} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} editable={!id} />
        </View>
        <View style={styles.narrow}>
          <ThemedText variant="subhead">{t("accounts.currency")}</ThemedText>
          <SegmentedControl values={CURRENCIES} selectedIndex={Math.max(0, CURRENCIES.indexOf(currency))} onChange={(event) => setCurrency(CURRENCIES[event.nativeEvent.selectedSegmentIndex])} />
        </View>
      </View>
      {id ? <ThemedText variant="caption">{t("income.amountLocked")}</ThemedText> : null}
      {needsRate ? (
        <>
          <TextField testID="source-rate" label={t("income.fxRate", { from: currency, to: base })} keyboardType="decimal-pad" value={rate} onChangeText={setRate} />
          <ThemedText variant="caption">{t("income.fxRateHint")}</ThemedText>
        </>
      ) : null}
      <View style={styles.field}>
        <ThemedText variant="subhead">{t("income.frequency")}</ThemedText>
        <Chips testID="source-frequency" options={FREQUENCIES.map((f) => ({ value: f, label: t(`income.frequencies.${f}`) }))} value={frequency} onChange={(next) => next && setFrequency(next as Frequency)} />
      </View>
      {usesPayDay ? (
        <TextField testID="source-pay-day" label={t("income.payDay")} keyboardType="number-pad" maxLength={2} value={payDay} onChangeText={setPayDay} />
      ) : (
        <>
          <DateField label={oneOff ? t("income.paidOn") : t("income.anchorDate")} value={anchorDate} onChange={(iso) => iso && setAnchorDate(iso)} />
          {oneOff ? null : <ThemedText variant="caption">{t("income.anchorHint")}</ThemedText>}
        </>
      )}
      {oneOff ? null : (
        <>
          <DateField label={t("income.activeFrom")} value={activeFrom} onChange={(iso) => iso && setActiveFrom(iso)} />
          <DateField label={t("income.activeTo")} value={activeTo} onChange={setActiveTo} optional />
        </>
      )}
      <ToggleRow label={t("accounts.private")} value={isPrivate} onChange={setIsPrivate} />
      {id ? <Button testID="end-source" variant="secondary" title={t("income.endSource")} onPress={() => void endSource()} /> : null}

      {source ? (
        <View style={styles.section}>
          <ThemedText variant="headline">{t("income.history")}</ThemedText>
          <Group>
            {timeline.length === 0 ? (
              <Row last><ThemedText variant="subhead">{t("income.historyFrom", { amount: money(source.amount, source.currency), date: date(source.activeFrom) })}</ThemedText></Row>
            ) : null}
            {[...timeline].reverse().map((entry, index) => (
              <Row
                key={entry.id}
                last={index === timeline.length - 1}
                trailing={timeline.length > 1 ? <Button variant="ghost" title={t("accounts.delete")} onPress={() => void removeAmountChange(entry, source, history)} /> : undefined}
              >
                <ThemedText>{t("income.historyFrom", { amount: money(entry.amount, entry.currency), date: date(entry.effectiveFrom) })}</ThemedText>
                {entry.note ? <ThemedText variant="caption">{entry.note}</ThemedText> : null}
              </Row>
            ))}
          </Group>
          <ThemedText variant="headline">{t("income.recordRaise")}</ThemedText>
          <TextField testID="raise-amount" label={t("income.newAmount")} keyboardType="decimal-pad" value={raiseAmount} onChangeText={setRaiseAmount} />
          <DateField label={t("income.effectiveFrom")} value={raiseFrom} onChange={(iso) => iso && setRaiseFrom(iso)} />
          <TextField testID="raise-note" label={t("income.note")} maxLength={120} value={raiseNote} onChangeText={setRaiseNote} />
          <Button testID="record-raise" variant="secondary" title={t("income.recordRaise")} disabled={!raiseAmount} onPress={() => void recordRaise()} />
        </View>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  pair: { flexDirection: "row", gap: spacing.md, alignItems: "flex-end" },
  wide: { flex: 3 },
  narrow: { flex: 2, gap: spacing.xs },
  field: { gap: spacing.xs },
  section: { gap: spacing.sm, marginTop: spacing.md },
})
