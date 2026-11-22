import { lazy } from "react"

import { styleViews } from "@/app/style"
import { PayBillDialog } from "./PayBillDialog"
import { RecurringExpenseSheet } from "./RecurringExpenseSheet"
import { useBillsPage, type BillsPageModel } from "./useBillsPage"

const BillsView = styleViews<{ model: BillsPageModel }>({
  soft: lazy(() => import("./views/BillsSoft")),
})

export function BillsPage() {
  const model = useBillsPage()
  return (
    <>
      <BillsView model={model} />
      <RecurringExpenseSheet open={model.editing !== null} expense={model.editing === "new" ? null : model.editing} buckets={model.buckets} onClose={model.closeEditor} />
      <PayBillDialog model={model} />
    </>
  )
}
