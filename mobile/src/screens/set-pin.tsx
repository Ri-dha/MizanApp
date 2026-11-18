import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, StyleSheet, Switch } from "react-native"

import { biometricUnlock, setPin } from "@mizan/core/lock/store"
import { Button } from "@/components/button"
import { Screen } from "@/components/screen"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { spacing, useBrandColors } from "@/theme"

const PIN_PATTERN = /^\d{4,8}$/

export function SetPin() {
  const { t } = useTranslation()
  const brand = useBrandColors()
  const [pin, setPinText] = useState("")
  const [repeat, setRepeat] = useState("")
  const [withBiometrics, setWithBiometrics] = useState(false)
  const [canUseBiometrics, setCanUseBiometrics] = useState(false)
  const [busy, setBusy] = useState(false)
  const mismatch = repeat.length > 0 && repeat !== pin

  useEffect(() => {
    void biometricUnlock().available().then(setCanUseBiometrics)
  }, [])

  async function save() {
    setBusy(true)
    try {
      const dataKey = await setPin(pin)
      if (withBiometrics) await biometricUnlock().enrol(dataKey)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen centered>
      <ThemedText variant="title">{t("lock.setTitle")}</ThemedText>
      <ThemedText variant="subhead">{t("lock.setBody")}</ThemedText>
      <TextField testID="new-pin" label={t("lock.pin")} keyboardType="number-pad" secureTextEntry maxLength={8} value={pin} onChangeText={setPinText} />
      <TextField testID="repeat-pin" label={t("lock.confirmPin")} keyboardType="number-pad" secureTextEntry maxLength={8} value={repeat} onChangeText={setRepeat} />
      {mismatch ? <ThemedText style={{ color: brand.destructive }}>{t("lock.pinMismatch")}</ThemedText> : null}
      {canUseBiometrics ? (
        <Pressable
          testID="enrol-biometrics"
          accessibilityRole="switch"
          accessibilityState={{ checked: withBiometrics }}
          onPress={() => setWithBiometrics((on) => !on)}
          style={styles.toggle}
        >
          <ThemedText style={styles.toggleLabel}>{t("lock.enrollBiometric")}</ThemedText>
          <Switch value={withBiometrics} onValueChange={setWithBiometrics} />
        </Pressable>
      ) : null}
      <Button testID="save-pin" size="lg" title={t("lock.save")} loading={busy} disabled={!PIN_PATTERN.test(pin) || pin !== repeat} onPress={() => void save()} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  toggle: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  toggleLabel: { flex: 1 },
})
