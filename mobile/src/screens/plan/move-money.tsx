import { DateTimePicker } from "@expo/ui/community/datetime-picker"
import { router, Stack } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { moveMoney } from "@mizan/core/db/plan"
import { monthKeyFor, monthWindow, todayIso } from "@mizan/core/domain/calendar/month"
import { formatMoney, toMinorUnits } from "@mizan/core/domain/money/format"
import { Button } from "@/components/button"
import { Chips } from "@/components/chips"
import { Screen } from "@/components/screen"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { useSession } from "@/hooks/use-core"
import { useMonthView } from "@/hooks/use-views"
import { spacing, useBrandColors } from "@/theme"
import { dateOf, isoOf } from "@/utils/dates"


/** A move is a transfer between two buckets, not spending, and stays in the month's audit trail. */
export function MoveMoney({ monthKey }: { monthKey: string }) {
  const { t, i18n } = useTranslation()
  const brand = useBrandColors()
  const session = useSession()
  const startDay = session?.monthStartDay ?? 1
  const currency = session?.baseCurrency ?? "IQD"
  const view = useMonthView(monthKey, startDay)
  const [fromId, setFromId] = useState<string | null>(null)
  const [toId, setToId] = useState<string | null>(null)
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  const today = todayIso()
  const [on, setOn] = useState(monthKeyFor(today, startDay) === monthKey ? today : monthWindow(monthKey, startDay).from)

  useEffect(() => {
    if (fromId === null && view.buckets[0]) setFromId(view.buckets[0].id)
    if (toId === null && view.buckets[1]) setToId(view.buckets[1].id)
  }, [view.buckets, fromId, toId])

  const freeOf = (id: string) => view.figures.buckets.find((b) => b.id === id)?.free ?? 0
  const value = toMinorUnits(amount || "0", currency)
  const from = view.buckets.find((b) => b.id === fromId)
  const to = view.buckets.find((b) => b.id === toId)
  const ready = !!from && !!to && from.id !== to.id && value > 0

  async function move() {
    if (!from || !to) return
    await moveMoney(from, to, value, on, monthKey, reason.trim() || null, currency)
    router.back()
  }

  return (
    <Screen sheet>
      <Stack.Screen options={{ title: t("plan.move"), headerRight: () => <Button testID="confirm-move" variant="ghost" title={t("plan.moveConfirm")} disabled={!ready} onPress={() => void move()} /> }} />
      <View style={styles.field}>
        <ThemedText variant="subhead">{t("transactions.fromBucket")}</ThemedText>
        <Chips testID="move-from" options={view.buckets.map((b) => ({ value: b.id, label: `${b.name} · ${formatMoney(freeOf(b.id), currency, i18n.language)}`, swatch: b.colour }))} value={fromId} onChange={setFromId} />
      </View>
      <View style={styles.field}>
        <ThemedText variant="subhead">{t("transactions.to")}</ThemedText>
        <Chips testID="move-to" options={view.buckets.filter((b) => b.id !== fromId).map((b) => ({ value: b.id, label: b.name, swatch: b.colour }))} value={toId} onChange={setToId} />
      </View>
      <TextField testID="move-amount" label={t("transactions.amount")} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
      <View style={styles.dateRow}>
        <ThemedText>{t("transactions.date")}</ThemedText>
        <DateTimePicker value={dateOf(on)} mode="date" display="compact" accentColor={brand.primary} locale={i18n.language} onChange={(_, date) => date && setOn(isoOf(date))} />
      </View>
      <TextField testID="move-reason" label={t("plan.reason")} placeholder={t("plan.reasonHint")} maxLength={120} value={reason} onChangeText={setReason} />
      <ThemedText variant="caption">{t("plan.moveHint")}</ThemedText>
    </Screen>
  )
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  dateRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 },
})
