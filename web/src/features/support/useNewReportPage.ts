import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router"

import { sendReport, type ReportCategory } from "@/api/support"
import { describeError } from "@/app/errors"

export const CATEGORIES: ReportCategory[] = ["PROBLEM", "SUGGESTION", "QUESTION"]

export function useNewReportPage() {
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

  return {
    category, setCategory, subject, setSubject, body, setBody, images, setImages, busy, error, submit,
    ready: Boolean(subject.trim() && body.trim()),
    cancel: () => void navigate(-1),
  }
}

export type NewReportPageModel = ReturnType<typeof useNewReportPage>
