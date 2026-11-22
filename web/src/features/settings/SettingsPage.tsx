import { lazy } from "react"

import { styleViews } from "@/app/style"
import { SettingsDialogs } from "./SettingsDialogs"
import { useSettingsPage, type SettingsPageModel } from "./useSettingsPage"

const SettingsView = styleViews<{ model: SettingsPageModel }>({ soft: lazy(() => import("./views/SettingsSoft")) })

export function SettingsPage() {
  const { model, fileInput, csvInput } = useSettingsPage()
  return (
    <>
      <SettingsView model={model} />
      <SettingsDialogs model={model} fileInput={fileInput} csvInput={csvInput} />
    </>
  )
}
