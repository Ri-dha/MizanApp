import { router, Stack } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { balanceOf, livePayments, recordPayment, undoPayment } from "@mizan/core/db/debts"
import { formatDate } from "@mizan/core/domain/calendar/hijri"
import { monthKeyFor, todayIso } from "@mizan/core/domain/calendar/month"
import { debtPayoff } from "@mizan/core/domain/debt/payoff"
import { formatMoney, fromMinorUnits, toMinorUnits } from "@mizan/core/domain/money/format"
import { table } from "@mizan/core/store/store"
import { Button } from "@/components/button"
import { DateField } from "@/components/date-field"
import { Group, Row } from "@/components/row"
import { Screen } from "@/components/screen"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { useLiveQuery, useSession } from "@/hooks/use-core"
import { spacing } from "@/theme"
import { SHORT_DATE } from "@/utils/dates"

export function DebtDetail({ id }: { id: string }) {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const startDay = session?.monthStartDay ?? 1
  const debt = useLiveQuery(() => table("debts").get(id), [id], undefined)
  const payments = useLiveQuery(livePayments, [], [])
  const [amount, setAmount] = useState("")
  const [paidOn, setPaidOn] = useState(todayIso())
  const [extra, setExtra] = useState("")
  if (!debt) return <Screen><Stack.Screen options={{ title: t("debts.title") }} /></Screen>

  const money = (value: number) => formatMoney(value, debt.currency, i18n.language)
  const date = (iso: string) => formatDate(iso, i18n.language, false, SHORT_DATE)
  const balance = balanceOf(debt, payments)
  const ledger = payments.filter((p) => p.debtId === debt.id).reverse()
  const payoff = debtPayoff(balance, debt.annualRateBasisPoints, debt.monthlyPayment)
  const extraMinor = extra ? toMinorUnits(extra, debt.currency) : 0
  const withExtra = extraMinor > 0 ? debtPayoff(balance, debt.annualRateBasisPoints, debt.monthlyPayment + extraMinor) : null
  const active = debt.status === "ACTIVE"

  async function pay() {
    if (!debt) return
    const paid = toMinorUnits(amount || fromMinorUnits(debt.monthlyPayment, debt.currency), debt.currency)
    await recordPayment(debt, payments, paid, paidOn, monthKeyFor(paidOn, startDay), null)
    setAmount("")
  }

  const outlook = debt.status === "SETTLED"
    ? t("debts.settled")
    : payoff.neverClears
      ? t("debts.neverClearsLong", { payment: money(debt.monthlyPayment) })
      : t("debts.payoffLong", { months: payoff.months, total: money(payoff.totalPaid), interest: money(payoff.totalInterest) })

  return (
    <Screen>
      <Stack.Screen options={{ title: debt.name, headerRight: () => <Button testID="edit-debt" variant="ghost" title={t("debts.edit")} onPress={() => router.push({ pathname: "/debt-edit", params: { id: debt.id } })} /> }} />
      <View style={styles.section}>
        <ThemedText variant="subhead">{t("debts.balance")}</ThemedText>
        <ThemedText testID="debt-balance" variant="largeTitle">{money(balance)}</ThemedText>
        <ThemedText variant="subhead">{outlook}</ThemedText>
      </View>

      {active ? (
        <View style={styles.section}>
          <ThemedText variant="headline">{t("debts.recordPayment")}</ThemedText>
          <TextField testID="debt-payment-amount" label={t("income.amount")} keyboardType="decimal-pad" placeholder={fromMinorUnits(debt.monthlyPayment, debt.currency)} value={amount} onChangeText={setAmount} />
          <DateField label={t("bills.paidOnLabel")} value={paidOn} onChange={(iso) => iso && setPaidOn(iso)} />
          <Button testID="record-payment" title={t("debts.recordPayment")} onPress={() => void pay()} />
        </View>
      ) : null}

      {active && !payoff.neverClears ? (
        <View style={styles.section}>
          <ThemedText variant="headline">{t("debts.whatIf")}</ThemedText>
          <TextField testID="debt-extra" label={t("debts.extraPerMonth")} keyboardType="decimal-pad" value={extra} onChangeText={setExtra} />
          {withExtra && !withExtra.neverClears ? (
            <ThemedText variant="subhead">{t("debts.whatIfResult", { months: payoff.months - withExtra.months, interest: money(payoff.totalInterest - withExtra.totalInterest) })}</ThemedText>
          ) : null}
        </View>
      ) : null}

      <View style={styles.section}>
        <ThemedText variant="headline">{t("debts.ledger")}</ThemedText>
        <Group>
          {ledger.length === 0 ? <Row last><ThemedText variant="subhead">{t("debts.noPayments")}</ThemedText></Row> : null}
          {ledger.map((payment, index) => (
            <Row
              key={payment.id}
              last={index === ledger.length - 1}
              trailing={<Button testID={`undo-payment-${payment.id}`} variant="ghost" title={t("bills.undo")} onPress={() => void undoPayment(payment)} />}
            >
              <ThemedText>{money(payment.amount)}</ThemedText>
              <ThemedText variant="caption">
                {`${date(payment.paidOn)} · ${t("debts.principalPart", { amount: money(payment.principalComponent) })}`}
                {payment.interestComponent ? ` · ${t("debts.interestPart", { amount: money(payment.interestComponent) })}` : ""}
              </ThemedText>
            </Row>
          ))}
        </Group>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
})
