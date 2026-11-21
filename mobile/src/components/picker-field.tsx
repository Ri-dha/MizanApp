import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Modal, Pressable, SectionList, StyleSheet, View } from "react-native"

import { colors, radius, spacing, useBrandColors } from "@/theme"
import { Button } from "./button"
import { Row } from "./row"
import { TextField } from "./text-field"
import { ThemedText } from "./themed-text"

export interface Option {
  code: string
  title: string
  detail?: string
}

/** A labelled value that opens a searchable list in a page sheet; the native picker cannot hold some 150 entries. */
export function PickerField({ label, searchLabel, value, shown, sections, onChange, testID, hint }: {
  label: string
  /** Leave out for short lists: no search box then. */
  searchLabel?: string
  value: string
  shown: string
  sections: { title?: string; data: Option[] }[]
  onChange: (code: string) => void
  testID?: string
  /** A line under the field, e.g. what choosing does. */
  hint?: string
}) {
  const { t } = useTranslation()
  const brand = useBrandColors()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const needle = query.trim().toLocaleLowerCase()
  const filtered = needle
    ? sections.map((s) => ({ ...s, data: s.data.filter((o) => `${o.code} ${o.title} ${o.detail ?? ""}`.toLocaleLowerCase().includes(needle)) })).filter((s) => s.data.length > 0)
    : sections

  function pick(code: string) {
    setOpen(false)
    setQuery("")
    if (code !== value) onChange(code)
  }

  return (
    <View style={styles.field}>
      <ThemedText variant="subhead">{label}</ThemedText>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${shown}`}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.value, pressed ? styles.pressed : null]}
      >
        <ThemedText numberOfLines={1} style={styles.valueText}>{shown}</ThemedText>
        <ThemedText variant="subhead">▾</ThemedText>
      </Pressable>
      {hint ? <ThemedText variant="caption">{hint}</ThemedText> : null}
      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <ThemedText variant="headline">{label}</ThemedText>
            <Button testID={testID ? `${testID}-close` : undefined} variant="ghost" title={t("common.cancel")} onPress={() => setOpen(false)} />
          </View>
          {searchLabel ? <TextField testID={testID ? `${testID}-search` : undefined} label={searchLabel} value={query} onChangeText={setQuery} autoCorrect={false} autoCapitalize="none" /> : null}
          <SectionList
            sections={filtered}
            keyExtractor={(o) => o.code}
            keyboardShouldPersistTaps="handled"
            stickySectionHeadersEnabled={false}
            renderSectionHeader={({ section }) => (section.title ? <ThemedText variant="caption" style={styles.sectionTitle}>{section.title}</ThemedText> : null)}
            renderItem={({ item }) => (
              <Pressable testID={testID ? `${testID}-${item.code}` : undefined} accessibilityRole="button" onPress={() => pick(item.code)} style={({ pressed }) => (pressed ? styles.pressed : null)}>
                <Row trailing={item.code === value ? <ThemedText style={{ color: brand.primary }}>✓</ThemedText> : null}>
                  <ThemedText>{item.title}</ThemedText>
                  {item.detail ? <ThemedText variant="caption">{item.detail}</ThemedText> : null}
                </Row>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  value: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radius.md, borderCurve: "continuous", paddingHorizontal: spacing.md, paddingVertical: spacing.sm + spacing.xs,
  },
  valueText: { flex: 1 },
  pressed: { opacity: 0.6 },
  sheet: { flex: 1, backgroundColor: colors.background, padding: spacing.md, gap: spacing.md },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { paddingTop: spacing.md, paddingBottom: spacing.xs },
})
