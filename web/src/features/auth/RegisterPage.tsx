import { lazy } from "react"

import { styleViews } from "@/app/style"
import { useRegisterPage, type RegisterPageModel } from "./useRegisterPage"

const View = styleViews<{ model: RegisterPageModel }>({ soft: lazy(() => import("./views/RegisterSoft")) })

export function RegisterPage() {
  return <View model={useRegisterPage()} />
}
