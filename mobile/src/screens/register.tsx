import { useState } from "react"
import { useTranslation } from "react-i18next"

import { register } from "@mizan/core/auth/session"
import { Button } from "@/components/button"
import { Notice } from "@/components/notice"
import { Screen } from "@/components/screen"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { describeError } from "@/utils/errors"

const MIN_PASSWORD = 8

export function Register() {
  const { t, i18n } = useTranslation()
  const [displayName, setDisplayName] = useState("")
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      await register(identifier, password, displayName, i18n.language.startsWith("ar") ? "ar" : "en")
    } catch (e) {
      setError(describeError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen>
      <TextField testID="display-name" label={t("auth.displayName")} autoComplete="name" maxLength={80} value={displayName} onChangeText={setDisplayName} />
      <TextField testID="register-identifier" label={t("auth.identifier")} autoCapitalize="none" autoComplete="username" keyboardType="email-address" value={identifier} onChangeText={setIdentifier} />
      <ThemedText variant="caption">{t("auth.identifierHint")}</ThemedText>
      <TextField testID="register-password" label={t("auth.password")} secureTextEntry autoComplete="new-password" value={password} onChangeText={setPassword} />
      {error ? <Notice tone="error" testID="register-error">{error}</Notice> : null}
      <Button testID="register" size="lg" title={t("auth.register")} loading={busy} disabled={!displayName || !identifier || password.length < MIN_PASSWORD} onPress={() => void submit()} />
    </Screen>
  )
}
