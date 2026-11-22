import { viewFor } from "@mizan/core/domain/appStyle"
import { useAppStyle } from "@/theme"
import { useSyncScreen } from "./use-sync-screen"
import { SyncSoft } from "./views/sync-soft"

/** ADR styles-1: each template draws the screen its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: SyncSoft }

export function Sync() {
  const model = useSyncScreen()
  const View = viewFor(VIEWS, useAppStyle())
  return <View model={model} />
}
