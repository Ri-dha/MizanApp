import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { DEFAULT_LAYOUT, definitionOf, moveWidget, saveHomeLayout, updateWidget, type HomeWidget, type WidgetSize } from "@mizan/core/db/homeLayout"
import { Button } from "@/components/button"
import { Chips } from "@/components/chips"
import { Group, Row } from "@/components/row"
import { Screen } from "@/components/screen"
import { ThemedText } from "@/components/themed-text"
import { ToggleRow } from "@/components/toggle-row"
import { useHomeLayout } from "@/hooks/use-home-layout"
import { spacing } from "@/theme"

const SIZES: WidgetSize[] = ["full", "compact"]

/** ADR home-1: which cards Home shows, in what order, how big, and what each one shows. */
export function HomeLayoutEditor() {
  const { t } = useTranslation()
  const layout = useHomeLayout()
  const save = (next: HomeWidget[]) => void saveHomeLayout(next)

  return (
    <Screen>
      <Stack.Screen options={{ title: t("homeLayout.title"), headerBackButtonDisplayMode: "minimal" }} />
      <ThemedText variant="subhead">{t("homeLayout.body")}</ThemedText>
      {layout.map((widget, index) => {
        const definition = definitionOf(widget.kind)
        return (
          <Group key={widget.id}>
            <Row>
              <ToggleRow testID={`widget-${widget.kind}`} label={widget.title || t(`homeLayout.kinds.${widget.kind}`)} value={widget.visible} onChange={(visible) => save(updateWidget(layout, widget.id, { visible }))} />
            </Row>
            {widget.visible ? (
              <Row>
                <View style={styles.field}>
                  <ThemedText variant="caption">{t("homeLayout.size")}</ThemedText>
                  <Chips
                    testID={`widget-${widget.kind}-size`}
                    options={SIZES.map((size) => ({ value: size, label: t(`homeLayout.sizes.${size}`) }))}
                    value={widget.size}
                    onChange={(size) => size && save(updateWidget(layout, widget.id, { size: size as WidgetSize }))}
                  />
                </View>
              </Row>
            ) : null}
            {widget.visible
              ? definition?.options.map((option) => (
                  <Row key={option.key}>
                    <View style={styles.field}>
                      <ThemedText variant="caption">{t(`homeLayout.options.${option.key}.label`)}</ThemedText>
                      <Chips
                        testID={`widget-${widget.kind}-${option.key}`}
                        options={option.values.map((value) => ({ value, label: t(`homeLayout.options.${option.key}.values.${value}`) }))}
                        value={widget.options[option.key]}
                        onChange={(value) => value && save(updateWidget(layout, widget.id, { options: { [option.key]: value } }))}
                      />
                    </View>
                  </Row>
                ))
              : null}
            <Row last>
              <View style={styles.moves}>
                <Button testID={`up-${widget.kind}`} variant="ghost" title={`↑ ${t("homeLayout.moveUp")}`} disabled={index === 0} onPress={() => save(moveWidget(layout, widget.id, -1))} />
                <Button testID={`down-${widget.kind}`} variant="ghost" title={`↓ ${t("homeLayout.moveDown")}`} disabled={index === layout.length - 1} onPress={() => save(moveWidget(layout, widget.id, 1))} />
              </View>
            </Row>
          </Group>
        )
      })}
      <Button testID="reset-home" variant="secondary" title={t("homeLayout.reset")} onPress={() => save(DEFAULT_LAYOUT)} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  moves: { flexDirection: "row", justifyContent: "space-between" },
})
