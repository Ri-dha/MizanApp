import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { biometricUnlock, unlockWithBiometrics, unlockWithPin } from "@mizan/core/lock/store"
import { Button } from "@/components/button"
import { Screen } from "@/components/screen"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { useBrandColors } from "@/theme"

export function LockScreen() {
  const { t } = useTranslation()
  const brand = useBrandColors()
  const [pin, setPin] = useState("")
  const [wrong, setWrong] = useState(false)
  const [biometric, setBiometric] = useState(false)

  useEffect(() => {
    void biometricUnlock().enrolled().then((enrolled) => {
      setBiometric(enrolled)
      if (enrolled) void unlockWithBiometrics()
    })
  }, [])

  async function submit() {
    const ok = await unlockWithPin(pin)
    setWrong(!ok)
    setPin("")
  }

  return (
    <Screen centered>
      <ThemedText variant="title">{t("lock.title")}</ThemedText>
      <TextField testID="lock-pin" label={t("lock.enterPin")} keyboardType="number-pad" secureTextEntry maxLength={8} value={pin} onChangeText={setPin} onSubmitEditing={submit} autoFocus={!biometric} />
      {wrong ? <ThemedText testID="wrong-pin" style={{ color: brand.destructive }}>{t("lock.wrongPin")}</ThemedText> : null}
      <Button testID="unlock-pin" size="lg" title={t("lock.unlock")} disabled={pin.length < 4} onPress={() => void submit()} />
      {biometric ? <Button testID="unlock-biometric" variant="ghost" title={t("lock.biometric")} onPress={() => void unlockWithBiometrics()} /> : null}
    </Screen>
  )
}
