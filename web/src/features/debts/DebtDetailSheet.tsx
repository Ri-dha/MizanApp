import { lazy } from "react"

import { styleViews } from "@/app/style"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useDebtDetail, type DebtDetailModel, type DebtDetailProps } from "./useDebtDetail"

const DebtDetailView = styleViews<{ model: DebtDetailModel }>({
  soft: lazy(() => import("./views/DebtDetailSoft")),
})

export function DebtDetailSheet(props: DebtDetailProps) {
  const model = useDebtDetail(props)
  if (!model) return <Sheet open={false}><SheetContent /></Sheet>
  return (
    <Sheet open onOpenChange={(next) => !next && props.onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader><SheetTitle>{model.debt.name}</SheetTitle></SheetHeader>
        <DebtDetailView model={model} />
      </SheetContent>
    </Sheet>
  )
}
