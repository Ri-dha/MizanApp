import { ChevronLeft } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { ReplyForm, ReportThread } from "../ReportThread"
import type { SupportThreadPageModel } from "../useSupportThreadPage"
import { SoftStatus, backLink, softCard, softHero } from "./parts"

/** Soft: the report's subject and state in a headline card, the conversation below it, the reply last. */
export default function SupportThreadSoft({ model }: { model: SupportThreadPageModel }) {
  const { t } = useTranslation()
  const { report } = model
  return (
    <div className="flex max-w-[720px] flex-col gap-5">
      <Link to="/support" className={backLink}><ChevronLeft className="size-4 rtl:rotate-180" />{t("support.title")}</Link>
      {model.loading && <p className="text-muted-foreground">{t("common.loading")}</p>}
      {report && (
        <>
          <section className={softHero}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h1 className="text-[22px] leading-7 font-semibold" dir="auto">{report.subject}</h1>
              <SoftStatus status={report.status} />
            </div>
            <p className="text-[13px] text-muted-foreground">{t(`support.category.${report.category}`)}</p>
          </section>
          <ReportThread report={report} asOperator={false} />
          <section className={softCard}>
            <ReplyForm onSend={model.send} hint={report.status === "RESOLVED" ? t("support.reopenHint") : undefined} />
          </section>
        </>
      )}
      {model.error && <p className="text-sm text-destructive">{model.error}</p>}
    </div>
  )
}
