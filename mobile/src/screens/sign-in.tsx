import { viewFor } from "@mizan/core/domain/appStyle"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useSignInScreen } from "./use-sign-in-screen"
import { SignInSoft } from "./views/sign-in-soft"

/** ADR styles-1: each template draws the screen its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: SignInSoft }

export function SignIn() {
  const model = useSignInScreen()
  const View = viewFor(VIEWS, useAppStyle())
  return <Screen centered><View model={model} /></Screen>
}
