import { lazy } from "react"

import { styleViews } from "@/app/style"
import { DeleteHouseholdDialog } from "./DeleteHouseholdDialog"
import { useHouseholdPage, type HouseholdPageModel } from "./useHouseholdPage"

const HouseholdView = styleViews<{ model: HouseholdPageModel }>({ soft: lazy(() => import("./views/HouseholdSoft")) })

export function HouseholdPage() {
  const model = useHouseholdPage()
  return (
    <>
      <HouseholdView model={model} />
      <DeleteHouseholdDialog model={model} />
    </>
  )
}
