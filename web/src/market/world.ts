import { useEffect, useState } from "react"

import { cachedWorldHistory, cachedWorldRates, refreshWorldHistory, refreshWorldRates, type WorldPoint, type WorldRates } from "@mizan/core/market/world"

export * from "@mizan/core/market/world"

/** The copy on this device first, so the converter works offline, then the server's. */
export function useWorldRates(): WorldRates | undefined {
  const [rates, setRates] = useState<WorldRates>()
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const cached = await cachedWorldRates()
      if (!cancelled && cached) setRates(cached)
      if (!navigator.onLine) return
      try {
        const fresh = await refreshWorldRates()
        if (!cancelled) setRates(fresh)
      } catch {
        // keep the cached copy
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])
  return rates
}

export function useWorldHistory(currency: string): { points: WorldPoint[]; loading: boolean } {
  const [state, setState] = useState<{ points: WorldPoint[]; loading: boolean }>({ points: [], loading: true })
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const cached = await cachedWorldHistory(currency)
      if (!cancelled) setState({ points: cached ?? [], loading: navigator.onLine })
      if (!navigator.onLine) return
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
