import { router, useFocusEffect } from "expo-router"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"

import { myReports, type ReportSummary } from "@/platform/support"
import { describeError } from "@/utils/errors"
import { useWhen } from "./thread"

/** The person's reports, newest activity first; a reply from the team marks its report until it is opened. */
export function useSupportScreen() {
  const { t } = useTranslation()
  const when = useWhen()
  const [reports, setReports] = useState<ReportSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      setReports(await myReports())
      setError(null)
    } catch (e) {
      setError(describeError(e))
    }
  }, [])

  useFocusEffect(useCallback(() => void load(), [load]))

  async function refresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  return {
    error, refreshing,
    refresh: () => void refresh(),
    loading: !reports && !error,
    empty: reports?.length === 0,
    create: () => router.push("/support-new"),
    reports: (reports ?? []).map((report) => ({
      id: report.id,
      href: { pathname: "/support-report" as const, params: { id: report.id } },
      subject: report.subject,
      status: report.status,
      unread: report.unread,
      detail: `${t(`support.category.${report.category}`)} · ${when(report.lastMessageAt)}`,
    })),
  }
}

export type SupportScreenModel = ReturnType<typeof useSupportScreen>
