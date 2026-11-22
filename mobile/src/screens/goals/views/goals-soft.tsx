import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Button } from "@/components/button"
import { Badge, Bar, Card } from "@/components/soft-kit"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, spacing } from "@/theme"
import type { GoalsScreenModel } from "../use-goals-screen"

/** Soft: one card per goal with the saved amount large, the target and percent beside it, a thick bar, and recent entries under a rule. */
export function GoalsSoft({ model }: { model: GoalsScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  return (
    <>
      {model.goals.length === 0 ? <ThemedText variant="subhead">{t("goals.none")}</ThemedText> : null}
      {model.goals.map((goal) => (
        <Card key={goal.id} testID={`goal-${goal.id}`}>
          <View style={styles.head}>
            <ThemedText variant="headline" style={styles.grow} onPress={goal.edit}>{goal.name}</ThemedText>
            {goal.completed ? <Badge tone="ok">{t("goals.completed")}</Badge> : null}
          </View>
          <View style={styles.figures}>
            <ThemedText style={styles.saved}>{goal.saved}</ThemedText>
            <ThemedText variant="caption" style={styles.grow}>{t("plan.ofAmount", { amount: goal.target })}</ThemedText>
            <ThemedText variant="subhead" style={styles.percent}>{`${goal.percent}%`}</ThemedText>
          </View>
          <Bar thick percent={goal.percent} tone={goal.completed ? "ok" : undefined} />
          {goal.includesSaved ? <ThemedText variant="caption">{goal.includesSaved}</ThemedText> : null}
          <ThemedText variant="subhead">{goal.text}</ThemedText>
          <View style={styles.actions}>
            <Button testID={`deposit-${goal.id}`} title={t("goals.deposit")} onPress={goal.deposit} />
            <Button variant="secondary" title={t("goals.withdraw")} onPress={goal.withdraw} />
          </View>
          {goal.recent.map((entry) => (
            <View key={entry.id} style={styles.entry}>
              <View style={styles.grow}>
                <ThemedText variant="subhead" style={styles.entryText}>{entry.text}</ThemedText>
                <ThemedText variant="caption">{entry.date}</ThemedText>
              </View>
              <Button testID={`undo-${entry.id}`} variant="ghost" title={t("bills.undo")} onPress={entry.undo} />
            </View>
          ))}
        </Card>
      ))}
    </>
  )
}

const useStyles = makeStyles((colors) => ({
  head: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  grow: { flex: 1 },
  figures: { flexDirection: "row", flexWrap: "wrap", alignItems: "baseline", gap: spacing.xs + 2 },
  saved: { fontSize: 24, fontWeight: "600", fontVariant: ["tabular-nums"], color: colors.label },
  percent: { fontWeight: "600", color: colors.label },
  actions: { flexDirection: "row", gap: spacing.sm },
  entry: { flexDirection: "row", alignItems: "center", gap: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator, paddingTop: spacing.sm },
  entryText: { color: colors.label },
}))
