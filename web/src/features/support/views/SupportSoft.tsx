import { ChevronRight, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { Button } from "@/components/ui/button"
import type { SupportPageModel } from "../useSupportPage"
import { SoftStatus, softHero } from "./parts"

const columns = "grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-4 gap-y-1 md:grid-cols-[minmax(0,1fr)_7rem_11rem_auto_1.25rem]"

/** Soft: what the page is for under its title, then every report as a row of one table-like card. */
export default function SupportSoft({ model }: { model: SupportPageModel }) {
  const { t } = useTranslation()
  const { reports } = model
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">{t("support.title")}</h1>
        <Button asChild><Link to="/support/new"><Plus /> {t("support.new")}</Link></Button>
      </div>
      <p className="max-w-[680px] text-[15px] text-muted-foreground">{t("support.intro")}</p>
      {model.error && <p className="text-destructive">{model.error}</p>}
      {model.loading && <p className="text-muted-foreground">{t("common.loading")}</p>}
      {reports?.length === 0 && <p className="text-muted-foreground">{t("support.none")}</p>}
      {reports && reports.length > 0 && (
        <section className={`${softHero} gap-0`}>
          <div className={`${columns} hidden px-2 pb-2 text-sm font-semibold text-muted-foreground md:grid`}>
            <span>{t("support.table.report")}</span>
            <span>{t("support.categoryLabel")}</span>
            <span>{t("support.table.updated")}</span>
            <span>{t("support.table.status")}</span>
            <span />
          </div>
          {reports.map((report) => (
            <Link key={report.id} to={`/support/${report.id}`}
              className={`${columns} rounded-md border-t border-border px-2 py-3 text-sm transition-colors first:border-t-0 hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:first:border-t`}>
              <span className="truncate font-semibold" dir="auto">{report.subject}</span>
              <span className="col-start-1 row-start-2 text-muted-foreground md:col-start-auto md:row-start-auto md:text-foreground">{t(`support.category.${report.category}`)}</span>
              <span className="hidden tabular-nums md:block">{model.when(report.lastMessageAt)}</span>
              <span className="col-start-2 row-span-2 row-start-1 md:col-start-auto md:row-span-1 md:row-start-auto"><SoftStatus status={report.status} unread={report.unread} /></span>
              <ChevronRight className="col-start-3 row-span-2 row-start-1 size-5 text-muted-foreground md:col-start-auto md:row-span-1 md:row-start-auto rtl:rotate-180" />
            </Link>
          ))}
        </section>
      )}
    </div>
  )
}
