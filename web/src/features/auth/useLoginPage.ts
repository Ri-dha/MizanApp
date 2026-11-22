import { useState, type FormEvent } from "react"

import { login } from "@/api/auth"
import { describeError } from "@/app/errors"

export function useLoginPage() {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
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

  return { identifier, setIdentifier, password, setPassword, error, busy, submit, offline: !navigator.onLine }
}

export type LoginPageModel = ReturnType<typeof useLoginPage>
