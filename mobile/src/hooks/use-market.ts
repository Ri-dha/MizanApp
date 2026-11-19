import { useEffect, useState } from "react"

import { cachedHistory, cachedSeries, EMPTY_SERIES, refreshHistory, refreshSeries, type History, type HistoryInstrument, type Range, type Series, type SeriesKey } from "@mizan/core/market/series"

/** Served from this phone's copy first so the screen works offline, then refreshed. */
export function usePriceSeries(key: SeriesKey, range: Range): Series & { loading: boolean } {
  const [state, setState] = useState<Series & { loading: boolean }>({ ...EMPTY_SERIES, loading: true })
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const cached = await cachedSeries(key, range)
      if (!cancelled) setState({ ...(cached ?? EMPTY_SERIES), loading: true })
      try {
        const fresh = await refreshSeries(key, range)
        if (!cancelled) setState({ ...fresh, loading: false })
      } catch {
        if (!cancelled) setState((s) => ({ ...s, loading: false }))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [key, range])
  return state
}

/** Daily closes for charts (FR-MTL-08): the local copy first, refreshed when the server answers. */
export function useHistory(instruments: HistoryInstrument[]): History {
  const [history, setHistory] = useState<History>({})
  const key = instruments.join(",")
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const cached = await cachedHistory()
      if (!cancelled) setHistory(cached)
      const fresh = await refreshHistory(key.split(",") as HistoryInstrument[])
      if (!cancelled) setHistory(fresh)
    })()
    return () => {
      cancelled = true
    }
  }, [key])
  return history
}
