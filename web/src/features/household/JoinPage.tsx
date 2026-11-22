import { lazy } from "react"

import { styleViews } from "@/app/style"
import { useJoinPage, type JoinPageModel } from "./useJoinPage"

const JoinView = styleViews<{ model: JoinPageModel }>({ soft: lazy(() => import("./views/JoinSoft")) })

export function JoinPage() {
  return <JoinView model={useJoinPage()} />
}
