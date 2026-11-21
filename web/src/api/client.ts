import createClient, { type Middleware } from "openapi-fetch"

import type { paths } from "@mizan/core/api/generated"
import { installApi } from "@mizan/core/api/client"

export { ApiError, NETWORK_ERROR, unwrap } from "@mizan/core/api/client"

const REFRESH_PATH = "/api/v1/auth/refresh"
const AUTH_PATHS_WITHOUT_TOKEN = new Set([
  "/api/v1/auth/register",
  "/api/v1/auth/login",
  REFRESH_PATH,
  "/api/v1/auth/logout",
  "/api/v1/auth/password-reset/request",
  "/api/v1/auth/password-reset/confirm",
  "/api/v1/market/currencies",
])

let accessToken: string | null = null
let refreshInFlight: Promise<boolean> | null = null
let onSessionLost: () => void = () => {}

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function hasAccessToken() {
  return accessToken !== null
}

export function setSessionLostHandler(handler: () => void) {
  onSessionLost = handler
}


/**
 * Refreshes through the httpOnly cookie. Only one refresh runs at a time; concurrent 401s
 * wait for it rather than each rotating the token and tripping reuse detection.
 */
export async function refreshAccessToken(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch(REFRESH_PATH, { method: "POST", credentials: "include" })
        if (!response.ok) {
          accessToken = null
          if (response.status === 401) onSessionLost()
          return false
        }
        const body = (await response.json()) as { accessToken: string }
        accessToken = body.accessToken
        return true
      } catch {
        return false
      } finally {
        refreshInFlight = null
      }
    })()
  }
  return refreshInFlight
}

const bearer: Middleware = {
  async onRequest({ request, schemaPath }) {
    if (AUTH_PATHS_WITHOUT_TOKEN.has(schemaPath)) return request
    if (!accessToken && !(await refreshAccessToken())) return request
    request.headers.set("Authorization", `Bearer ${accessToken}`)
    return request
  },
  async onResponse({ request, response, schemaPath }) {
    if (response.status !== 401 || AUTH_PATHS_WITHOUT_TOKEN.has(schemaPath)) return response
    if (!(await refreshAccessToken())) return response
    const retry = request.clone()
    retry.headers.set("Authorization", `Bearer ${accessToken}`)
    return fetch(retry)
  },
}

export const api = createClient<paths>({ baseUrl: "/", credentials: "include" })
api.use(bearer)
installApi(api)
