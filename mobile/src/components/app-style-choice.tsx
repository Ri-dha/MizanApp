import { useTranslation } from "react-i18next"
import { Pressable, useColorScheme, View } from "react-native"

import { APP_STYLES, type AppStyle } from "@mizan/core/domain/appStyle"
import { Group, Row } from "@/components/row"
import { ThemedText } from "@/components/themed-text"
import { PALETTES, makeStyles, radius, spacing, useColors } from "@/theme"

/** ADR styles-1: the templates as a radio list; each swatch wears its own template's colours. */
export function AppStyleChoice({ value, onChange }: { value: AppStyle; onChange: (style: AppStyle) => void }) {
  const { t } = useTranslation()
  const colors = useColors()
  const styles = useStyles()
  const scheme = useColorScheme() === "dark" ? "dark" : "light"
  return (
    <Group>
      {APP_STYLES.map((style, index) => {
        const own = PALETTES[style][scheme]
        return (
          <Pressable key={style} testID={`app-style-${style}`} accessibilityRole="radio" accessibilityState={{ checked: value === style }}
            onPress={() => onChange(style)} style={({ pressed }) => (pressed ? { opacity: 0.6 } : null)}>
            <Row last={index === APP_STYLES.length - 1} trailing={value === style ? <ThemedText style={{ color: colors.link }}>✓</ThemedText> : null}>
              <View style={styles.line}>
                <View style={[styles.swatch, { backgroundColor: own.background, borderColor: own.separator }]}>
                  <View style={[styles.hero, { backgroundColor: own.hero === own.surface ? own.fill : own.hero }]} />
                  <View style={[styles.dot, { backgroundColor: own.primary }]} />
                </View>
                <View style={styles.words}>
                  <ThemedText variant="headline">{t(`appStyle.styles.${style}`)}</ThemedText>
                  <ThemedText variant="caption">{t(`appStyle.hints.${style}`)}</ThemedText>
                </View>
              </View>
            </Row>
          </Pressable>
        )
      })}
    </Group>
  )
}

const useStyles = makeStyles(() => ({
  line: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  words: { flex: 1 },
  swatch: { width: 56, height: 40, borderRadius: radius.sm, borderCurve: "continuous", borderWidth: 1, padding: spacing.xs, gap: spacing.xs },
  hero: { flex: 1, borderRadius: spacing.xs },
  dot: { width: 16, height: 6, borderRadius: radius.full, alignSelf: "flex-end" },
}))
