import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router"
import { toast } from "sonner"

import { useSession } from "@/api/auth"
import { acceptInvitation, previewInvitation, rememberPendingInvite } from "@/api/household"
import { DATE, formatWhen } from "@/app/dates"
import { describeError } from "@/app/errors"

type Preview = Awaited<ReturnType<typeof previewInvitation>>

/** The landing page of an invitation link; works before sign-in and finishes the join after it. */
export function useJoinPage() {
  const { t, i18n } = useTranslation()
  const { token = "" } = useParams()
  const session = useSession()
  const navigate = useNavigate()
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
      toast(t("household.joined"))
      navigate("/", { replace: true })
    } catch (e) {
      toast(describeError(e))
      setBusy(false)
    }
  }

  return {
    signedIn: Boolean(session), preview, error, busy, join,
    remember: () => rememberPendingInvite(token),
    date: (iso: string) => formatWhen(iso, i18n.language, DATE),
  }
}

export type JoinPageModel = ReturnType<typeof useJoinPage>
