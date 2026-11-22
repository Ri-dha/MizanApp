import { lazy } from "react"

import { styleViews } from "@/app/style"
import { useYearReportPage, type YearReportPageModel } from "./useYearReportPage"

const YearReportView = styleViews<{ model: YearReportPageModel }>({
  soft: lazy(() => import("./views/YearReportSoft")),
})

export function YearReportPage() {
  return <YearReportView model={useYearReportPage()} />
}
