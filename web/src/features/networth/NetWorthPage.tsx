import { lazy } from "react"

import { styleViews } from "@/app/style"
import { useNetWorthPage, type NetWorthPageModel } from "./useNetWorthPage"

const NetWorthView = styleViews<{ model: NetWorthPageModel }>({
  soft: lazy(() => import("./views/NetWorthSoft")),
})

export function NetWorthPage() {
  return <NetWorthView model={useNetWorthPage()} />
}
