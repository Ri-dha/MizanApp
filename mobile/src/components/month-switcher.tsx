import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { shiftKey } from "@mizan/core/domain/calendar/month"
import { formatMonthKey } from "@/utils/month"
import { Button } from "./button"
import { ThemedText } from "./themed-text"

export function MonthSwitcher({ monthKey, onChange }: { monthKey: string; onChange: (key: string) => void }) {
  const { t, i18n } = useTranslation()
  return (
    <View style={styles.row}>
      <Button testID="previous-month" variant="ghost" title="‹" accessibilityLabel={t("month.previous")} onPress={() => onChange(shiftKey(monthKey, -1))} />
      <ThemedText testID="month-title" variant="headline">{formatMonthKey(monthKey, i18n.language)}</ThemedText>
      <Button testID="next-month" variant="ghost" title="›" accessibilityLabel={t("month.next")} onPress={() => onChange(shiftKey(monthKey, 1))} />
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
})
