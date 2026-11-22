import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { openReport, replyToReport, type ReportDetail } from "@/platform/support"
import { describeError } from "@/utils/errors"

/** One report and its conversation; a reply replaces it with the server's fresh copy. */
export function useReportScreen(id: string) {
  const { t } = useTranslation()
  const [report, setReport] = useState<ReportDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    openReport(id).then((opened) => live && setReport(opened)).catch((e) => live && setError(describeError(e)))
    return () => {
      live = false
    }
  }, [id])

  async function send(body: string, images: string[]) {
    try {
      setReport(await replyToReport(id, body, images))
      setError(null)
      return true
    } catch (e) {
      setError(describeError(e))
      return false
    }
  }

  return {
    report, error, send,
    loading: !report && !error,
    category: report ? t(`support.category.${report.category}`) : "",
    replyHint: report?.status === "RESOLVED" ? t("support.reopenHint") : undefined,
  }
}

export type ReportScreenModel = ReturnType<typeof useReportScreen>
