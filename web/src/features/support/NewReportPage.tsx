import { lazy } from "react"

import { styleViews } from "@/app/style"
import { useNewReportPage, type NewReportPageModel } from "./useNewReportPage"

const View = styleViews<{ model: NewReportPageModel }>({ soft: lazy(() => import("./views/NewReportSoft")) })

export function NewReportPage() {
  return <View model={useNewReportPage()} />
}
