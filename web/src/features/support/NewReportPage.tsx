import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"

import { sendReport, type ReportCategory } from "@/api/support"
import { describeError } from "@/app/errors"
import { Field } from "@/components/Field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImagePicker } from "./ImagePicker"
import { Textarea } from "./Textarea"

const CATEGORIES: ReportCategory[] = ["PROBLEM", "SUGGESTION", "QUESTION"]

export function NewReportPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [category, setCategory] = useState<ReportCategory>("PROBLEM")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [images, setImages] = useState<Blob[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const report = await sendReport({ category, subject: subject.trim(), body: body.trim(), platform: "web" }, images)
      navigate(`/support/${report.id}`, { replace: true })
    } catch (e) {
      setError(describeError(e))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex max-w-2xl flex-col gap-4">
      <h1 className="text-3xl">{t("support.new")}</h1>
      <Alert><AlertDescription>{t("support.privacy")}</AlertDescription></Alert>
      <Field id="report-category" label={t("support.categoryLabel")}>
        <Select value={category} onValueChange={(v) => setCategory(v as ReportCategory)} disabled={busy}>
          <SelectTrigger id="report-category" className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{t(`support.category.${c}`)}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <Field id="report-subject" label={t("support.subject")}>
        <Input id="report-subject" maxLength={120} required value={subject} onChange={(e) => setSubject(e.target.value)} disabled={busy} dir="auto" />
      </Field>
      <Field id="report-body" label={t("support.body")} hint={t("support.bodyHint")}>
        <Textarea id="report-body" rows={6} maxLength={4000} required value={body} onChange={(e) => setBody(e.target.value)} disabled={busy} dir="auto" />
      </Field>
      <ImagePicker images={images} onChange={setImages} disabled={busy} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={busy || !subject.trim() || !body.trim()}>{busy ? t("support.sending") : t("support.send")}</Button>
        <Button type="button" variant="ghost" onClick={() => navigate(-1)} disabled={busy}>{t("common.cancel")}</Button>
      </div>
    </form>
  )
}
