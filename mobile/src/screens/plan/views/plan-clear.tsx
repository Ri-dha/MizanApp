import { useTranslation } from "react-i18next"
import { View } from "react-native"
import Svg, { Circle } from "react-native-svg"

import { Button } from "@/components/button"
import { MonthSwitcher } from "@/components/month-switcher"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, radius, spacing, useColors } from "@/theme"
import type { PlanScreenModel } from "../use-plan-screen"
import { Moves, PlanNotes, UsedBar } from "./parts"

const RING = 92
const STROKE = 12
const RING_TRACK = "rgba(255, 255, 255, 0.16)"

/** How much of the month's plan is used, as a ring on the headline card. */
function UsedRing({ percent, label }: { percent: number; label: string }) {
  const colors = useColors()
  const r = (RING - STROKE) / 2
  const around = 2 * Math.PI * r
  return (
    <Svg width={RING} height={RING} accessibilityRole="image" accessibilityLabel={label}>
      <Circle cx={RING / 2} cy={RING / 2} r={r} stroke={RING_TRACK} strokeWidth={STROKE} fill="none" />
      <Circle cx={RING / 2} cy={RING / 2} r={r} stroke={colors.chart[0]} strokeWidth={STROKE} fill="none" strokeLinecap="round"
        strokeDasharray={`${(around * percent) / 100} ${around}`} transform={`rotate(-90 ${RING / 2} ${RING / 2})`} />
    </Svg>
  )
}

/** Clear: a dark headline card with what is free and a ring of what is used, then one compact card per bucket. */
export function PlanClear({ model }: { model: PlanScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  const { view, money } = model
  return (
    <>
      <MonthSwitcher monthKey={model.monthKey} onChange={model.setMonthKey} />
      <View style={styles.hero}>
        <View style={styles.grow}>
          <ThemedText variant="caption" style={styles.heroCaps}>{t("plan.freeToSpend").toUpperCase()}</ThemedText>
          <ThemedText style={styles.heroFigure} adjustsFontSizeToFit numberOfLines={1}>{money(model.freeTotal)}</ThemedText>
          <ThemedText variant="caption" style={styles.heroMuted}>{t("plan.ofPlannedShort", { amount: money(view.income.planned) })}</ThemedText>
        </View>
        <UsedRing percent={model.usedPercent} label={t("plan.usedPercent", { percent: model.usedPercent })} />
      </View>
      <PlanNotes model={model} />
      {model.rows.map((row) => (
        <View key={row.id} testID={`plan-bucket-${row.id}`} style={styles.card}>
          <View style={styles.between}>
            <View style={[styles.inline, styles.grow]}>
              <View style={[styles.dot, { backgroundColor: row.colour ?? undefined }]} />
              <ThemedText variant="headline" numberOfLines={1} style={styles.shrink}>{row.name}</ThemedText>
              {row.shareLabel ? <View style={styles.badge}><ThemedText variant="caption" style={styles.badgeText}>{row.shareLabel}</ThemedText></View> : null}
            </View>
            <ThemedText style={[styles.free, row.state === "over" ? styles.negative : row.state === "full" ? styles.muted : styles.positive]}>{money(row.figure.free)}</ThemedText>
          </View>
          <UsedBar row={row} />
          <View style={styles.between}>
            <ThemedText variant="caption" style={styles.shrink}>{`${t("plan.spent")} ${money(row.figure.spent)} · ${t("plan.committed")} ${money(row.figure.committed)}`}</ThemedText>
            <ThemedText variant="caption">{t("plan.ofAmount", { amount: money(row.figure.allocated) })}</ThemedText>
          </View>
          {row.figure.carriedIn > 0 ? <ThemedText variant="caption">{t("plan.carriedIn", { amount: money(row.figure.carriedIn) })}</ThemedText> : null}
        </View>
      ))}
      {model.canMove ? <Button testID="open-move-money" variant="secondary" title={t("plan.move")} onPress={model.openMove} style={styles.move} /> : null}
      <Moves model={model} />
    </>
  )
}

const useStyles = makeStyles((colors) => ({
  hero: { backgroundColor: colors.hero, borderRadius: 22, borderCurve: "continuous", padding: 20, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: spacing.md },
  heroCaps: { color: colors.heroMuted, fontWeight: "600" },
  heroFigure: { color: colors.onHero, fontSize: 34, fontWeight: "600", letterSpacing: -0.6, fontVariant: ["tabular-nums"], marginTop: 6 },
  heroMuted: { color: colors.heroMuted, fontSize: 13, marginTop: spacing.xs },
  card: { backgroundColor: colors.surface, borderRadius: 18, borderCurve: "continuous", paddingVertical: 14, paddingHorizontal: spacing.md, gap: 10 },
  between: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  inline: { flexDirection: "row", alignItems: "center", gap: 10 },
  grow: { flex: 1 },
  shrink: { flexShrink: 1 },
  dot: { width: 12, height: 12, borderRadius: radius.full },
  badge: { borderRadius: radius.full, paddingHorizontal: 9, paddingVertical: 3, backgroundColor: colors.fill },
  badgeText: { fontWeight: "600" },
  free: { fontSize: 17, fontWeight: "600", fontVariant: ["tabular-nums"] },
  positive: { color: colors.success },
  negative: { color: colors.destructive },
  muted: { color: colors.secondaryLabel },
  move: { backgroundColor: colors.accent, borderRadius: radius.full },
}))
