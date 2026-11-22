import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { Button } from "@/components/button"
import { Notice } from "@/components/notice"
import { Group, Row } from "@/components/row"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, radius, spacing } from "@/theme"
import type { PlanRow, PlanScreenModel } from "../use-plan-screen"

/** The pieces every template's Plan shows the same way: the usage bar, the warnings and the moves. */

export function UsedBar({ row, height = spacing.sm }: { row: PlanRow; height?: number }) {
  const styles = useStyles()
  const colour = row.colour ?? undefined
  return (
    <View style={[styles.track, { height }]}>
      <View style={{ width: `${row.spentPercent}%`, backgroundColor: colour }} />
      <View style={{ width: `${row.committedPercent}%`, backgroundColor: colour, opacity: 0.4 }} />
    </View>
  )
}

/** The month's buckets as one bar, each as wide as its share of what is allocated. */
export function ShareBar({ model, height = spacing.sm, track }: { model: PlanScreenModel; height?: number; track?: string }) {
  const styles = useStyles()
  return (
    <View style={[styles.shares, { height }, track ? { backgroundColor: track } : null]}>
      {model.rows.map((row) => <View key={row.id} style={{ width: `${model.widthOf(row.figure.allocated)}%`, backgroundColor: row.colour ?? undefined, borderRadius: radius.full }} />)}
    </View>
  )
}

export function PlanNotes({ model }: { model: PlanScreenModel }) {
  const { t } = useTranslation()
  const { view, money } = model
  return (
    <>
      {model.rows.length === 0 ? <ThemedText variant="subhead">{t("plan.noBuckets")}</ThemedText> : null}
      {view.figures.unallocatedPlanned !== 0 ? <ThemedText variant="subhead">{t("plan.unallocated", { amount: money(view.figures.unallocatedPlanned) })}</ThemedText> : null}
      {model.fixedExcess > 0 ? <Notice tone="error">{t("plan.fixedExceeds", { amount: money(model.fixedExcess) })}</Notice> : null}
    </>
  )
}

export function Moves({ model }: { model: PlanScreenModel }) {
  const { t } = useTranslation()
  if (model.moves.length === 0) return null
  return (
    <Group>
      {model.moves.map((move, index) => (
        <Row key={move.id} last={index === model.moves.length - 1} trailing={<Button testID={`undo-move-${index}`} variant="ghost" title={t("bills.undo")} onPress={move.undo} />}>
          <ThemedText>{move.title}</ThemedText>
          <ThemedText variant="caption">{move.detail}</ThemedText>
        </Row>
      ))}
    </Group>
  )
}

const useStyles = makeStyles((colors) => ({
  track: { flexDirection: "row", borderRadius: radius.full, backgroundColor: colors.fill, overflow: "hidden" },
  shares: { flexDirection: "row", gap: 2, borderRadius: radius.full, overflow: "hidden" },
}))
