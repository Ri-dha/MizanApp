import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { toast } from "sonner"

import { confirmPasswordReset, requestPasswordReset } from "@/api/auth"
import { describeError } from "@/app/errors"

export function useResetPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState("")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [requested, setRequested] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (!requested) {
        await requestPasswordReset(identifier)
        setRequested(true)
        toast(t("auth.resetRequested"))
      } else {
        await confirmPasswordReset(identifier, code, newPassword)
        toast(t("auth.resetDone"))
        void navigate("/login")
      }
    } catch (e) {
      setError(describeError(e))
    } finally {
      setBusy(false)
    }
  }

  return { identifier, setIdentifier, code, setCode, newPassword, setNewPassword, requested, error, busy, submit }
}

export type ResetPasswordPageModel = ReturnType<typeof useResetPasswordPage>
