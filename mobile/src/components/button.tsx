import { ActivityIndicator, Pressable, type ColorValue, type StyleProp, type ViewStyle } from "react-native"

import { radius, spacing, useBrandColors, useColors } from "@/theme"
import { ThemedText } from "./themed-text"

type Variant = "primary" | "secondary" | "ghost" | "destructive"

const sizes = {
  md: { paddingVertical: spacing.sm + spacing.xs, paddingHorizontal: spacing.md },
  lg: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
} as const

export function Button({
  title, onPress, variant = "primary", size = "md", loading, disabled, style, testID, accessibilityLabel,
}: {
  title: string
  accessibilityLabel?: string
  onPress?: () => void
  variant?: Variant
  size?: keyof typeof sizes
  loading?: boolean
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  testID?: string
}) {
  const colors = useColors()
  const brand = useBrandColors()
  const surfaces: Record<Variant, { background: ColorValue; text: ColorValue }> = {
    primary: { background: brand.primary, text: brand.onPrimary },
    secondary: { background: colors.fill, text: colors.label },
    ghost: { background: "transparent", text: brand.link },
    destructive: { background: brand.destructive, text: brand.onDestructive },
  }
  const surface = surfaces[variant]
  const inactive = disabled || loading
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: surface.background, borderRadius: radius.md, borderCurve: "continuous", alignItems: "center",
          opacity: inactive ? 0.4 : pressed ? 0.7 : 1, ...sizes[size],
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={surface.text} /> : <ThemedText variant="headline" style={{ color: surface.text }}>{title}</ThemedText>}
    </Pressable>
  )
}
