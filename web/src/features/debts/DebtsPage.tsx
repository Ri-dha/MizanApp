import { lazy } from "react"

import { styleViews } from "@/app/style"
import { DebtDetailSheet } from "./DebtDetailSheet"
import { DebtSheet } from "./DebtSheet"
import { useDebtsPage, type DebtsPageModel } from "./useDebtsPage"

const DebtsView = styleViews<{ model: DebtsPageModel }>({
  soft: lazy(() => import("./views/DebtsSoft")),
})

export function DebtsPage() {
  const model = useDebtsPage()
  return (
    <>
      <DebtsView model={model} />
      <DebtSheet open={model.editing !== null} debt={model.editing === "new" ? null : model.editing} onClose={() => model.setEditing(null)} />
      <DebtDetailSheet debt={model.detail} payments={model.payments} startDay={model.startDay} onClose={() => model.setDetail(null)} onEdit={(d) => { model.setDetail(null); model.setEditing(d) }} />
    </>
  )
}
