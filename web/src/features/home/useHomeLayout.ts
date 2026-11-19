import { useLiveQuery } from "dexie-react-hooks"

import { DEFAULT_LAYOUT, liveHomeLayout, type HomeWidget } from "@mizan/core/db/homeLayout"

export function useHomeLayout(): HomeWidget[] {
  return useLiveQuery(liveHomeLayout, [], DEFAULT_LAYOUT)
}
