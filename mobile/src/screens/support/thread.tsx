import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Badge, type Tone } from "@/components/soft-kit"
import type { ReportDetail, ReportStatus } from "@/platform/support"
import { useAppStyle } from "@/theme"
import { useReplyForm, useThread } from "./use-thread-screen"
import { ReplyFormSoft, ThreadSoft } from "./views/thread-soft"

export { MAX_BODY, useWhen } from "./use-thread-screen"

/** ADR styles-1: each template draws the conversation its own way; a template without a view of its own gets Soft. */
const THREAD_VIEWS = { soft: ThreadSoft }
const REPLY_VIEWS = { soft: ReplyFormSoft }

const STATUS_TONE: Record<ReportStatus, Tone> = { OPEN: "neutral", IN_PROGRESS: "info", RESOLVED: "ok" }

export function StatusBadge({ status }: { status: ReportStatus }) {
  const { t } = useTranslation()
  return <Badge tone={STATUS_TONE[status] ?? "neutral"}>{t(`support.status.${status}`)}</Badge>
}

/** The conversation, oldest first; the person's own messages sit towards the end edge. */
export function ReportThread({ report }: { report: ReportDetail }) {
  const model = useThread(report)
  const View = viewFor(THREAD_VIEWS, useAppStyle())
  return <View model={model} />
}

export function ReplyForm({ onSend, hint }: { onSend: (body: string, images: string[]) => Promise<boolean>; hint?: string }) {
  const model = useReplyForm(onSend, hint)
  const View = viewFor(REPLY_VIEWS, useAppStyle())
  return <View model={model} />
}
