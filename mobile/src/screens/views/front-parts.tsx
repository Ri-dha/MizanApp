import type { ReactNode } from "react"
import { View } from "react-native"

import { ThemedText } from "@/components/themed-text"
import { makeStyles, radius, spacing } from "@/theme"

/** The two pans of the scale, drawn from views so it takes the template's colour. */
export function ScaleMark({ size = 20 }: { size?: number }) {
  const styles = useStyles()
  const pan = { width: size, height: size }
  return (
    <View style={styles.scale} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.pan, pan]} />
      <View style={[styles.pan, styles.panLight, pan]} />
    </View>
  )
}

/** The opening block of the signed-out and locked screens: a mark, a large title and one line under it. */
export function FrontIntro({ title, body, centred, mark }: { title: string; body?: string; centred?: boolean; mark?: ReactNode }) {
  const styles = useStyles()
  return (
    <View style={[styles.intro, centred ? styles.centred : null]}>
      {mark ?? <ScaleMark />}
      <ThemedText variant="largeTitle" accessibilityRole="header">{title}</ThemedText>
      {body ? <ThemedText variant="subhead" style={centred ? styles.centredText : null}>{body}</ThemedText> : null}
    </View>
  )
}

/** A soft square with a padlock drawn from views, so it needs no icon font and takes the template's colours. */
export function LockTile() {
  const styles = useStyles()
  return (
    <View style={styles.tile} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.shackle} />
      <View style={styles.lockBody} />
    </View>
  )
}

/** Filled and empty dots for a PIN being typed; the count itself is never read out. */
export function PinDots({ entered, total }: { entered: number; total: number }) {
  const styles = useStyles()
  return (
    <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: total }, (_, index) => <View key={index} style={[styles.dotBase, index < entered ? styles.dotOn : styles.dotOff]} />)}
    </View>
  )
}

const useStyles = makeStyles((colors) => ({
  intro: { gap: spacing.sm, marginBottom: spacing.sm },
  centred: { alignItems: "center" },
  centredText: { textAlign: "center" },
  scale: { flexDirection: "row", alignItems: "flex-end", gap: spacing.xs },
  pan: { borderRadius: radius.full, backgroundColor: colors.primary },
  panLight: { backgroundColor: colors.gold, marginBottom: spacing.sm },
  tile: { width: 56, height: 56, borderRadius: radius.lg, borderCurve: "continuous", alignItems: "center", justifyContent: "center", backgroundColor: colors.accent },
  shackle: { width: 16, height: 12, borderWidth: 3, borderBottomWidth: 0, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderColor: colors.onAccent },
  lockBody: { width: 24, height: 17, borderRadius: 4, backgroundColor: colors.onAccent },
  dots: { flexDirection: "row", alignSelf: "center", gap: spacing.sm + spacing.xs },
  dotBase: { width: 14, height: 14, borderRadius: radius.full },
  dotOn: { backgroundColor: colors.primary },
  dotOff: { borderWidth: 1.5, borderColor: colors.outline },
}))
