import { lazy } from "react"

import { styleViews } from "@/app/style"
import { AccountSheet } from "./AccountSheet"
import { TransferSheet } from "./TransferSheet"
import { useAccountsPage, type AccountsPageModel } from "./useAccountsPage"

const AccountsView = styleViews<{ model: AccountsPageModel }>({
  soft: lazy(() => import("./views/AccountsSoft")),
})

export function AccountsPage() {
  const model = useAccountsPage()
  return (
    <>
      <AccountsView model={model} />
      <TransferSheet open={model.transferring} transfer={null} onClose={() => model.setTransferring(false)} />
      <AccountSheet open={model.editing !== null} account={model.editing === "new" ? null : model.editing} onClose={() => model.setEditing(null)} onDelete={model.remove} />
    </>
  )
}
