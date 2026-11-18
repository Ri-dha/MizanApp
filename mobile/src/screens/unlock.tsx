import { useState } from "react"
import { useTranslation } from "react-i18next"

import { unlockVault } from "@mizan/core/auth/session"
import { Button } from "@/components/button"
import { Screen } from "@/components/screen"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { useBrandColors } from "@/theme"

/** The keys did not open on this device yet; the password derives them again (ADR e2e-1). */
export function Unlock() {
  const { t } = useTranslation()
  const brand = useBrandColors()
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  async function submit() {
    setBusy(true)
    setFailed(false)
    try {
      await unlockVault(password)
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen centered>
      <ThemedText variant="title">{t("vault.unlockTitle")}</ThemedText>
      <TextField testID="unlock-password" label={t("auth.password")} secureTextEntry value={password} onChangeText={setPassword} onSubmitEditing={submit} />
      {failed ? <ThemedText style={{ color: brand.destructive }}>{t("common.error")}</ThemedText> : null}
      <Button testID="unlock" title={t("vault.unlock")} size="lg" loading={busy} disabled={!password} onPress={submit} />
    </Screen>
  )
}
