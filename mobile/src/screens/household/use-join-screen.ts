import { router } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { acceptInvitation, previewInvitation } from "@mizan/core/auth/household"
import { DATE, formatWhen } from "@/utils/dates"
import { describeError } from "@/utils/errors"

type Preview = Awaited<ReturnType<typeof previewInvitation>>

/** Where an invitation link lands: who invited you, to which household, as what. */
export function useJoinScreen(token: string) {
  const { t, i18n } = useTranslation()
  const [preview, setPreview] = useState<Preview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    previewInvitation(token).then(setPreview).catch((e) => setError(describeError(e)))
  }, [token])

  async function join() {
    setBusy(true)
    try {
      await acceptInvitation(token)
      router.dismissTo("/")
    } catch (e) {
      setError(describeError(e))
      setBusy(false)
    }
  }

  return {
    error, busy,
    join: () => void join(),
    invitation: preview
      ? {
          household: preview.householdName,
          role: t(`household.roles.${preview.role}`),
          body: t("household.joinBody", { household: preview.householdName, by: preview.invitedBy, role: t(`household.roles.${preview.role}`) }),
          expires: t("household.expires", { date: formatWhen(preview.expiresAt, i18n.language, DATE) }),
        }
      : null,
  }
}

export type JoinScreenModel = ReturnType<typeof useJoinScreen>
