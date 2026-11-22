import { lazy } from "react"

import { styleViews } from "@/app/style"
import { useWorldRatesModel, type WorldRatesModel } from "./useWorldRates"

const WorldRatesView = styleViews<{ model: WorldRatesModel }>({
  soft: lazy(() => import("./views/WorldRatesSoft")),
})

export function WorldRatesCard() {
  return <WorldRatesView model={useWorldRatesModel()} />
}
