import { useEffect, useState } from "react"

import { cachedSeries, EMPTY_SERIES, refreshSeries, type Range, type Series, type SeriesKey } from "@mizan/core/market/series"

export { RANGES, SERIES, SERIES_KEYS, type Change, type Point, type Range, type Series, type SeriesKey } from "@mizan/core/market/series"

/** Served from the copy on this device first, so the screen works offline, then refreshed. */
export function usePriceSeries(key: SeriesKey, range: Range): Series & { loading: boolean } {
  const [state, setState] = useState<Series & { loading: boolean }>({ ...EMPTY_SERIES, loading: true })
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const cached = await cachedSeries(key, range)
      if (!cancelled) setState({ ...(cached ?? EMPTY_SERIES), loading: navigator.onLine })
      if (!navigator.onLine) return
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
