import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button, StyleSheet, Text, TextInput, View } from "react-native"

import { ApiError } from "@mizan/core/api/client"
import { login } from "@mizan/core/auth/session"

export function SignIn() {
  const { t } = useTranslation()
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
      setError(e instanceof ApiError ? [e.detail, e.properties.cause].filter(Boolean).join(": ") : t("common.error"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={styles.page}>
      <Text style={styles.title}>{t("app.name")}</Text>
      <Text>{t("app.tagline")}</Text>
      <TextInput testID="identifier" style={styles.input} placeholder={t("auth.identifier")} autoCapitalize="none" keyboardType="email-address" value={identifier} onChangeText={setIdentifier} />
      <TextInput testID="password" style={styles.input} placeholder={t("auth.password")} secureTextEntry value={password} onChangeText={setPassword} />
      {error ? <Text testID="sign-in-error" style={styles.error}>{error}</Text> : null}
      <Button testID="sign-in" title={busy ? t("common.loading") : t("auth.login")} onPress={submit} disabled={busy || !identifier || !password} />
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, justifyContent: "center", padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: "700" },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, padding: 12, fontSize: 16 },
  error: { color: "#c0392b" },
})
