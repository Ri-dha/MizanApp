import { useLiveQuery } from "dexie-react-hooks"

import { useSession } from "@/api/auth"
import { EMPTY_NET_WORTH, metalsValueOf, netWorthFiguresFor, rateSetOf, type NetWorthView } from "@mizan/core/db/netWorthView"
import { useMetals } from "@/features/metals/useMetals"

export type { NetWorthView } from "@mizan/core/db/netWorthView"

export function useNetWorth(): NetWorthView {
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const metals = useMetals()
  const metalsValue = metalsValueOf(metals)
  const live = useLiveQuery(() => netWorthFiguresFor(base, metals.prices, metalsValue), [base, metals.prices, metalsValue], EMPTY_NET_WORTH)
  return { ...live, rateSet: rateSetOf(metals.prices) }
}
