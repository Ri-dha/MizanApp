import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"

import { type ReportDetail, type ReportStatus } from "@/api/support"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ImagePicker } from "./ImagePicker"
import { ReportImage } from "./ReportImage"
import { Textarea } from "./Textarea"
import { useWhen } from "./useWhen"

export function StatusBadge({ status }: { status: ReportStatus }) {
  const { t } = useTranslation()
  return <Badge variant={status === "RESOLVED" ? "secondary" : status === "IN_PROGRESS" ? "default" : "outline"}>{t(`support.status.${status}`)}</Badge>
}

/** The conversation, oldest first. Operators see who answered; people see "Mizan support". */
export function ReportThread({ report, asOperator }: { report: ReportDetail; asOperator: boolean }) {
  const { t } = useTranslation()
  const when = useWhen()
  let imageNumber = 0
  return (
    <ol className="flex flex-col gap-3">
      {report.messages.map((message) => {
        const mine = asOperator ? message.fromOperator : !message.fromOperator
        const author = message.fromOperator
          ? asOperator ? message.authorName ?? t("support.operator") : t("support.team")
          : asOperator ? report.reporter?.displayName ?? t("support.reporter") : t("support.you")
        return (
          <li key={message.id} className={cn("flex flex-col gap-2 rounded-lg border p-3", mine ? "ms-6 bg-muted/50" : "me-6")}>
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{author}</span>
              <time dateTime={message.createdAt}>{when(message.createdAt)}</time>
            </div>
            {message.body && <p className="whitespace-pre-wrap break-words" dir="auto">{message.body}</p>}
            {message.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {message.attachments.map((image) => (
                  <ReportImage key={image.id} reportId={report.id} imageId={image.id} asOperator={asOperator} number={++imageNumber} removed={!!image.removedAt} />
                ))}
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

export function ReplyForm({ onSend, hint }: { onSend: (body: string, images: Blob[]) => Promise<boolean>; hint?: string }) {
  const { t } = useTranslation()
  const [body, setBody] = useState("")
  const [images, setImages] = useState<Blob[]>([])
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!body.trim() && images.length === 0) return
    setBusy(true)
    const sent = await onSend(body.trim(), images)
    setBusy(false)
    if (sent) {
      setBody("")
      setImages([])
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label htmlFor="reply" className="text-sm font-medium">{t("support.reply")}</label>
      <Textarea id="reply" rows={3} maxLength={4000} value={body} onChange={(e) => setBody(e.target.value)} disabled={busy} dir="auto" />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <ImagePicker images={images} onChange={setImages} disabled={busy} />
      <Button type="submit" className="self-start" disabled={busy || (!body.trim() && images.length === 0)}>
        {busy ? t("support.sending") : t("support.send")}
      </Button>
    </form>
  )
}
