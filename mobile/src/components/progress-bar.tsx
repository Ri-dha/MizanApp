import { StyleSheet, View } from "react-native"

import { colors, radius, spacing, useBrandColors } from "@/theme"

const FULL = 100

export function ProgressBar({ percent }: { percent: number }) {
  const brand = useBrandColors()
  const width = `${Math.max(0, Math.min(FULL, percent))}%` as const
  return (
    <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: FULL, now: Math.round(percent) }}>
      <View style={[styles.fill, { width, backgroundColor: brand.primary }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  track: { height: spacing.sm, borderRadius: radius.full, backgroundColor: colors.fill, overflow: "hidden" },
  fill: { height: "100%", borderRadius: radius.full },
})
