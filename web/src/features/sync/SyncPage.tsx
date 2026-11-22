import { lazy } from "react"

import { styleViews } from "@/app/style"
import { useSyncPage, type SyncPageModel } from "./useSyncPage"

const SyncView = styleViews<{ model: SyncPageModel }>({ soft: lazy(() => import("./views/SyncSoft")) })

export function SyncPage() {
  return <SyncView model={useSyncPage()} />
}
