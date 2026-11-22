import { lazy } from "react"

import { styleViews } from "@/app/style"
import { TransferSheet } from "@/features/accounts/TransferSheet"
import { QuickAddSheet } from "./QuickAddSheet"
import { useTransactionsPage, type TransactionsPageModel } from "./useTransactionsPage"

const LedgerView = styleViews<{ model: TransactionsPageModel }>({
  soft: lazy(() => import("./views/LedgerSoft")),
})

export function TransactionsPage() {
  const model = useTransactionsPage()
  return (
    <>
      <LedgerView model={model} />
      <QuickAddSheet open={model.quickAdd.open} transaction={model.quickAdd.transaction} onClose={model.close} />
      <TransferSheet open={model.transfer.open} transfer={model.transfer.transfer} onClose={model.close} />
    </>
  )
}
