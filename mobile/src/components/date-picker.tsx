import { DateTimePicker } from "@expo/ui/community/datetime-picker"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Platform, Pressable } from "react-native"

import { radius, spacing, useBrandColors, makeStyles } from "@/theme"
import { dateOf, formatDay, isoOf, SHORT_DATE } from "@/utils/dates"
import { ThemedText } from "./themed-text"

/**
 * A date the person can change. iOS shows the compact inline picker. Android has no inline picker:
 * its picker is a dialog that opens whenever it is on screen, so it is shown only after a tap.
 */
export function DatePicker({ value, onChange, testID }: { value: string; onChange: (iso: string) => void; testID?: string }) {
  const styles = useStyles()
  const { i18n } = useTranslation()
  const brand = useBrandColors()
  const [open, setOpen] = useState(false)

  if (Platform.OS !== "android") {
    return <DateTimePicker testID={testID} value={dateOf(value)} mode="date" display="compact" accentColor={brand.primary} locale={i18n.language} onValueChange={(_, date) => onChange(isoOf(date))} />
  }

  return (
    <>
      <Pressable testID={testID} accessibilityRole="button" onPress={() => setOpen(true)} style={({ pressed }) => [styles.value, pressed ? styles.pressed : null]}>
        <ThemedText>{formatDay(value, i18n.language, SHORT_DATE)}</ThemedText>
      </Pressable>
      {open ? (
        <DateTimePicker
          value={dateOf(value)}
          mode="date"
          accentColor={brand.primary}
          onValueChange={(_, date) => {
            setOpen(false)
            onChange(isoOf(date))
          }}
          onDismiss={() => setOpen(false)}
        />
      ) : null}
    </>
  )
}

const useStyles = makeStyles((colors) => ({
  value: { backgroundColor: colors.fill, borderRadius: radius.sm, borderCurve: "continuous", paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  pressed: { opacity: 0.6 },
}))
