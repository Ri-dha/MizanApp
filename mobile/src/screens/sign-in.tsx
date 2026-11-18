import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { ApiError } from "@mizan/core/api/client"
import { login } from "@mizan/core/auth/session"
import { Button } from "@/components/button"
import { Screen } from "@/components/screen"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { spacing, useBrandColors } from "@/theme"

export function SignIn() {
  const { t } = useTranslation()
  const brand = useBrandColors()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      await login(identifier, password)
    } catch (e) {
      setError(e instanceof ApiError && e.status !== 0 ? e.detail : t("common.error"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen centered>
      <View style={styles.intro}>
        <ThemedText variant="largeTitle">{t("app.name")}</ThemedText>
        <ThemedText variant="subhead">{t("app.tagline")}</ThemedText>
      </View>
      <TextField testID="identifier" label={t("auth.identifier")} autoCapitalize="none" autoComplete="username" keyboardType="email-address" value={identifier} onChangeText={setIdentifier} />
      <ThemedText variant="caption">{t("auth.identifierHint")}</ThemedText>
      <TextField testID="password" label={t("auth.password")} secureTextEntry autoComplete="current-password" value={password} onChangeText={setPassword} onSubmitEditing={submit} />
      {error ? <ThemedText testID="sign-in-error" style={{ color: brand.destructive }}>{error}</ThemedText> : null}
      <Button testID="sign-in" title={t("auth.login")} size="lg" loading={busy} disabled={!identifier || !password} onPress={submit} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  intro: { gap: spacing.xs, marginBottom: spacing.md },
})
