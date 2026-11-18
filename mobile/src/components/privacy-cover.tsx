import { useEffect, useState } from "react"
import { AppState, StyleSheet, View } from "react-native"

import { colors } from "@/theme"

/** Keeps the numbers off the task switcher: the snapshot iOS and Android take shows this instead. */
export function PrivacyCover() {
  const [hidden, setHidden] = useState(AppState.currentState !== "active")
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => setHidden(next !== "active"))
    return () => subscription.remove()
  }, [])
  return hidden ? <View testID="privacy-cover" pointerEvents="none" style={[StyleSheet.absoluteFill, styles.cover]} /> : null
}

const styles = StyleSheet.create({
  cover: { backgroundColor: colors.background },
})
