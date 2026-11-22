import { useState } from "react"

import { login } from "@mizan/core/auth/session"
import { describeError } from "@/utils/errors"

/** Everything the sign-in screen knows and can do; the templates only decide how it is drawn (ADR styles-1). */
export function useSignInScreen() {
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

  return { identifier, setIdentifier, password, setPassword, busy, error, canSubmit: !!identifier && !!password, submit: () => void submit() }
}

export type SignInScreenModel = ReturnType<typeof useSignInScreen>
