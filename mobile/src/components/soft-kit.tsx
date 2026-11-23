import type { ReactNode } from "react"
import { SymbolView, type SFSymbol } from "expo-symbols"
import { View, type StyleProp, type ViewStyle } from "react-native"

import { makeStyles, radius, spacing, useColors } from "@/theme"
import { ThemedText } from "./themed-text"

export type Tone = "neutral" | "ok" | "warn" | "info" | "danger" | "gold"

/** The raised card every Soft screen is built from (ADR styles-1). */
export function Card({ children, tone, flush, style, testID }: { children: ReactNode; tone?: "hero" | "gold"; flush?: boolean; style?: StyleProp<ViewStyle>; testID?: string }) {
  const styles = useStyles()
  return <View testID={testID} style={[styles.card, tone === "hero" ? styles.heroCard : tone === "gold" ? styles.goldCard : null, flush ? styles.flush : null, style]}>{children}</View>
}

/** The small muted title inside a card. */
export function SectionTitle({ children, tone }: { children: string; tone?: "hero" | "gold" }) {
  const styles = useStyles()
  return <ThemedText numberOfLines={1} style={[styles.title, tone === "hero" ? styles.onHeroMuted : tone === "gold" ? styles.goldText : null]}>{children}</ThemedText>
}

/** The rounded tile that leads a row. The phone app has no icon set, so it carries a colour, not a glyph. */
export function Lead({ colour, size = 32, symbol }: { colour?: string | null; size?: number; symbol?: SFSymbol }) {
  const styles = useStyles()
  const colors = useColors()
  const mark = <View style={[styles.leadMark, colour ? styles.leadMarkOnColour : null]} />
  return (
    <View style={[styles.lead, { width: size, height: size }, colour ? { backgroundColor: colour } : null]}>
      {/* The symbol library is Apple-only, so Android keeps the plain mark. */}
      {symbol ? <SymbolView name={symbol} size={size * 0.56} tintColor={colour ? "#ffffff" : colors.onAccent} type="monochrome" fallback={mark} /> : mark}
    </View>
  )
}

/** An info banner: a tinted box with an outline, for a sentence that explains what an action does. */
export function Banner({ children, testID }: { children: string; testID?: string }) {
  const styles = useStyles()
  return <View testID={testID} style={styles.banner}><ThemedText style={styles.bannerText}>{children}</ThemedText></View>
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

/** A progress track; `colour` overrides the template's main colour, `thick` is the hero weight. */
export function Bar({ percent, colour, tone, thick }: { percent: number; colour?: string | null; tone?: "ok" | "danger" | "gold"; thick?: boolean }) {
  const styles = useStyles()
  const width = `${Math.max(0, Math.min(100, percent))}%` as const
  return (
    <View style={[styles.track, thick ? styles.thick : null]} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(percent) }}>
      <View style={[styles.fill, tone ? styles[`${tone}Fill`] : null, colour ? { backgroundColor: colour } : null, { width }]} />
    </View>
  )
}

/** The one large figure of a screen. */
export function HeroAmount({ children, tone, testID }: { children: string; tone?: "ok" | "danger" | "gold"; testID?: string }) {
  const styles = useStyles()
  return <ThemedText testID={testID} style={[styles.hero, tone ? styles[`${tone}Text`] : null]} numberOfLines={1} adjustsFontSizeToFit>{children}</ThemedText>
}

const useStyles = makeStyles((colors) => ({
  card: { backgroundColor: colors.surface, borderRadius: radius.md, borderCurve: "continuous", padding: spacing.md, gap: spacing.sm, boxShadow: "0 1px 2px rgba(16, 40, 48, 0.12)" },
  heroCard: { backgroundColor: colors.hero, paddingVertical: spacing.md + 2, boxShadow: "0 4px 12px rgba(16, 40, 48, 0.14)" },
  goldCard: { backgroundColor: colors.goldSurface, borderWidth: 1, borderColor: colors.gold, boxShadow: "none" },
  flush: { paddingHorizontal: 0, paddingVertical: spacing.xs, gap: 0 },
  title: { fontSize: 13, lineHeight: 18, fontWeight: "600", color: colors.secondaryLabel, flexShrink: 1 },
  onHeroMuted: { color: colors.heroMuted },
  lead: { borderRadius: radius.sm, borderCurve: "continuous", alignItems: "center", justifyContent: "center", backgroundColor: colors.accent },
  leadMark: { width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.onAccent },
  leadMarkOnColour: { backgroundColor: colors.surface, opacity: 0.9 },
  banner: { backgroundColor: colors.accent, borderRadius: radius.md, borderCurve: "continuous", borderWidth: 1, borderColor: colors.onAccent, paddingVertical: spacing.sm + spacing.xs, paddingHorizontal: spacing.md },
  bannerText: { fontSize: 14, lineHeight: 20 },
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
  track: { height: 6, borderRadius: radius.full, backgroundColor: colors.fill, overflow: "hidden" },
  thick: { height: 10 },
  fill: { height: "100%", borderRadius: radius.full, backgroundColor: colors.primary },
  okFill: { backgroundColor: colors.success },
  dangerFill: { backgroundColor: colors.destructive },
  goldFill: { backgroundColor: colors.gold },
  hero: { fontSize: 30, fontWeight: "600", fontVariant: ["tabular-nums"], color: colors.label },
}))
