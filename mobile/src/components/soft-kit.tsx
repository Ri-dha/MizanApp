import type { ReactNode } from "react"
import { View, type StyleProp, type ViewStyle } from "react-native"

import { makeStyles, radius, spacing } from "@/theme"
import { ThemedText } from "./themed-text"

export type Tone = "neutral" | "ok" | "warn" | "info" | "danger" | "gold"

/** The raised card every Soft screen is built from (ADR styles-1). */
export function Card({ children, style, testID }: { children: ReactNode; style?: StyleProp<ViewStyle>; testID?: string }) {
  const styles = useStyles()
  return <View testID={testID} style={[styles.card, style]}>{children}</View>
}

/** A small status pill; the tone picks a surface and text colour from the template. */
export function Badge({ tone = "neutral", children, testID }: { tone?: Tone; children: string; testID?: string }) {
  const styles = useStyles()
  return (
    <View testID={testID} style={[styles.badge, styles[`${tone}Surface`]]}>
      <ThemedText variant="caption" style={[styles.badgeText, styles[`${tone}Text`]]} numberOfLines={1}>{children}</ThemedText>
    </View>
  )
}

/** A titled block: the title line, an optional note under it and an action at the end. */
export function Section({ title, note, action, children }: { title: string; note?: string; action?: ReactNode; children?: ReactNode }) {
  const styles = useStyles()
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <View style={styles.grow}>
          <ThemedText variant="headline" accessibilityRole="header">{title}</ThemedText>
          {note ? <ThemedText variant="caption">{note}</ThemedText> : null}
        </View>
        {action}
      </View>
      {children}
    </View>
  )
}

/** Summary tiles side by side; they wrap to the next line when a third does not fit. */
export function Stats({ children }: { children: ReactNode }) {
  const styles = useStyles()
  return <View style={styles.stats}>{children}</View>
}

export function Stat({ label, value, tone, testID }: { label: string; value: string; tone?: "ok" | "danger" | "gold"; testID?: string }) {
  const styles = useStyles()
  return (
    <View testID={testID} style={styles.stat}>
      <ThemedText variant="caption" numberOfLines={1}>{label}</ThemedText>
      <ThemedText style={[styles.statValue, tone ? styles[`${tone}Text`] : null]} numberOfLines={1} adjustsFontSizeToFit>{value}</ThemedText>
    </View>
  )
}

export function Dot({ colour, size = 10 }: { colour?: string | null; size?: number }) {
  const styles = useStyles()
  return <View style={[styles.dot, { width: size, height: size }, colour ? { backgroundColor: colour } : null]} />
}

/** A label at the start and a figure at the end, on one line. */
export function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  const styles = useStyles()
  return (
    <View style={styles.line}>
      <ThemedText variant="subhead" style={styles.grow}>{label}</ThemedText>
      <ThemedText style={[styles.lineValue, strong ? styles.strong : null]}>{value}</ThemedText>
    </View>
  )
}

const useStyles = makeStyles((colors) => ({
  card: { backgroundColor: colors.surface, borderRadius: radius.md, borderCurve: "continuous", padding: spacing.md, gap: spacing.sm, boxShadow: "0 1px 2px rgba(16, 40, 48, 0.12)" },
  badge: { alignSelf: "flex-start", borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  badgeText: { fontWeight: "600" },
  neutralSurface: { backgroundColor: colors.fill },
  okSurface: { backgroundColor: colors.successSurface },
  warnSurface: { backgroundColor: colors.warningSurface },
  infoSurface: { backgroundColor: colors.accent },
  dangerSurface: { backgroundColor: colors.destructiveSurface },
  goldSurface: { backgroundColor: colors.goldSurface },
  neutralText: { color: colors.secondaryLabel },
  okText: { color: colors.success },
  warnText: { color: colors.warning },
  infoText: { color: colors.onAccent },
  dangerText: { color: colors.destructive },
  goldText: { color: colors.gold },
  section: { gap: spacing.sm },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  grow: { flex: 1 },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  stat: { flexGrow: 1, flexBasis: "45%", backgroundColor: colors.surface, borderRadius: radius.md, borderCurve: "continuous", paddingVertical: spacing.sm + spacing.xs, paddingHorizontal: spacing.md, gap: 2, boxShadow: "0 1px 2px rgba(16, 40, 48, 0.12)" },
  statValue: { fontSize: 18, fontWeight: "600", fontVariant: ["tabular-nums"], color: colors.label },
  dot: { borderRadius: radius.full, backgroundColor: colors.outline },
  line: { flexDirection: "row", alignItems: "baseline", gap: spacing.sm },
  lineValue: { fontSize: 15, fontVariant: ["tabular-nums"], color: colors.label },
  strong: { fontWeight: "600" },
}))
