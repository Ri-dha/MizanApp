import { lazy } from "react"

import { styleViews } from "@/app/style"
import { LotSheet } from "./LotSheet"
import { MarketSettingsDialog } from "./MarketSettingsDialog"
import { OverrideSheet } from "./OverrideSheet"
import { PriceExplainer } from "./PriceExplainer"
import { SellSheet } from "./SellSheet"
import { ZakatDialog } from "./ZakatDialog"
import { useMetalsPage, type MetalsPageModel } from "./useMetalsPage"

const MetalsView = styleViews<{ model: MetalsPageModel }>({
  soft: lazy(() => import("./views/MetalsSoft")),
})

export function MetalsPage() {
  const model = useMetalsPage()
  const { view } = model
  return (
    <>
      <MetalsView model={model} />
      <LotSheet open={model.editing !== null} lot={model.editing === "new" ? null : model.editing} onClose={() => model.setEditing(null)} />
      <SellSheet metal={model.selling} view={view} onClose={() => model.setSelling(null)} />
      <OverrideSheet open={model.overriding} view={view} onClose={() => model.setOverriding(false)} />
      <ZakatDialog open={model.zakat} valued={view.valued} perGram24k={model.perGram24k} currency={model.base} onClose={() => model.setZakat(false)} />
      <MarketSettingsDialog open={model.settings} setting={view.setting} onClose={() => model.setSettings(false)} />
      <PriceExplainer open={model.explaining} view={view} onClose={() => model.setExplaining(false)} />
    </>
  )
}
