import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { openReportAsOperator, replyAsOperator, reportQueue, setReportStatus, type ReportDetail, type ReportStatus, type ReportSummary } from "@/api/support"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ReplyForm, ReportThread, StatusBadge } from "@/features/support/ReportThread"
import { useAdminAction, useWhen } from "./adminAction"

const STATUSES: ReportStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED"]
const ALL = "ALL"

/** ADR support-1: reports people sent. Reading needs the role; replying and status changes the password again. */
export function ReportsTab() {
  const { t } = useTranslation()
  const run = useAdminAction()
  const when = useWhen()
  const [filter, setFilter] = useState<ReportStatus | typeof ALL>("OPEN")
  const [queue, setQueue] = useState<ReportSummary[] | null>(null)
  const [open, setOpen] = useState<ReportDetail | null>(null)

  const reload = async (status = filter) => setQueue(await reportQueue(status === ALL ? undefined : status))
  useEffect(() => {
    reportQueue(filter === ALL ? undefined : filter).then(setQueue).catch(() => setQueue([]))
  }, [filter])

  async function show(id: string) {
    await run(async () => {
      setOpen(await openReportAsOperator(id))
      await reload()
    })
  }

  if (open) {
    return (
      <div className="flex flex-col gap-4">
        <Button variant="ghost" className="self-start" onClick={() => setOpen(null)}>{t("admin.reports.back")}</Button>
        <Card>
          <CardHeader>
            <CardTitle dir="auto">{open.subject}</CardTitle>
            <CardDescription>
              {t(`support.category.${open.category}`)} · {open.reporter?.displayName} · <span dir="ltr">{open.reporter?.email}</span>
              {open.platform && <> · {open.platform}</>}{open.appVersion && <> {open.appVersion}</>}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2">
            <StatusBadge status={open.status} />
            <Select value={open.status} onValueChange={(v) => void run(async () => setOpen(await setReportStatus(open.id, v as ReportStatus)), t("admin.reports.statusSaved"))}>
              <SelectTrigger className="w-44" aria-label={t("admin.reports.setStatus")}><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`support.status.${s}`)}</SelectItem>)}</SelectContent>
            </Select>
          </CardContent>
        </Card>
        <ReportThread report={open} asOperator />
        <Card>
          <CardContent>
            <ReplyForm hint={t("admin.reports.replyHint")} onSend={(body, images) => run(async () => setOpen(await replyAsOperator(open.id, body, images)), t("admin.reports.sent"))} />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.reports.title")}</CardTitle>
          <CardDescription>{t("admin.reports.body")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={filter} onValueChange={(v) => setFilter(v as ReportStatus | typeof ALL)}>
            <SelectTrigger className="w-44" aria-label={t("admin.reports.filter")}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("admin.reports.all")}</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`support.status.${s}`)}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      {!queue && <p className="text-muted-foreground">{t("common.loading")}</p>}
      {queue?.length === 0 && <p className="text-muted-foreground">{t("admin.reports.none")}</p>}
      {queue?.map((report) => (
        <button key={report.id} type="button" className="text-start" onClick={() => void show(report.id)}>
          <Card className={report.unread ? "border-primary" : undefined}>
            <CardContent className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-semibold" dir="auto">{report.subject}</span>
                <span className="text-xs text-muted-foreground">
                  {t(`support.category.${report.category}`)} · {report.reporter?.displayName} · {when(report.lastMessageAt)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {report.unread && <span className="text-xs font-semibold text-primary">{t("admin.reports.unread")}</span>}
                <StatusBadge status={report.status} />
              </div>
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  )
}
