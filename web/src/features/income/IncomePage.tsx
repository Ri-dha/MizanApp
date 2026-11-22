import { lazy } from "react"

import { styleViews } from "@/app/style"
import { IncomeSourceSheet } from "./IncomeSourceSheet"
import { ReceiptSheet } from "./ReceiptSheet"
import { useIncomePage, type IncomePageModel } from "./useIncomePage"

const IncomeView = styleViews<{ model: IncomePageModel }>({
  soft: lazy(() => import("./views/IncomeSoft")),
})

export function IncomePage() {
  const model = useIncomePage()
  return (
    <>
      <IncomeView model={model} />
      <IncomeSourceSheet open={model.editingSource !== null} source={model.editingSource === "new" ? null : model.editingSource} history={model.amountHistory} onClose={model.closeSource} />
      <ReceiptSheet draft={model.receipt} onClose={model.closeReceipt} />
    </>
  )
}
