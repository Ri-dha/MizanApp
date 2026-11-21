import { useTranslation } from "react-i18next"
import { Pressable } from "react-native"

import { APP_MODES, type AppMode } from "@mizan/core/domain/appMode"
import { Group, Row } from "@/components/row"
import { ThemedText } from "@/components/themed-text"
import { useBrandColors } from "@/theme"

/** ADR mode-1: the two modes as a radio list, each saying what it shows. */
export function AppModeChoice({ value, onChange }: { value: AppMode; onChange: (mode: AppMode) => void }) {
  const { t } = useTranslation()
  const brand = useBrandColors()
  return (
    <Group>
      {APP_MODES.map((mode, index) => (
        <Pressable key={mode} testID={`app-mode-${mode}`} accessibilityRole="radio" accessibilityState={{ checked: value === mode }}
          onPress={() => onChange(mode)} style={({ pressed }) => (pressed ? { opacity: 0.6 } : null)}>
          <Row last={index === APP_MODES.length - 1} trailing={value === mode ? <ThemedText style={{ color: brand.primary }}>✓</ThemedText> : null}>
            <ThemedText variant="headline">{t(`appMode.modes.${mode}`)}</ThemedText>
            <ThemedText variant="caption">{t(`appMode.hints.${mode}`)}</ThemedText>
          </Row>
        </Pressable>
      ))}
    </Group>
  )
}
