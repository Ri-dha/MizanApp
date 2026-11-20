import { LifeBuoy, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { myReports, type ReportSummary } from "@/api/support"
import { describeError } from "@/app/errors"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { StatusBadge } from "./ReportThread"
import { useWhen } from "./useWhen"

export function SupportPage() {
  const { t } = useTranslation()
  const when = useWhen()
  const [reports, setReports] = useState<ReportSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    myReports().then(setReports).catch((e) => setError(describeError(e)))
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-3xl"><LifeBuoy className="size-7" /> {t("support.title")}</h1>
        <Button asChild><Link to="/support/new"><Plus /> {t("support.new")}</Link></Button>
      </div>
      <p className="text-muted-foreground">{t("support.intro")}</p>
      {error && <p className="text-destructive">{error}</p>}
      {!reports && !error && <p className="text-muted-foreground">{t("common.loading")}</p>}
      {reports?.length === 0 && <p className="text-muted-foreground">{t("support.none")}</p>}
      <div className="flex flex-col gap-2">
        {reports?.map((report) => (
          <Link key={report.id} to={`/support/${report.id}`}>
            <Card className={report.unread ? "border-primary" : undefined}>
              <CardContent className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-semibold" dir="auto">{report.subject}</span>
                  <span className="text-xs text-muted-foreground">{t(`support.category.${report.category}`)} · {when(report.lastMessageAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {report.unread && <span className="text-xs font-semibold text-primary">{t("support.newReply")}</span>}
                  <StatusBadge status={report.status} />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
