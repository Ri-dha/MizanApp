import { lazy } from "react"

import { styleViews } from "@/app/style"
import { useResetPasswordPage, type ResetPasswordPageModel } from "./useResetPasswordPage"

const View = styleViews<{ model: ResetPasswordPageModel }>({ soft: lazy(() => import("./views/ResetPasswordSoft")) })

export function ResetPasswordPage() {
  return <View model={useResetPasswordPage()} />
}
