import { ArrowLeft } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router"

import { openReport, replyToReport, type ReportDetail } from "@/api/support"
import { describeError } from "@/app/errors"
import { Card, CardContent } from "@/components/ui/card"
import { ReplyForm, ReportThread, StatusBadge } from "./ReportThread"

export function SupportThreadPage() {
  const { t } = useTranslation()
  const { id = "" } = useParams()
  const [report, setReport] = useState<ReportDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    openReport(id).then(setReport).catch((e) => setError(describeError(e)))
  }, [id])

  async function send(body: string, images: Blob[]) {
    try {
      setReport(await replyToReport(id, body, images))
      setError(null)
      return true
    } catch (e) {
      setError(describeError(e))
      return false
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <Link to="/support" className="flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="size-4 rtl:rotate-180" /> {t("support.title")}</Link>
      {!report && !error && <p className="text-muted-foreground">{t("common.loading")}</p>}
      {report && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl" dir="auto">{report.subject}</h1>
            <StatusBadge status={report.status} />
          </div>
          <p className="text-sm text-muted-foreground">{t(`support.category.${report.category}`)}</p>
          <ReportThread report={report} asOperator={false} />
          <Card><CardContent><ReplyForm onSend={send} hint={report.status === "RESOLVED" ? t("support.reopenHint") : undefined} /></CardContent></Card>
        </>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
