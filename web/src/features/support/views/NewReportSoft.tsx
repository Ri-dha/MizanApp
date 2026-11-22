import { ChevronLeft } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import type { ReportCategory } from "@/api/support"
import { Field } from "@/components/Field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Segmented } from "@/features/settings/views/parts"
import { ImagePicker } from "../ImagePicker"
import { Textarea } from "../Textarea"
import { CATEGORIES, type NewReportPageModel } from "../useNewReportPage"
import { backLink, softHero } from "./parts"

/** Soft: a way back above one form card, with the kind of report as a segmented choice. */
export default function NewReportSoft({ model }: { model: NewReportPageModel }) {
  const { t } = useTranslation()
  const { busy } = model
  return (
    <div className="flex flex-col gap-5">
      <Link to="/support" className={backLink}><ChevronLeft className="size-4 rtl:rotate-180" />{t("support.title")}</Link>
      <form onSubmit={model.submit} className={`${softHero} max-w-[720px] gap-4.5 sm:p-7`}>
        <h1 className="text-[22px] leading-7 font-semibold">{t("support.new")}</h1>
        <Alert><AlertDescription>{t("support.privacy")}</AlertDescription></Alert>
        <fieldset disabled={busy} className="contents">
          <Segmented<ReportCategory> id="report-category" label={t("support.categoryLabel")} value={model.category}
            options={CATEGORIES.map((c) => ({ value: c, label: t(`support.category.${c}`) }))} onChange={model.setCategory} />
        </fieldset>
        <Field id="report-subject" label={t("support.subject")}>
          <Input id="report-subject" maxLength={120} required value={model.subject} onChange={(e) => model.setSubject(e.target.value)} disabled={busy} dir="auto" />
        </Field>
        <Field id="report-body" label={t("support.body")} hint={t("support.bodyHint")}>
          <Textarea id="report-body" rows={6} maxLength={4000} required value={model.body} onChange={(e) => model.setBody(e.target.value)} disabled={busy} dir="auto" />
        </Field>
        <ImagePicker images={model.images} onChange={model.setImages} disabled={busy} />
        {model.error && <p className="text-sm text-destructive">{model.error}</p>}
        <div className="flex flex-wrap items-center justify-end gap-2.5">
          <Button type="button" variant="ghost" onClick={model.cancel} disabled={busy}>{t("common.cancel")}</Button>
          <Button type="submit" className="h-10 min-w-24" disabled={busy || !model.ready}>{busy ? t("support.sending") : t("support.send")}</Button>
        </div>
      </form>
    </div>
  )
}
