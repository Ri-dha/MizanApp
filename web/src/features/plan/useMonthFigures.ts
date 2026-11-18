import { useLiveQuery } from "dexie-react-hooks"
import { EMPTY_MONTH_VIEW, monthViewFor, type MonthView } from "@mizan/core/db/monthView"

export * from "@mizan/core/db/monthView"

export function useMonthView(monthKey: string, startDay: number): MonthView {
  return useLiveQuery(() => monthViewFor(monthKey, startDay), [monthKey, startDay], EMPTY_MONTH_VIEW)
}
