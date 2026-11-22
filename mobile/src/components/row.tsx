import type { ReactNode } from "react"
import { StyleSheet, View } from "react-native"

import { radius, spacing, makeStyles } from "@/theme"

/** One line of a grouped list: content at the start, a value at the end, a hairline between rows. */
export function Row({ children, trailing, last, testID }: { children: ReactNode; trailing?: ReactNode; last?: boolean; testID?: string }) {
  const styles = useStyles()
  return (
    <View testID={testID} style={[styles.row, last ? null : styles.divider]}>
      <View style={styles.main}>{children}</View>
      {trailing}
    </View>
  )
}

export function Group({ children }: { children: ReactNode }) {
  const styles = useStyles()
  return <View style={styles.group}>{children}</View>
}

const useStyles = makeStyles((colors) => ({
  group: { backgroundColor: colors.surface, borderRadius: radius.md, borderCurve: "continuous", overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm + spacing.xs, paddingHorizontal: spacing.md, minHeight: 44 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
  main: { flex: 1 },
}))
