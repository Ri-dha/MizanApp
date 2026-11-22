import { lazy } from "react"

import { styleViews } from "@/app/style"
import { useReportPage, type ReportPageModel } from "./useReportPage"

const ReportView = styleViews<{ model: ReportPageModel }>({
  soft: lazy(() => import("./views/ReportSoft")),
})

export function ReportPage() {
  return <ReportView model={useReportPage()} />
}
