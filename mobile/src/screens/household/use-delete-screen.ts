import { router } from "expo-router"
import { useState } from "react"

import { requestHouseholdDeletion } from "@mizan/core/auth/household"
import { updateHousehold } from "@mizan/core/auth/session"
import { describeError } from "@/utils/errors"

/** The password re-proves who is asking; the household goes only after the grace period. */
export function useDeleteScreen() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function confirm() {
    setBusy(true)
    try {
      await requestHouseholdDeletion(password)
      await updateHousehold({})
      router.back()
    } catch (e) {
      setError(describeError(e))
      setBusy(false)
    }
  }

  return { password, setPassword, error, busy, canConfirm: !!password, confirm: () => void confirm() }
}

export type DeleteScreenModel = ReturnType<typeof useDeleteScreen>
