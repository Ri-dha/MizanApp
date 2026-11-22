import { lazy } from "react"

import { styleViews } from "@/app/style"
import { useHelpPage, type HelpPageModel } from "./useHelpPage"

const HelpView = styleViews<{ model: HelpPageModel }>({ soft: lazy(() => import("./views/HelpSoft")) })

export function HelpPage() {
  return <HelpView model={useHelpPage()} />
}
