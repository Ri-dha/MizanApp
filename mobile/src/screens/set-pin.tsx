import { viewFor } from "@mizan/core/domain/appStyle"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useSetPinScreen } from "./use-set-pin-screen"
import { SetPinSoft } from "./views/set-pin-soft"

/** ADR styles-1: each template draws the screen its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: SetPinSoft }

export function SetPin() {
  const model = useSetPinScreen()
  const View = viewFor(VIEWS, useAppStyle())
  return <Screen centered><View model={model} /></Screen>
}
