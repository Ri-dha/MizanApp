import { useTranslation } from "react-i18next"
import { Platform, View } from "react-native"

import { Button } from "@/components/button"
import { MonthSwitcher } from "@/components/month-switcher"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, radius, spacing } from "@/theme"
import type { PlanRow, PlanScreenModel } from "../use-plan-screen"
import { Moves, PlanNotes, UsedBar } from "./parts"

const BADGE: Partial<Record<PlanRow["state"], "overPlan" | "almostUsed" | "setAside">> = { over: "overPlan", near: "almostUsed", full: "setAside" }

/** Mizan: the income received beside Move money, then one card per bucket with a status badge and its free amount. */
export function PlanMizan({ model }: { model: PlanScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  const { view, money } = model
  return (
    <>
      <MonthSwitcher monthKey={model.monthKey} onChange={model.setMonthKey} />
      <View style={styles.between}>
        <View style={styles.grow}>
          <ThemedText variant="caption" style={styles.small}>{t("income.received")}</ThemedText>
          <ThemedText style={styles.received}>{money(view.income.received)}</ThemedText>
        </View>
        {model.canMove ? <Button testID="open-move-money" variant="secondary" title={t("plan.move")} onPress={model.openMove} style={styles.move} /> : null}
      </View>
      <PlanNotes model={model} />
      {model.rows.map((row) => {
        const badge = BADGE[row.state]
        return (
          <View key={row.id} testID={`plan-bucket-${row.id}`} style={styles.card}>
            <View style={styles.inline}>
              <View style={[styles.dot, { backgroundColor: row.colour ?? undefined }]} />
              <ThemedText variant="headline" numberOfLines={1} style={styles.shrink}>{row.name}</ThemedText>
              {row.shareLabel ? <ThemedText variant="caption" style={styles.small}>{row.shareLabel}</ThemedText> : null}
              {badge ? (
                <View style={[styles.badge, row.state === "over" ? styles.overBadge : row.state === "near" ? styles.nearBadge : styles.fullBadge]}>
                  <ThemedText variant="caption" style={[styles.badgeText, row.state === "over" ? styles.over : row.state === "near" ? styles.near : styles.full]}>{t(`plan.${badge}`)}</ThemedText>
                </View>
              ) : null}
              <ThemedText style={[styles.free, row.state === "over" ? styles.over : row.figure.free === 0 ? styles.muted : null]}>{money(row.figure.free)}</ThemedText>
            </View>
            <UsedBar row={row} />
            <View style={styles.figures}>
              <ThemedText variant="caption" style={styles.small}>{t("plan.spent")} <ThemedText variant="caption" style={[styles.small, styles.strong]}>{money(row.figure.spent)}</ThemedText></ThemedText>
              <ThemedText variant="caption" style={styles.small}>{`${t("plan.committed")} ${money(row.figure.committed)}`}</ThemedText>
            </View>
            <ThemedText variant="caption" style={styles.small}>
              {[t("plan.ofAmount", { amount: money(row.figure.allocated) }), row.figure.carriedIn > 0 ? t("plan.carriedIn", { amount: money(row.figure.carriedIn) }) : null].filter(Boolean).join(" · ")}
            </ThemedText>
          </View>
        )
      })}
      <Moves model={model} />
    </>
  )
}

const useStyles = makeStyles((colors) => ({
  between: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  grow: { flex: 1 },
  shrink: { flexShrink: 1 },
  small: { fontSize: 13 },
  received: { fontSize: 22, lineHeight: 28, fontWeight: "600", fontVariant: ["tabular-nums"] },
  move: { borderRadius: Platform.OS === "ios" ? 10 : radius.full },
  card: { backgroundColor: colors.surface, borderRadius: Platform.OS === "ios" ? radius.md : radius.lg, borderCurve: "continuous", paddingVertical: 14, paddingHorizontal: spacing.md, gap: 9 },
  inline: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  dot: { width: 14, height: 14, borderRadius: radius.full },
  badge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 1 },
  badgeText: { fontWeight: "500" },
  overBadge: { backgroundColor: colors.destructiveSurface },
  nearBadge: { backgroundColor: colors.warningSurface },
  fullBadge: { backgroundColor: colors.successSurface },
  over: { color: colors.destructive },
  near: { color: colors.warning },
  full: { color: colors.success },
  muted: { color: colors.secondaryLabel },
  free: { marginStart: "auto", fontSize: 19, fontWeight: "700", fontVariant: ["tabular-nums"] },
  figures: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  strong: { color: colors.label, fontWeight: "600" },
}))
