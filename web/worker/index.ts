/**
 * ADR deploy-cf-1: the website on a Cloudflare Worker. Static files come from the built assets
 * (with the same security headers Caddy sends, from dist/_headers); /api goes to the API at
 * API_ORIGIN, so the app keeps calling its own origin and the refresh cookie stays first-party.
 */
interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> }
  API_ORIGIN: string
}

/** Hop-by-hop and Cloudflare's own headers are not passed on; the API sees the caller's address in X-Forwarded-For. */
const DROPPED = ["host", "cf-connecting-ip", "cf-ray", "cf-visitor", "cf-ipcountry", "x-forwarded-proto", "x-real-ip"]

async function toApi(request: Request, origin: string): Promise<Response> {
  const incoming = new URL(request.url)
  const target = new URL(incoming.pathname + incoming.search, origin)
  const headers = new Headers(request.headers)
  for (const name of DROPPED) headers.delete(name)
  const caller = request.headers.get("cf-connecting-ip")
  if (caller) headers.set("x-forwarded-for", caller)
  return fetch(target, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    redirect: "manual",
  })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url)
    if (pathname.startsWith("/api/")) {
      if (!env.API_ORIGIN) return new Response("The API is not configured", { status: 503 })
      return toApi(request, env.API_ORIGIN)
    }
    return env.ASSETS.fetch(request)
  },
}
