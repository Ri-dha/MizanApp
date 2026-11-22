import { Text, type TextProps } from "react-native"

import { type, useColors } from "@/theme"

const SECONDARY: ReadonlySet<keyof typeof type> = new Set(["subhead", "caption"])

export function ThemedText({ variant = "body", style, ...props }: TextProps & { variant?: keyof typeof type }) {
  const colors = useColors()
  return <Text style={[type[variant], { color: SECONDARY.has(variant) ? colors.secondaryLabel : colors.label }, style]} {...props} />
}
