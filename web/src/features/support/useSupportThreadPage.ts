import { useEffect, useState } from "react"
import { useParams } from "react-router"

import { openReport, replyToReport, type ReportDetail } from "@/api/support"
import { describeError } from "@/app/errors"

export function useSupportThreadPage() {
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

  return { report, error, send, loading: !report && !error }
}

export type SupportThreadPageModel = ReturnType<typeof useSupportThreadPage>
