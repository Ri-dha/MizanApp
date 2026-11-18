import { StyleSheet, TextInput, View, type TextInputProps } from "react-native"

import { colors, radius, spacing, type } from "@/theme"
import { ThemedText } from "./themed-text"

/** A labelled input; the label stays visible so a filled field still says what it holds. */
export function TextField({ label, style, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={styles.field}>
      <ThemedText variant="subhead">{label}</ThemedText>
      <TextInput accessibilityLabel={label} placeholderTextColor={colors.tertiaryLabel} style={[styles.input, style]} {...props} />
    </View>
  )
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  input: {
    ...type.body, backgroundColor: colors.surface, borderRadius: radius.md, borderCurve: "continuous",
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + spacing.xs, textAlign: "auto",
  },
})
