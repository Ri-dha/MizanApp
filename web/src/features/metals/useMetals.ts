import { useLiveQuery } from "dexie-react-hooks"

import { useSession } from "@/api/auth"
import { EMPTY_METALS_VIEW, metalsViewFor, type MetalsView } from "@mizan/core/db/metalsView"

export * from "@mizan/core/db/metalsView"

export function useMetals(): MetalsView {
  const base = useSession()?.baseCurrency
  return useLiveQuery(() => metalsViewFor(base), [base], EMPTY_METALS_VIEW)
}
