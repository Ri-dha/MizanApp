import { useTranslation } from "react-i18next"
import { Modal, Pressable, ScrollView, View } from "react-native"

import { Button } from "@/components/button"
import { Group, Row } from "@/components/row"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, spacing } from "@/theme"
import type { Choice } from "../use-home-layout-screen"

/** A page sheet of choices: one tap picks and closes, or, with `checked`, ticks several and stays open. */
export function SheetList({ visible, title, hint, onClose, items, checked, onPick, testID }: {
  visible: boolean
  title: string
  hint?: string
  onClose: () => void
  items: Choice[]
  checked?: string[]
  onPick: (id: string) => void
  testID: string
}) {
  const styles = useStyles()
  const { t } = useTranslation()
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.sheet}>
        <View style={styles.sheetHeader}>
          <ThemedText variant="headline">{title}</ThemedText>
          <Button testID={`${testID}-done`} variant="ghost" title={checked ? t("common.done") : t("common.cancel")} onPress={onClose} />
        </View>
        {hint ? <ThemedText variant="caption">{hint}</ThemedText> : null}
        <ScrollView>
          <Group>
            {items.map((item, index) => (
              <Pressable key={item.id} testID={`${testID}-${item.id}`} accessibilityRole={checked ? "checkbox" : "button"}
                accessibilityState={checked ? { checked: checked.includes(item.id) } : undefined}
                onPress={() => onPick(item.id)} style={({ pressed }) => (pressed ? styles.pressed : null)}>
                <Row last={index === items.length - 1} trailing={checked?.includes(item.id) ? <ThemedText style={styles.tick}>✓</ThemedText> : null}>
                  <ThemedText>{item.name}</ThemedText>
                </Row>
              </Pressable>
            ))}
          </Group>
        </ScrollView>
      </View>
    </Modal>
  )
}

const useStyles = makeStyles((colors) => ({
  pressed: { opacity: 0.6 },
  tick: { color: colors.primary },
  sheet: { flex: 1, backgroundColor: colors.background, padding: spacing.md, gap: spacing.md },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
}))
