import { useContext, type ReactNode } from "react"
import { KeyboardAvoidingView, ScrollView } from "react-native"
import { HeaderHeightContext } from "expo-router/react-navigation"

import { spacing, makeStyles } from "@/theme"

/**
 * A scrolling page on the grouped background. A full page keeps fields above the keyboard
 * itself; a sheet does not, because the system already lifts the sheet and a second inset
 * pushes its fields out of view.
 */
export function Screen({ children, centered, sheet }: { children: ReactNode; centered?: boolean; sheet?: boolean }) {
  const styles = useStyles()
  // The avoiding view measures itself from below the navigation header, so without the header's
  // height it lifts the page too little. Outside a stack (the lock screen) there is no header.
  // Android needs the padding too: drawn edge to edge, its window no longer resizes for the keyboard.
  const headerHeight = useContext(HeaderHeightContext) ?? 0
  const scroll = (
    <ScrollView
      style={sheet ? styles.sheet : styles.fill}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      contentContainerStyle={[styles.content, centered ? styles.centered : null]}
    >
      {children}
    </ScrollView>
  )
  if (sheet) return scroll
  return (
    <KeyboardAvoidingView style={styles.fill} behavior="padding" keyboardVerticalOffset={headerHeight}>
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
