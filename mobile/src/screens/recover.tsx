import { viewFor } from "@mizan/core/domain/appStyle"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useRecoverScreen, useStartOver } from "./use-recover-screen"
import { RecoverSoft, StartOverSoft } from "./views/recover-soft"

/** ADR styles-1: each template draws the screen its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: RecoverSoft }
const START_OVER_VIEWS = { soft: StartOverSoft }

export function Recover() {
  const model = useRecoverScreen()
  const View = viewFor(VIEWS, useAppStyle())
  if (model.startingOver) return <StartOver onBack={model.back} />
  return <Screen centered><View model={model} /></Screen>
}

function StartOver({ onBack }: { onBack: () => void }) {
  const model = useStartOver()
  const View = viewFor(START_OVER_VIEWS, useAppStyle())
  return <Screen centered><View model={model} onBack={onBack} /></Screen>
}
