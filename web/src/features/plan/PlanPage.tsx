import { lazy } from "react"

import { styleViews } from "@/app/style"
import { MoveMoneySheet } from "./MoveMoneySheet"
import { usePlanPage, type PlanPageModel } from "./usePlanPage"

const PlanView = styleViews<{ model: PlanPageModel }>({
  soft: lazy(() => import("./views/PlanSoft")),
  clear: lazy(() => import("./views/PlanClear")),
  mizan: lazy(() => import("./views/PlanMizan")),
})

export function PlanPage() {
  const model = usePlanPage()
  return (
    <>
      <PlanView model={model} />
      <MoveMoneySheet open={model.moving} buckets={model.view.buckets} figures={model.view.figures} monthKey={model.monthKey} startDay={model.startDay} currency={model.currency} onClose={() => model.setMoving(false)} />
    </>
  )
}
