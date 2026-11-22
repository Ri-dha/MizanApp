import { lazy } from "react"

import { styleViews } from "@/app/style"
import { useMorePage, type MorePageModel } from "./useMorePage"

const MoreView = styleViews<{ model: MorePageModel }>({ soft: lazy(() => import("./views/MoreSoft")) })

export function MorePage() {
  return <MoreView model={useMorePage()} />
}
