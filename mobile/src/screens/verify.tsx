import { router } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { resendVerification, verifyContact } from "@mizan/core/auth/session"
import { Button } from "@/components/button"
import { Notice } from "@/components/notice"
import { Screen } from "@/components/screen"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { useSession } from "@/hooks/use-core"
import { describeError } from "@/utils/errors"

const CODE_LENGTH = 6

export function Verify() {
  const { t } = useTranslation()
  const session = useSession()
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function confirm(value: string) {
    setBusy(true)
    setError(null)
    try {
      await verifyContact(value)
      router.back()
    } catch (e) {
      setError(describeError(e))
      setCode("")
    } finally {
      setBusy(false)
    }
  }

  function typed(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, CODE_LENGTH)
    setCode(digits)
    if (digits.length === CODE_LENGTH) void confirm(digits)
  }

  async function resend() {
    setError(null)
    try {
      await resendVerification()
      setSent(true)
    } catch (e) {
      setError(describeError(e))
    }
  }

  return (
    <Screen>
      <ThemedText variant="subhead">{t("auth.verifyBody", { contact: session?.contact })}</ThemedText>
      <TextField testID="verify-code" label={t("auth.verify")} keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="one-time-code" maxLength={CODE_LENGTH} editable={!busy} value={code} onChangeText={typed} autoFocus />
      {error ? <Notice tone="error" testID="verify-error">{error}</Notice> : null}
      {sent ? <Notice>{t("auth.codeSent")}</Notice> : null}
      <Button testID="resend-code" variant="secondary" title={t("auth.resend")} onPress={() => void resend()} />
    </Screen>
  )
}
