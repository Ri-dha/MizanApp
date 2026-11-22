import { StyleSheet, View } from "react-native"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Screen } from "@/components/screen"
import { spacing, useAppStyle } from "@/theme"
import { useLockScreen } from "./use-lock-screen"
import { LockSoft } from "./views/lock-soft"

/** ADR styles-1: each template draws the screen its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: LockSoft }

export function LockScreen() {
  const model = useLockScreen()
  const Chosen = viewFor(VIEWS, useAppStyle())
  return (
    <Screen centered>
      <View style={styles.stack}><Chosen model={model} /></View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  stack: { gap: spacing.md, alignItems: "stretch" },
})
