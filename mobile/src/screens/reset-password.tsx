import { viewFor } from "@mizan/core/domain/appStyle"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useResetPasswordScreen } from "./use-reset-password-screen"
import { ResetPasswordSoft } from "./views/reset-password-soft"

/** ADR styles-1: each template draws the screen its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: ResetPasswordSoft }

export function ResetPassword() {
  const model = useResetPasswordScreen()
  const View = viewFor(VIEWS, useAppStyle())
  return <Screen><View model={model} /></Screen>
}
