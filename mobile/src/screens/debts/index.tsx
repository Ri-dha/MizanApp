import { router, Stack } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { balanceOf, liveDebts, livePayments } from "@mizan/core/db/debts"
import { debtPayoff } from "@mizan/core/domain/debt/payoff"
import { compareStrategies } from "@mizan/core/domain/debt/strategy"
import { formatMoney, toMinorUnits } from "@mizan/core/domain/money/format"
import type { Debt } from "@mizan/core/schema"
import { Button } from "@/components/button"
import { LinkRow } from "@/components/link-row"
import { Group, Row } from "@/components/row"
import { Screen } from "@/components/screen"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { useLiveQuery, useSession } from "@/hooks/use-core"
import { spacing } from "@/theme"

const STRATEGIES = ["snowball", "avalanche"] as const

export function Debts() {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const debts = useLiveQuery(liveDebts, [], [])
  const payments = useLiveQuery(livePayments, [], [])
  const [extra, setExtra] = useState("")
  const money = (amount: number, currency: string) => formatMoney(amount, currency, i18n.language)
  const active = debts.filter((d) => d.direction === "OWING" && d.status === "ACTIVE" && d.currency === base)
  const strategies = active.length > 1
    ? compareStrategies(active.map((d) => ({ id: d.id, balance: Math.max(0, balanceOf(d, payments)), annualRateBasisPoints: d.annualRateBasisPoints, monthlyPayment: d.monthlyPayment })), extra ? toMinorUnits(extra, base) : 0)
    : null
  const nameOf = (id: string) => debts.find((d) => d.id === id)?.name ?? id

  function summary(debt: Debt, balance: number) {
    if (debt.status === "SETTLED") return t("debts.settled")
    const payoff = debtPayoff(balance, debt.annualRateBasisPoints, debt.monthlyPayment)
    return payoff.neverClears ? t("debts.neverClears") : t("debts.payoffSummary", { months: payoff.months, interest: money(payoff.totalInterest, debt.currency) })
  }

  function section(title: string, body: string, list: Debt[]) {
    return (
      <View style={styles.section}>
        <ThemedText variant="headline">{title}</ThemedText>
        <ThemedText variant="caption">{body}</ThemedText>
        <Group>
          {list.length === 0 ? <Row last><ThemedText variant="subhead">{t("debts.none")}</ThemedText></Row> : null}
          {list.map((debt, index) => {
            const balance = balanceOf(debt, payments)
            return (
              <LinkRow
                key={debt.id}
                testID={`debt-${debt.id}`}
                href={{ pathname: "/debt", params: { id: debt.id } }}
                last={index === list.length - 1}
                trailing={<ThemedText variant="headline">{money(balance, debt.currency)}</ThemedText>}
              >
                <ThemedText numberOfLines={1}>{debt.counterparty ? `${debt.name} · ${debt.counterparty}` : debt.name}</ThemedText>
                <ThemedText variant="caption" numberOfLines={1}>
                  {debt.annualRateBasisPoints === 0 ? `${t("debts.interestFree")} · ` : ""}{summary(debt, balance)}
                </ThemedText>
              </LinkRow>
            )
          })}
        </Group>
      </View>
    )
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: t("debts.title"), headerRight: () => <Button testID="add-debt" variant="ghost" title={t("debts.add")} onPress={() => router.push("/debt-edit")} /> }} />
      {section(t("debts.owing"), t("debts.owingBody"), debts.filter((d) => d.direction === "OWING"))}
      {section(t("debts.owed"), t("debts.owedBody"), debts.filter((d) => d.direction === "OWED"))}
      {strategies ? (
        <View style={styles.section}>
          <ThemedText variant="headline">{t("debts.strategyTitle")}</ThemedText>
          <ThemedText variant="caption">{t("debts.strategyBody")}</ThemedText>
          <TextField testID="strategy-extra" label={t("debts.extraPerMonth")} keyboardType="decimal-pad" value={extra} onChangeText={setExtra} />
          <Group>
            {STRATEGIES.map((name, index) => {
              const outcome = strategies[name]
              return (
                <Row key={name} last={index === STRATEGIES.length - 1}>
                  <ThemedText variant="headline">{t(`debts.strategies.${name}`)}</ThemedText>
                  <ThemedText variant="caption">{t(`debts.strategyHints.${name}`)}</ThemedText>
                  <ThemedText>{outcome.order.map(nameOf).join(" → ")}</ThemedText>
                  <ThemedText variant="subhead">
                    {outcome.neverClears ? t("debts.neverClears") : t("debts.strategyOutcome", { months: outcome.months, interest: money(outcome.totalInterest, base) })}
                  </ThemedText>
                </Row>
              )
            })}
          </Group>
          {!strategies.snowball.neverClears && !strategies.avalanche.neverClears ? (
            <ThemedText variant="subhead">{t("debts.strategyDifference", { amount: money(Math.abs(strategies.snowball.totalInterest - strategies.avalanche.totalInterest), base) })}</ThemedText>
          ) : null}
        </View>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
})
