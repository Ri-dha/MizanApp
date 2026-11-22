import { lazy } from "react"

import { styleViews } from "@/app/style"
import { usePricesPage, type PricesPageModel } from "./usePricesPage"

const PricesView = styleViews<{ model: PricesPageModel }>({
  soft: lazy(() => import("./views/PricesSoft")),
})

export function PricesPage() {
  return <PricesView model={usePricesPage()} />
}
