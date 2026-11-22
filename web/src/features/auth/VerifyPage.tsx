import { lazy } from "react"

import { styleViews } from "@/app/style"
import { useVerifyPage, type VerifyPageModel } from "./useVerifyPage"

const View = styleViews<{ model: VerifyPageModel }>({ soft: lazy(() => import("./views/VerifySoft")) })

export function VerifyPage() {
  return <View model={useVerifyPage()} />
}
