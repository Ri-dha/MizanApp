import { lazy } from "react"

import { styleViews } from "@/app/style"
import { useQuickAdd, type QuickAddModel, type QuickAddProps } from "./useQuickAdd"

const QuickAddView = styleViews<{ model: QuickAddModel }>({
  soft: lazy(() => import("./views/QuickAddSoft")),
})

export function QuickAddSheet(props: QuickAddProps) {
  return <QuickAddView model={useQuickAdd(props)} />
}
