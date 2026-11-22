import { viewFor } from "@mizan/core/domain/appStyle"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useVerifyScreen } from "./use-verify-screen"
import { VerifySoft } from "./views/verify-soft"

/** ADR styles-1: each template draws the screen its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: VerifySoft }

export function Verify() {
  const model = useVerifyScreen()
  const View = viewFor(VIEWS, useAppStyle())
  return <Screen><View model={model} /></Screen>
}
