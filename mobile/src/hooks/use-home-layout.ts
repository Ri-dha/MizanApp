import { DEFAULT_LAYOUT, liveHomeLayout, type HomeWidget } from "@mizan/core/db/homeLayout"
import { useLiveQuery } from "./use-core"

export function useHomeLayout(): HomeWidget[] {
  return useLiveQuery(liveHomeLayout, [], DEFAULT_LAYOUT)
}
