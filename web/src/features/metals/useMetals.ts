import { useLiveQuery } from "dexie-react-hooks"

import { EMPTY_METALS_VIEW, metalsViewFor, type MetalsView } from "@mizan/core/db/metalsView"

export * from "@mizan/core/db/metalsView"

export function useMetals(): MetalsView {
  return useLiveQuery(metalsViewFor, [], EMPTY_METALS_VIEW)
}
