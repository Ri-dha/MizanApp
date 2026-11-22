import { StyleSheet, View } from "react-native"

import { radius, spacing, useBrandColors, useColors } from "@/theme"
import { ThemedText } from "./themed-text"

/** An inline message: "error" in the destructive colour, "info" on the accent surface. */
export function Notice({ tone = "info", children, testID }: { tone?: "info" | "error"; children: string; testID?: string }) {
  const colors = useColors()
  const brand = useBrandColors()
  return (
    <View testID={testID} accessibilityRole={tone === "error" ? "alert" : "text"} style={[styles.box, { backgroundColor: tone === "error" ? colors.fill : brand.accent }]}>
      <ThemedText style={tone === "error" ? { color: brand.destructive } : null}>{children}</ThemedText>
    </View>
  )
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.md, borderCurve: "continuous", padding: spacing.md },
})
