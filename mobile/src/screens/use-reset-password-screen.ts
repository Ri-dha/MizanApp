import { router } from "expo-router"
import { useState } from "react"

import { confirmPasswordReset, requestPasswordReset } from "@mizan/core/auth/session"
import { describeError } from "@/utils/errors"

const MIN_PASSWORD = 8

/** Two steps on one screen, like the web: ask for a code, then set the new password with it. */
export function useResetPasswordScreen() {
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

  return {
    identifier, setIdentifier, code, setCode, newPassword, setNewPassword, requested, busy, error, done,
    canSubmit: requested ? !!code && newPassword.length >= MIN_PASSWORD : !!identifier,
    submit: () => void submit(),
    back: () => router.back(),
  }
}

export type ResetPasswordScreenModel = ReturnType<typeof useResetPasswordScreen>
