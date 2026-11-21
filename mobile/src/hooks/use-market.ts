import { useEffect, useState } from "react"

import { cachedWorldHistory, cachedWorldRates, refreshWorldHistory, refreshWorldRates, type WorldPoint, type WorldRates } from "@mizan/core/market/world"
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

/** The copy on this phone first, so the converter works offline, then the server's (T-world-rates). */
export function useWorldRates(): WorldRates | undefined {
  const [rates, setRates] = useState<WorldRates>()
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const cached = await cachedWorldRates()
      if (!cancelled && cached) setRates(cached)
      try {
        const fresh = await refreshWorldRates()
        if (!cancelled) setRates(fresh)
      } catch {
        // the cached copy stays
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])
  return rates
}

/** A year of daily rates per dollar for one currency, from this phone's copy first. */
export function useWorldHistory(currency: string): { points: WorldPoint[]; loading: boolean } {
  const [state, setState] = useState<{ points: WorldPoint[]; loading: boolean }>({ points: [], loading: true })
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const cached = await cachedWorldHistory(currency)
      if (!cancelled) setState({ points: cached ?? [], loading: true })
      try {
        const fresh = await refreshWorldHistory(currency)
        if (!cancelled) setState({ points: fresh, loading: false })
      } catch {
        if (!cancelled) setState((s) => ({ ...s, loading: false }))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [currency])
  return state
}
