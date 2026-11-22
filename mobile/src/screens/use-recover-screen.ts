import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { logout } from "@mizan/core/auth/session"
import { previewStartOver, recoverWithCode, startOver, type ResetPreview } from "@mizan/core/vault/account"
import { describeError } from "@/utils/errors"

/** After a password reset the new password cannot open the old keys; the recovery code can. */
export function useRecoverScreen() {
  const [code, setCode] = useState("")
  const [wrong, setWrong] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [startingOver, setStartingOver] = useState(false)

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      setWrong(!(await recoverWithCode(code)))
    } catch (e) {
      setError(describeError(e))
    } finally {
      setBusy(false)
    }
  }

  return {
    code, setCode, wrong, busy, error, startingOver,
    canSubmit: !!code,
    submit: () => void submit(),
    startOver: () => setStartingOver(true),
    back: () => setStartingOver(false),
    signOut: () => void logout(),
  }
}

export type RecoverScreenModel = ReturnType<typeof useRecoverScreen>

/** ADR e2e-3: says exactly what will be lost, from the server's own count, before anything is removed. */
export function useStartOver() {
  const { t } = useTranslation()
  const [preview, setPreview] = useState<ResetPreview | null>(null)
  const [typed, setTyped] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const word = t("vault.startOverWord")
  const sole = (preview?.households ?? []).filter((h) => h.soleKeyHolder)

  useEffect(() => {
    previewStartOver().then(setPreview).catch((e: unknown) => setError(describeError(e)))
  }, [])

  async function confirm() {
    setBusy(true)
    try {
      await startOver()
    } catch (e) {
      setError(describeError(e))
      setBusy(false)
    }
  }

  return {
    word, typed, setTyped, busy, error,
    loading: !preview,
    confirmed: typed.trim().toLocaleUpperCase() === word.toLocaleUpperCase(),
    losses: preview
      ? [
          t("vault.startOverPrivate", { count: preview.privateRecords ?? 0 }),
          ...sole.map((h) => t("vault.startOverShared", { name: h.name, count: h.sharedRecordsLost ?? 0 })),
          ...(sole.length === 0 ? [t("vault.startOverKept")] : []),
        ].join("\n")
      : "",
    confirm: () => void confirm(),
  }
}

export type StartOverModel = ReturnType<typeof useStartOver>
