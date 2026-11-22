import { lazy } from "react"

import { styleViews } from "@/app/style"
import { useSupportPage, type SupportPageModel } from "./useSupportPage"

const View = styleViews<{ model: SupportPageModel }>({ soft: lazy(() => import("./views/SupportSoft")) })

export function SupportPage() {
  return <View model={useSupportPage()} />
}
