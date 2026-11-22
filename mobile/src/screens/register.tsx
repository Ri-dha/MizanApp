import { viewFor } from "@mizan/core/domain/appStyle"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useRegisterScreen } from "./use-register-screen"
import { RegisterSoft } from "./views/register-soft"

/** ADR styles-1: each template draws the screen its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: RegisterSoft }

export function Register() {
  const model = useRegisterScreen()
  const View = viewFor(VIEWS, useAppStyle())
  return <Screen><View model={model} /></Screen>
}
