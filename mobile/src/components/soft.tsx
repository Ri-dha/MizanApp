import type { ReactNode } from "react"
import { View, type StyleProp, type ViewStyle } from "react-native"

import { makeStyles, radius, spacing } from "@/theme"
import { ThemedText } from "./themed-text"

/** The pieces the Soft template repeats on every screen: the card, its small title, a badge and a row's leading tile. */

export function SoftCard({ children, tone, flush, style, testID }: { children: ReactNode; tone?: "hero" | "gold"; flush?: boolean; style?: StyleProp<ViewStyle>; testID?: string }) {
  const styles = useStyles()
  return <View testID={testID} style={[styles.card, tone === "hero" ? styles.hero : tone === "gold" ? styles.gold : null, flush ? styles.flush : null, style]}>{children}</View>
}

export function SectionTitle({ children, tone }: { children: string; tone?: "hero" | "gold" }) {
  const styles = useStyles()
  return <ThemedText numberOfLines={1} style={[styles.title, tone === "hero" ? styles.onHeroMuted : tone === "gold" ? styles.goldText : null]}>{children}</ThemedText>
}

export type BadgeTone = "ok" | "warn" | "bad" | "info" | "neutral"

export function Badge({ children, tone = "neutral" }: { children: string; tone?: BadgeTone }) {
  const styles = useStyles()
  return (
    <View style={[styles.badge, styles[`${tone}Badge`]]}>
      <ThemedText numberOfLines={1} style={[styles.badgeText, styles[`${tone}Text`]]}>{children}</ThemedText>
    </View>
  )
}

/** The rounded tile that leads a row. The phone app has no icon set, so it carries a colour, not a glyph. */
export function Lead({ colour, size = 32 }: { colour?: string | null; size?: number }) {
  const styles = useStyles()
  return (
    <View style={[styles.lead, { width: size, height: size }, colour ? { backgroundColor: colour } : null]}>
      <View style={[styles.leadMark, colour ? styles.leadMarkOnColour : null]} />
    </View>
  )
}

/** An info banner: a tinted box with an outline, for a sentence that explains what an action does. */
export function Banner({ children, testID }: { children: string; testID?: string }) {
  const styles = useStyles()
  return <View testID={testID} style={styles.banner}><ThemedText style={styles.bannerText}>{children}</ThemedText></View>
}

const useStyles = makeStyles((colors) => ({
  card: { backgroundColor: colors.surface, borderRadius: radius.md, borderCurve: "continuous", padding: spacing.md, gap: spacing.sm, boxShadow: "0 1px 2px rgba(16, 40, 48, 0.12)" },
  hero: { backgroundColor: colors.hero, paddingVertical: spacing.md + 2, boxShadow: "0 4px 12px rgba(16, 40, 48, 0.14)" },
  gold: { backgroundColor: colors.goldSurface, borderWidth: 1, borderColor: colors.gold, boxShadow: "none" },
  flush: { paddingHorizontal: 0, paddingVertical: spacing.xs, gap: 0 },
  title: { fontSize: 13, lineHeight: 18, fontWeight: "600", color: colors.secondaryLabel, flexShrink: 1 },
  onHeroMuted: { color: colors.heroMuted },
  goldText: { color: colors.gold },
  badge: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3, alignSelf: "flex-start" },
  badgeText: { fontSize: 12, lineHeight: 16, fontWeight: "600" },
  okBadge: { backgroundColor: colors.successSurface },
  okText: { color: colors.success },
  warnBadge: { backgroundColor: colors.warningSurface },
  warnText: { color: colors.warning },
  badBadge: { backgroundColor: colors.destructiveSurface },
  badText: { color: colors.destructive },
  infoBadge: { backgroundColor: colors.accent },
  infoText: { color: colors.onAccent },
  neutralBadge: { backgroundColor: colors.fill },
  neutralText: { color: colors.secondaryLabel },
  lead: { borderRadius: radius.sm, borderCurve: "continuous", alignItems: "center", justifyContent: "center", backgroundColor: colors.accent },
  leadMark: { width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.onAccent },
  leadMarkOnColour: { backgroundColor: colors.surface, opacity: 0.9 },
  banner: { backgroundColor: colors.accent, borderRadius: radius.md, borderCurve: "continuous", borderWidth: 1, borderColor: colors.onAccent, paddingVertical: spacing.sm + spacing.xs, paddingHorizontal: spacing.md },
  bannerText: { fontSize: 14, lineHeight: 20 },
}))
