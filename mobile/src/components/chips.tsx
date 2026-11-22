import { Pressable, ScrollView, StyleSheet, View } from "react-native"

import { radius, spacing, useBrandColors, useColors } from "@/theme"
import { ThemedText } from "./themed-text"

export interface Chip {
  value: string
  label: string
  swatch?: string
}

/** One choice among a few, in a row that scrolls sideways; tapping the chosen chip again clears it. */
export function Chips({ options, value, onChange, testID }: { options: Chip[]; value: string | null; onChange: (value: string | null) => void; testID?: string }) {
  const colors = useColors()
  const brand = useBrandColors()
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} testID={testID}>
      {options.map((option) => {
        const selected = option.value === value
        return (
          <Pressable
            key={option.value}
            testID={testID ? `${testID}-${option.value}` : undefined}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(selected ? null : option.value)}
            style={({ pressed }) => [styles.chip, { backgroundColor: selected ? brand.primary : colors.fill, opacity: pressed ? 0.7 : 1 }]}
          >
            {option.swatch ? <View style={[styles.swatch, { backgroundColor: option.swatch }]} /> : null}
            <ThemedText style={{ color: selected ? brand.onPrimary : colors.label }}>{option.label}</ThemedText>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingVertical: spacing.xs },
  chip: { flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full },
  swatch: { width: spacing.sm + spacing.xs, height: spacing.sm + spacing.xs, borderRadius: radius.full },
})
