import { useState } from "react"
import { useTranslation } from "react-i18next"

import type { ReportDetail } from "@/platform/support"
import { formatWhen } from "@/utils/dates"

export const MAX_BODY = 4000

export function useWhen() {
  const { i18n } = useTranslation()
  return (iso: string) => formatWhen(iso, i18n.language)
}

/** The conversation, oldest first, with the pictures numbered across the whole thread. */
export function useThread(report: ReportDetail) {
  const { t } = useTranslation()
  const when = useWhen()
  let imageNumber = 0
  return {
    reportId: report.id,
    messages: report.messages.map((message) => ({
      id: message.id,
      mine: !message.fromOperator,
      author: message.fromOperator ? t("support.team") : t("support.you"),
      when: when(message.createdAt),
      body: message.body,
      images: message.attachments.map((image) => ({ image, number: ++imageNumber })),
    })),
  }
}

export type ThreadModel = ReturnType<typeof useThread>

/** A reply being written; it is cleared only once the server has taken it. */
export function useReplyForm(onSend: (body: string, images: string[]) => Promise<boolean>, hint?: string) {
  const [body, setBody] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const empty = !body.trim() && images.length === 0

  async function send() {
    if (empty) return
    setBusy(true)
    const sent = await onSend(body.trim(), images)
    setBusy(false)
    if (sent) {
      setBody("")
      setImages([])
    }
  }

  return { body, setBody, images, setImages, busy, empty, hint, send: () => void send() }
}

export type ReplyFormModel = ReturnType<typeof useReplyForm>
