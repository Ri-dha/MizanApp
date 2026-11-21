import { liveCashAccounts } from "@mizan/core/db/cashAccounts"
import { EMPTY_METALS_VIEW, metalsViewFor, type MetalsView } from "@mizan/core/db/metalsView"
import { EMPTY_MONTH_VIEW, monthViewFor, type MonthView } from "@mizan/core/db/monthView"
import { EMPTY_NET_WORTH, metalsValueOf, netWorthFiguresFor, rateSetOf, type NetWorthView } from "@mizan/core/db/netWorthView"
import { monthKeyFor, todayIso } from "@mizan/core/domain/calendar/month"
import type { CashAccount } from "@mizan/core/schema"
import { useLiveQuery, useSession } from "./use-core"

const NO_ACCOUNTS: CashAccount[] = []

export const currentMonthKey = (startDay: number) => monthKeyFor(todayIso(), startDay)

export function useMonthView(monthKey: string, startDay: number): MonthView {
  return useLiveQuery(() => monthViewFor(monthKey, startDay), [monthKey, startDay], EMPTY_MONTH_VIEW)
}

/** Prices follow the household currency, so a currency change must reach the view (ADR currency-1). */
export function useMetals(): MetalsView {
  const base = useSession()?.baseCurrency
  return useLiveQuery(() => metalsViewFor(base), [base], EMPTY_METALS_VIEW)
}

export function useNetWorth(): NetWorthView & { metals: MetalsView } {
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const metals = useMetals()
  const metalsValue = metalsValueOf(metals)
  const figures = useLiveQuery(() => netWorthFiguresFor(base, metals.prices, metalsValue), [base, metals.prices, metalsValue], EMPTY_NET_WORTH)
  return { ...figures, rateSet: rateSetOf(metals.prices), metals }
}

export function useCashAccounts(): CashAccount[] {
  return useLiveQuery(liveCashAccounts, [], NO_ACCOUNTS)
}
