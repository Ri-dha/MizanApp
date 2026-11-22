import { useEffect, useState } from "react"

import { myReports, type ReportSummary } from "@/api/support"
import { describeError } from "@/app/errors"
import { useWhen } from "./useWhen"

export function useSupportPage() {
  const when = useWhen()
  const [reports, setReports] = useState<ReportSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    myReports().then(setReports).catch((e) => setError(describeError(e)))
  }, [])

  return { reports, error, when, loading: !reports && !error }
}

export type SupportPageModel = ReturnType<typeof useSupportPage>
