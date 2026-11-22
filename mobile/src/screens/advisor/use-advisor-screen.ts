import { useState } from "react"
import { useTranslation } from "react-i18next"

import { rowsBy } from "@mizan/core/store/store"
import { useLiveQuery, useSession } from "@/hooks/use-core"
import { formatMoney } from "@/utils/money"
import { formatMonthKey } from "@/utils/month"

async function reportFor(year: number) {
  const [row] = await rowsBy("annualReports", "year", year, (r) => r.deletedAt === null)
  return row?.report ?? null
}

/** §4.2 P4: what an advisor sees, built by members' devices from shared records; never a transaction. */
export function useAdvisorScreen() {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const [year, setYear] = useState(new Date().getFullYear())
  const report = useLiveQuery(() => reportFor(year), [year], null)
  const money = (v: number) => formatMoney(v, report?.baseCurrency ?? "IQD", i18n.language)
  const rate = (v: number | null | undefined) => (v == null ? "—" : `${v}%`)

  return {
    household: session?.householdName ?? "",
    year,
    previous: () => setYear(year - 1),
    next: () => setYear(year + 1),
    report: report
      ? {
          received: money(report.received ?? 0),
          spent: money(report.spent ?? 0),
          rate: rate(report.savingRate),
          months: (report.months ?? []).map((m) => {
            const snapshot = (report.snapshots ?? []).find((s) => s.monthKey === m.monthKey)
            return {
              key: m.monthKey,
              label: formatMonthKey(m.monthKey ?? "", i18n.language),
              saved: money(m.saved ?? 0),
              negative: (m.saved ?? 0) < 0,
              detail: `${t("income.received")} ${money(m.received ?? 0)} · ${t("plan.spent")} ${money(m.spent ?? 0)} · ${rate(m.savingRate)} · ${t("networth.title")} ${snapshot ? money(snapshot.netWorth ?? 0) : "—"}`,
            }
          }),
        }
      : null,
  }
}

export type AdvisorScreenModel = ReturnType<typeof useAdvisorScreen>
