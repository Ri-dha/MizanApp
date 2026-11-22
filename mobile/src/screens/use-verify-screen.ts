import { router } from "expo-router"
import { useState } from "react"

import { resendVerification, verifyContact } from "@mizan/core/auth/session"
import { useSession } from "@/hooks/use-core"
import { describeError } from "@/utils/errors"

export const CODE_LENGTH = 6

/** The six-digit code sent to the person's contact; the last digit typed confirms it. */
export function useVerifyScreen() {
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

  return { contact: session?.contact, code, typed, busy, error, sent, resend: () => void resend() }
}

export type VerifyScreenModel = ReturnType<typeof useVerifyScreen>
