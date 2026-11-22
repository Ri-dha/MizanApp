import { lazy } from "react"

import { styleViews } from "@/app/style"
import { useSupportThreadPage, type SupportThreadPageModel } from "./useSupportThreadPage"

const View = styleViews<{ model: SupportThreadPageModel }>({ soft: lazy(() => import("./views/SupportThreadSoft")) })

export function SupportThreadPage() {
  return <View model={useSupportThreadPage()} />
}
