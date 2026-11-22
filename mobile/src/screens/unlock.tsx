import { viewFor } from "@mizan/core/domain/appStyle"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useUnlockScreen } from "./use-unlock-screen"
import { UnlockSoft } from "./views/unlock-soft"

/** ADR styles-1: each template draws the screen its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: UnlockSoft }

export function Unlock() {
  const model = useUnlockScreen()
  const View = viewFor(VIEWS, useAppStyle())
  return <Screen centered><View model={model} /></Screen>
}
