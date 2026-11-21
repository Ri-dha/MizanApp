import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Modal, Pressable, SectionList, StyleSheet, View } from "react-native"

import { IRAQ, type CurrencyCatalogue } from "@mizan/core/market/currency"
import { useSession } from "@/hooks/use-core"
import { useCatalogue, useCountryName, useCurrencyName } from "@/hooks/use-currency"
import { colors, radius, spacing, useBrandColors } from "@/theme"
import { Button } from "./button"
import { Row } from "./row"
import { TextField } from "./text-field"
import { ThemedText } from "./themed-text"

interface Option {
  code: string
  title: string
  detail?: string
}

/** A labelled value that opens a searchable list in a page sheet; the native picker cannot hold some 150 entries. */
function PickerField({ label, searchLabel, value, shown, sections, onChange, testID }: {
  label: string
  searchLabel: string
  value: string
  shown: string
  sections: { title?: string; data: Option[] }[]
  onChange: (code: string) => void
  testID?: string
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
      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <ThemedText variant="headline">{label}</ThemedText>
            <Button testID={testID ? `${testID}-close` : undefined} variant="ghost" title={t("common.cancel")} onPress={() => setOpen(false)} />
          </View>
          <TextField testID={testID ? `${testID}-search` : undefined} label={searchLabel} value={query} onChangeText={setQuery} autoCorrect={false} autoCapitalize="none" />
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

const COMMON = ["USD", "EUR", "IQD", "GBP", "TRY", "SAR", "AED"]

/** The household's currency and the common ones first, then every offered currency by name. */
export function CurrencyField({ label, value, onChange, codes, testID }: {
  label?: string
  value: string
  onChange: (code: string) => void
  /** Limits the choice, e.g. to currencies with a rate; defaults to every offered currency. */
  codes?: string[]
  testID?: string
}) {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const catalogue = useCatalogue()
  const name = useCurrencyName()
  const base = session?.baseCurrency ?? "IQD"
  const sections = useMemo(() => {
    const offered = new Set(codes ?? catalogue?.currencies ?? [base, "USD"])
    offered.add(value)
    const top = [...new Set([base, ...(session?.trackedCurrencies ?? []), ...COMMON])].filter((c) => offered.has(c))
    const rest = [...offered].filter((c) => !top.includes(c)).sort((a, b) => name(a).localeCompare(name(b), i18n.language))
    const option = (code: string): Option => ({ code, title: code, detail: name(code) })
    return [{ data: top.map(option) }, ...(rest.length > 0 ? [{ title: t("currency.all"), data: rest.map(option) }] : [])]
  }, [codes, catalogue, base, session?.trackedCurrencies, value, name, i18n.language, t])
  return <PickerField label={label ?? t("accounts.currency")} searchLabel={t("worldRates.search")} value={value} shown={value} sections={sections} onChange={onChange} testID={testID} />
}

/** Iraq first, then every offered country by name in the app's language. */
export function CountryField({ label, value, onChange, catalogue, testID }: {
  label: string
  value: string
  onChange: (code: string) => void
  catalogue: CurrencyCatalogue | undefined
  testID?: string
}) {
  const { t, i18n } = useTranslation()
  const name = useCountryName()
  const sections = useMemo(() => {
    const others = (catalogue?.countries ?? []).map((c) => c.code).filter((c) => c !== IRAQ).sort((a, b) => name(a).localeCompare(name(b), i18n.language))
    return [{ data: [{ code: IRAQ, title: name(IRAQ) }] }, { data: others.map((code) => ({ code, title: name(code) })) }]
  }, [catalogue, name, i18n.language])
  return <PickerField label={label} searchLabel={t("currency.searchCountry")} value={value} shown={name(value)} sections={sections} onChange={onChange} testID={testID} />
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
