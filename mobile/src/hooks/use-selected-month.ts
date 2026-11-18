import { useSyncExternalStore } from "react"

import { currentMonthKey } from "./use-views"

let selected: string | null = null
const listeners = new Set<() => void>()

/** The month the ledger and plan look at, shared between them as on the web; defaults to today's household month. */
export function useSelectedMonth(startDay: number): [string, (key: string) => void] {
  const key = useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => selected ?? currentMonthKey(startDay),
  )
  return [key, (next) => {
    selected = next
    listeners.forEach((listener) => listener())
  }]
}
