import { useState } from "react"

import { unlockVault } from "@mizan/core/auth/session"

/** The keys did not open on this device yet; the password derives them again (ADR e2e-1). */
export function useUnlockScreen() {
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

  return { password, setPassword, busy, failed, submit: () => void submit() }
}

export type UnlockScreenModel = ReturnType<typeof useUnlockScreen>
