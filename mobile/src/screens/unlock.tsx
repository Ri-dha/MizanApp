import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button, StyleSheet, Text, TextInput, View } from "react-native"

import { unlockVault } from "@mizan/core/auth/session"

/** The keys did not open on this device yet; the password derives them again (ADR e2e-1). */
export function Unlock() {
  const { t } = useTranslation()
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
    <View style={styles.page}>
      <Text style={styles.title}>{t("vault.unlockTitle")}</Text>
      <TextInput testID="unlock-password" style={styles.input} placeholder={t("auth.password")} secureTextEntry value={password} onChangeText={setPassword} />
      {failed ? <Text style={styles.error}>{t("common.error")}</Text> : null}
      <Button testID="unlock" title={busy ? t("common.loading") : t("vault.unlock")} onPress={submit} disabled={busy || !password} />
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, justifyContent: "center", padding: 24, gap: 12 },
  title: { fontSize: 22, fontWeight: "600" },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, padding: 12, fontSize: 16 },
  error: { color: "#c0392b" },
})
