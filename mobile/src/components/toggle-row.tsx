import { Pressable, StyleSheet, Switch } from "react-native"

import { spacing } from "@/theme"
import { ThemedText } from "./themed-text"

/** A labelled switch whose whole row toggles it, as in the system Settings app. */
export function ToggleRow({ label, value, onChange, testID }: { label: string; value: boolean; onChange: (value: boolean) => void; testID?: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="switch" accessibilityState={{ checked: value }} onPress={() => onChange(!value)} style={styles.row}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <Switch value={value} onValueChange={onChange} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 44 },
  label: { flex: 1 },
})
