import { Link } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { login } from "@mizan/core/auth/session"
import { Button } from "@/components/button"
import { Screen } from "@/components/screen"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { Notice } from "@/components/notice"
import { spacing, type, useBrandColors } from "@/theme"
import { describeError } from "@/utils/errors"

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
      setError(describeError(e))
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
      {error ? <Notice tone="error" testID="sign-in-error">{error}</Notice> : null}
      <Button testID="sign-in" title={t("auth.login")} size="lg" loading={busy} disabled={!identifier || !password} onPress={submit} />
      <View style={styles.links}>
        <Link href="/register" testID="open-register" style={[type.body, { color: brand.primary }]}>{`${t("auth.noAccount")} ${t("auth.register")}`}</Link>
        <Link href="/reset" testID="open-reset" style={[type.body, { color: brand.primary }]}>{t("auth.forgot")}</Link>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  intro: { gap: spacing.xs, marginBottom: spacing.md },
  links: { gap: spacing.md, marginTop: spacing.sm, alignItems: "center" },
})
