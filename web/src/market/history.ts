import { useEffect, useState } from "react"

import { cachedHistory, refreshHistory, type History, type HistoryInstrument } from "@mizan/core/market/series"

export type { History, HistoryInstrument } from "@mizan/core/market/series"

/** Daily closes for charts (FR-MTL-08): served from the local copy, refreshed when online. */
export function useHistory(instruments: HistoryInstrument[]): History {
  const [history, setHistory] = useState<History>({})
  const key = instruments.join(",")
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const cached = await cachedHistory()
      if (!cancelled) setHistory(cached)
      if (!navigator.onLine) return
      const fresh = await refreshHistory(key.split(",") as HistoryInstrument[])
      if (!cancelled) setHistory(fresh)
    })()
    return () => { cancelled = true }
  }, [key])
  return history
}
