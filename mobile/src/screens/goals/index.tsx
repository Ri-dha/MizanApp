import { router, Stack } from "expo-router"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { currentValue, liveAssets, liveValuations } from "@mizan/core/db/assets"
import { liveDeposits, liveGoals, savedOf, undoDeposit } from "@mizan/core/db/goals"
import { todayIso } from "@mizan/core/domain/calendar/month"
import { goalProjection } from "@mizan/core/domain/goal/projection"
import { formatMoney } from "@/utils/money"
import type { Goal } from "@mizan/core/schema"
import { Button } from "@/components/button"
import { ProgressBar } from "@/components/progress-bar"
import { Group, Row } from "@/components/row"
import { Screen } from "@/components/screen"
import { ThemedText } from "@/components/themed-text"
import { useLiveQuery } from "@/hooks/use-core"
import { spacing } from "@/theme"
import { SHORT_DATE, formatDay } from "@/utils/dates"

const RECENT_ENTRIES = 3

export function Goals() {
  const { t, i18n } = useTranslation()
  const goals = useLiveQuery(liveGoals, [], [])
  const deposits = useLiveQuery(liveDeposits, [], [])
  const assets = useLiveQuery(liveAssets, [], [])
  const valuations = useLiveQuery(liveValuations, [], [])
  const today = todayIso()
  const assetValues = Object.fromEntries(assets.map((a) => [a.id, currentValue(a, valuations, today).value]))
  const money = (value: number, currency: string) => formatMoney(value, currency, i18n.language)
  const date = (iso: string) => formatDay(iso, i18n.language, SHORT_DATE)
  const active = goals.filter((g) => g.status !== "ARCHIVED")

  function outlook(goal: Goal, saved: number) {
    const projection = goalProjection(goal.targetAmount, saved, goal.monthlyContribution, goal.targetDate, today)
    const text = goal.status === "COMPLETED" && goal.completedOn
      ? t("goals.completedOn", { date: date(goal.completedOn) })
      : projection.projectedDate
        ? t("goals.projected", { date: date(projection.projectedDate), months: projection.monthsToTarget })
        : projection.requiredMonthly !== null && goal.targetDate
          ? t("goals.required", { amount: money(projection.requiredMonthly, goal.currency), date: date(goal.targetDate) })
          : t("goals.noProjection")
    return { percent: projection.percent, text }
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: t("goals.title"), headerRight: () => <Button testID="add-goal" variant="ghost" title={t("goals.add")} onPress={() => router.push("/goal")} /> }} />
      {active.length === 0 ? <ThemedText variant="subhead">{t("goals.none")}</ThemedText> : null}
      {active.map((goal) => {
        const saved = savedOf(goal, deposits, assetValues)
        const { percent, text } = outlook(goal, saved)
        const recent = deposits.filter((d) => d.goalId === goal.id).slice(-RECENT_ENTRIES).reverse()
        return (
          <Group key={goal.id}>
            <View testID={`goal-${goal.id}`} style={styles.card}>
              <View style={styles.title}>
                <ThemedText variant="headline" onPress={() => router.push({ pathname: "/goal", params: { id: goal.id } })}>{goal.name}</ThemedText>
                {goal.status === "COMPLETED" ? <ThemedText variant="caption">{t("goals.completed")}</ThemedText> : null}
              </View>
              <ThemedText variant="subhead">{`${money(saved, goal.currency)} / ${money(goal.targetAmount, goal.currency)} · ${percent}%`}</ThemedText>
              {!goal.backingAssetId && (goal.openingAmount ?? 0) > 0 ? <ThemedText variant="caption">{t("goals.includesSaved", { amount: money(goal.openingAmount ?? 0, goal.currency) })}</ThemedText> : null}
              <ProgressBar percent={percent} />
              <ThemedText variant="subhead">{text}</ThemedText>
              <View style={styles.actions}>
                <Button testID={`deposit-${goal.id}`} title={t("goals.deposit")} onPress={() => router.push({ pathname: "/goal-entry", params: { id: goal.id, direction: "DEPOSIT" } })} />
                <Button variant="secondary" title={t("goals.withdraw")} onPress={() => router.push({ pathname: "/goal-entry", params: { id: goal.id, direction: "WITHDRAWAL" } })} />
              </View>
            </View>
            {recent.map((entry, index) => (
              <Row
                key={entry.id}
                last={index === recent.length - 1}
                trailing={<Button testID={`undo-${entry.id}`} variant="ghost" title={t("bills.undo")} onPress={() => void undoDeposit(entry)} />}
              >
                <ThemedText>{`${t(`goals.directions.${entry.direction}`)} · ${money(entry.amount, goal.currency)}`}</ThemedText>
                <ThemedText variant="caption">{date(entry.depositedOn)}</ThemedText>
              </Row>
            ))}
          </Group>
        )
      })}
    </Screen>
  )
}

const styles = StyleSheet.create({
  card: { padding: spacing.md, gap: spacing.sm },
  title: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  actions: { flexDirection: "row", gap: spacing.sm },
})
