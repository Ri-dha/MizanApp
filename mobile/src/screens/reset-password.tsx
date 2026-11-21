import { router } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { confirmPasswordReset, requestPasswordReset } from "@mizan/core/auth/session"
import { Button } from "@/components/button"
import { Notice } from "@/components/notice"
import { Screen } from "@/components/screen"
import { TextField } from "@/components/text-field"
import { describeError } from "@/utils/errors"

const MIN_PASSWORD = 8

/** Two steps on one screen, like the web: ask for a code, then set the new password with it. */
export function ResetPassword() {
  const { t } = useTranslation()
  const [identifier, setIdentifier] = useState("")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [requested, setRequested] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      if (!requested) {
        await requestPasswordReset(identifier)
        setRequested(true)
      } else {
        await confirmPasswordReset(identifier, code, newPassword)
        setDone(true)
      }
    } catch (e) {
      setError(describeError(e))
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <Screen>
        <Notice testID="reset-done">{t("auth.resetDone")}</Notice>
        <Button size="lg" title={t("auth.login")} onPress={() => router.back()} />
      </Screen>
    )
  }
  return (
    <Screen>
      <TextField testID="reset-identifier" label={t("auth.identifier")} autoCapitalize="none" autoComplete="email" textContentType="emailAddress" keyboardType="email-address" editable={!requested} value={identifier} onChangeText={setIdentifier} />
      {requested ? (
        <>
          <Notice>{t("auth.resetRequested")}</Notice>
          <TextField testID="reset-code" label={t("auth.resetCode")} keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="one-time-code" value={code} onChangeText={setCode} />
          <TextField testID="reset-new-password" label={t("auth.newPassword")} secureTextEntry autoComplete="new-password" value={newPassword} onChangeText={setNewPassword} />
        </>
      ) : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Button
        testID="reset-submit"
        size="lg"
        title={requested ? t("auth.newPassword") : t("auth.resetTitle")}
        loading={busy}
        disabled={requested ? !code || newPassword.length < MIN_PASSWORD : !identifier}
        onPress={() => void submit()}
      />
    </Screen>
  )
}
