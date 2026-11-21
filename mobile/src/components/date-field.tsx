import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { todayIso } from "@mizan/core/domain/calendar/month"
import { spacing } from "@/theme"
import { Button } from "./button"
import { DatePicker } from "./date-picker"
import { ThemedText } from "./themed-text"

/** A labelled native date picker; when optional, it starts empty and offers a way back to "no date". */
export function DateField({ label, value, onChange, optional, testID }: { label: string; value: string | null; onChange: (iso: string | null) => void; optional?: boolean; testID?: string }) {
  const { t } = useTranslation()
  return (
    <View style={styles.row} testID={testID}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      {value === null ? (
        <Button variant="ghost" title={t("transactions.choose")} onPress={() => onChange(todayIso())} />
      ) : (
        <View style={styles.value}>
          <DatePicker value={value} onChange={onChange} />
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
