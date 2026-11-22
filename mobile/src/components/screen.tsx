import type { ReactNode } from "react"
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native"

import { spacing, makeStyles } from "@/theme"

/**
 * A scrolling page on the grouped background. A full page keeps fields above the keyboard
 * itself; a sheet does not, because the system already lifts the sheet and a second inset
 * pushes its fields out of view.
 */
export function Screen({ children, centered, sheet }: { children: ReactNode; centered?: boolean; sheet?: boolean }) {
  const styles = useStyles()
  const scroll = (
    <ScrollView
      style={sheet ? styles.sheet : styles.fill}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.content, centered ? styles.centered : null]}
    >
      {children}
    </ScrollView>
  )
  if (sheet) return scroll
  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {scroll}
    </KeyboardAvoidingView>
  )
}

const useStyles = makeStyles((colors) => ({
  fill: { flex: 1, backgroundColor: colors.background },
  sheet: { backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  centered: { flexGrow: 1, justifyContent: "center" },
}))
