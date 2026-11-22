import { TextInput, View, type TextInputProps } from "react-native"

import { makeStyles, radius, spacing, type, useColors } from "@/theme"
import { ThemedText } from "./themed-text"

/** A labelled input; the label stays visible so a filled field still says what it holds. */
export function TextField({ label, style, ...props }: TextInputProps & { label: string }) {
  const styles = useStyles()
  const colors = useColors()
  return (
    <View style={styles.field}>
      <ThemedText variant="subhead">{label}</ThemedText>
      <TextInput accessibilityLabel={label} placeholderTextColor={colors.tertiaryLabel} style={[styles.input, style]} {...props} />
    </View>
  )
}

const useStyles = makeStyles((colors) => ({
  field: { gap: spacing.xs },
  input: {
    ...type.body, color: colors.label, backgroundColor: colors.surface, borderRadius: radius.md, borderCurve: "continuous",
    // Soft puts fields on cards of the same colour, so the field needs its own edge to be seen.
    borderWidth: 1, borderColor: colors.outline,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + spacing.xs, textAlign: "auto",
  },
}))
