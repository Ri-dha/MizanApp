import { router } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { REPORT_CATEGORIES, sendReport, type ReportCategory } from "@/platform/support"
import { describeError } from "@/utils/errors"

/** A new report: what kind, a subject, the story and up to four pictures; sending opens its thread. */
export function useNewScreen() {
  const { t } = useTranslation()
  const [category, setCategory] = useState<ReportCategory>("PROBLEM")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function send() {
    setBusy(true)
    setError(null)
    try {
      const report = await sendReport({ category, subject: subject.trim(), body: body.trim() }, images)
      router.replace({ pathname: "/support-report", params: { id: report.id } })
    } catch (e) {
      setError(describeError(e))
      setBusy(false)
    }
  }

  return {
    busy, error, subject, setSubject, body, setBody, images, setImages, category,
    categories: REPORT_CATEGORIES.map((c) => ({ value: c, label: t(`support.category.${c}`) })),
    setCategory: (value: string | null) => { if (value) setCategory(value as ReportCategory) },
    canSend: !!subject.trim() && !!body.trim(),
    send: () => void send(),
  }
}

export type NewScreenModel = ReturnType<typeof useNewScreen>
