import { api, unwrap } from "@/api/client"
import { writeMeta } from "@mizan/core/db/meta"
import { QUOTES_KEY } from "@mizan/core/market/prices"

export * from "@mizan/core/market/prices"
export { META_KEYS } from "@mizan/core/db/meta"

/** Pulled with every sync; served from the local copy so valuation works offline (FR-MKT-05). */
export async function refreshQuotes(): Promise<void> {
  const quotes = await unwrap(api.GET("/api/v1/market/quotes"))
  await writeMeta(QUOTES_KEY, quotes)
}

/** The user asked for prices now: the server re-fetches from its feeds (within its cooldown) and answers with the result. */
export async function fetchLiveQuotes(): Promise<void> {
  const quotes = await unwrap(api.POST("/api/v1/market/refresh"))
  await writeMeta(QUOTES_KEY, quotes)
}
