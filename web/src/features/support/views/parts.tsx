import { CircleCheck, CircleDot, RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { ReportStatus } from "@/api/support"

export const softCard = "flex min-w-0 flex-col gap-3 rounded-[10px] border border-border bg-card p-5 shadow-card"
export const softHero = `${softCard} border-transparent shadow-sheet`
export const backLink = "flex items-center gap-1 self-start text-sm font-medium text-link underline-offset-4 hover:underline"

const pill = "inline-flex h-[22px] items-center gap-1 rounded-full px-2 text-xs font-semibold whitespace-nowrap"

export function SoftStatus({ status, unread }: { status: ReportStatus; unread?: boolean }) {
  const { t } = useTranslation()
  if (unread) return <span className={`${pill} bg-info-soft text-link`}><CircleDot className="size-3.5" />{t("support.newReply")}</span>
  if (status === "RESOLVED") return <span className={`${pill} bg-success-soft text-success`}><CircleCheck className="size-3.5" />{t("support.status.RESOLVED")}</span>
  if (status === "IN_PROGRESS") return <span className={`${pill} bg-muted text-muted-foreground`}><RefreshCw className="size-3.5" />{t("support.status.IN_PROGRESS")}</span>
  return <span className={`${pill} border border-border`}>{t(`support.status.${status}`)}</span>
}
