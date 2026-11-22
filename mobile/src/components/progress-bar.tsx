import { View } from "react-native"

import { radius, spacing, useBrandColors, makeStyles } from "@/theme"

const FULL = 100

export function ProgressBar({ percent }: { percent: number }) {
  const styles = useStyles()
  const brand = useBrandColors()
  const width = `${Math.max(0, Math.min(FULL, percent))}%` as const
  return (
    <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: FULL, now: Math.round(percent) }}>
      <View style={[styles.fill, { width, backgroundColor: brand.primary }]} />
    </View>
  )
}

const useStyles = makeStyles((colors) => ({
  track: { height: spacing.sm, borderRadius: radius.full, backgroundColor: colors.fill, overflow: "hidden" },
  fill: { height: "100%", borderRadius: radius.full },
}))
