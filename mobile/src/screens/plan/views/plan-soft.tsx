import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { Button } from "@/components/button"
import { MonthSwitcher } from "@/components/month-switcher"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, radius, spacing, type } from "@/theme"
import type { PlanScreenModel } from "../use-plan-screen"
import { Moves, PlanNotes, ShareBar, UsedBar } from "./parts"

/** Soft: a summary card with planned and received, then one card per bucket with its free amount and a thick bar. */
export function PlanSoft({ model }: { model: PlanScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  const { view, money } = model
  return (
    <>
      <MonthSwitcher monthKey={model.monthKey} onChange={model.setMonthKey} />
      <View style={styles.card}>
        <View style={styles.between}><ThemedText variant="subhead">{t("income.planned")}</ThemedText><ThemedText style={type.amount}>{money(view.income.planned)}</ThemedText></View>
        <View style={styles.between}>
          <ThemedText variant="subhead">{t("income.received")}</ThemedText>
          <View style={styles.inline}>
            <ThemedText style={[type.amount, styles.positive]}>{money(view.income.received)}</ThemedText>
            {model.allReceived ? <View style={[styles.badge, styles.okBadge]}><ThemedText variant="caption" style={styles.okText}>{t("plan.allIn")}</ThemedText></View> : null}
          </View>
        </View>
        {model.rows.length > 0 ? <ShareBar model={model} height={spacing.sm} /> : null}
      </View>
      <PlanNotes model={model} />
      {model.rows.map((row) => (
        <View key={row.id} testID={`plan-bucket-${row.id}`} style={styles.card}>
          <View style={styles.inline}>
            <View style={[styles.dot, { backgroundColor: row.colour ?? undefined }]} />
            <ThemedText variant="headline" style={styles.grow}>{row.name}</ThemedText>
            {row.shareLabel ? <View style={[styles.badge, styles.neutralBadge]}><ThemedText variant="caption">{row.shareLabel}</ThemedText></View> : null}
          </View>
          <View style={styles.baseline}>
            <ThemedText variant="subhead">{t("plan.free")}</ThemedText>
            <ThemedText style={[styles.free, row.state === "over" ? styles.negative : null]}>{money(row.figure.free)}</ThemedText>
          </View>
          <UsedBar row={row} />
          <View style={styles.between}>
            <ThemedText variant="caption">{t("plan.spent")} <ThemedText variant="caption" style={styles.strong}>{money(row.figure.spent)}</ThemedText></ThemedText>
            <ThemedText variant="caption">{t("plan.committed")} <ThemedText variant="caption" style={styles.strong}>{money(row.figure.committed)}</ThemedText></ThemedText>
          </View>
          <ThemedText variant="caption">
            {[t("plan.ofAmount", { amount: money(row.figure.allocated) }), row.figure.carriedIn > 0 ? t("plan.carriedIn", { amount: money(row.figure.carriedIn) }) : null].filter(Boolean).join(" · ")}
          </ThemedText>
        </View>
      ))}
      {model.canMove ? <Button testID="open-move-money" variant="secondary" title={t("plan.move")} onPress={model.openMove} style={styles.move} /> : null}
      <Moves model={model} />
    </>
  )
}

const useStyles = makeStyles((colors) => ({
  card: { backgroundColor: colors.surface, borderRadius: radius.md, borderCurve: "continuous", padding: spacing.md, gap: spacing.sm, boxShadow: "0 1px 2px rgba(16, 40, 48, 0.12)" },
  between: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  baseline: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  inline: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  grow: { flex: 1 },
  dot: { width: 12, height: 12, borderRadius: radius.full },
  badge: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  neutralBadge: { backgroundColor: colors.fill },
  okBadge: { backgroundColor: colors.successSurface },
  okText: { color: colors.success, fontWeight: "600" },
  free: { fontSize: 22, fontWeight: "600", fontVariant: ["tabular-nums"] },
  positive: { color: colors.success },
  negative: { color: colors.destructive },
  strong: { color: colors.label, fontWeight: "600" },
  move: { backgroundColor: colors.accent },
}))
