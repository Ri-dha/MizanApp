import { DateTimePicker } from "@expo/ui/community/datetime-picker"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { todayIso } from "@mizan/core/domain/calendar/month"
import { spacing, useBrandColors } from "@/theme"
import { dateOf, isoOf } from "@/utils/dates"
import { Button } from "./button"
import { ThemedText } from "./themed-text"

/** A labelled native date picker; when optional, it starts empty and offers a way back to "no date". */
export function DateField({ label, value, onChange, optional, testID }: { label: string; value: string | null; onChange: (iso: string | null) => void; optional?: boolean; testID?: string }) {
  const { t, i18n } = useTranslation()
  const brand = useBrandColors()
  return (
    <View style={styles.row} testID={testID}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      {value === null ? (
        <Button variant="ghost" title={t("transactions.choose")} onPress={() => onChange(todayIso())} />
      ) : (
        <View style={styles.value}>
          <DateTimePicker value={dateOf(value)} mode="date" display="compact" accentColor={brand.primary} locale={i18n.language} onChange={(_, date) => date && onChange(isoOf(date))} />
          {optional ? <Button variant="ghost" title="×" accessibilityLabel={t("common.cancel")} onPress={() => onChange(null)} /> : null}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44, gap: spacing.md },
  label: { flex: 1 },
  value: { flexDirection: "row", alignItems: "center" },
})
