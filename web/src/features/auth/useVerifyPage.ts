import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { toast } from "sonner"

import { resendVerification, useSession, verifyContact } from "@/api/auth"
import { describeError } from "@/app/errors"

export const CODE_LENGTH = 6

export function useVerifyPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const session = useSession()
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function confirm(value: string) {
    setBusy(true)
    setError(null)
    try {
      await verifyContact(value)
      toast(t("auth.verified"))
      void navigate("/")
    } catch (e) {
      setError(describeError(e))
      setCode("")
    } finally {
      setBusy(false)
    }
  }

  async function resend() {
    try {
      await resendVerification()
      toast(t("auth.codeSent"))
    } catch (e) {
      setError(describeError(e))
    }
  }

  return { contact: session?.contact, code, setCode, error, busy, confirm, resend, skip: () => void navigate("/") }
}

export type VerifyPageModel = ReturnType<typeof useVerifyPage>
