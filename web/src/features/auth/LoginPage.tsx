import { lazy } from "react"

import { styleViews } from "@/app/style"
import { useLoginPage, type LoginPageModel } from "./useLoginPage"

const View = styleViews<{ model: LoginPageModel }>({ soft: lazy(() => import("./views/LoginSoft")) })

export function LoginPage() {
  return <View model={useLoginPage()} />
}
