import * as SecureStore from "expo-secure-store"
import createClient from "openapi-fetch"

import { installApi } from "@mizan/core/api/client"
import type { paths } from "@mizan/core/api/generated"
import { sessionLost } from "@mizan/core/auth/session"

/** The Mac's API in development: the iOS simulator shares localhost, Android gets it through adb reverse. */
export const API_ORIGIN = process.env.EXPO_PUBLIC_API_ORIGIN ?? "http://localhost:8080"

const REFRESH_PATH = "/api/v1/auth/refresh"
const REFRESH_TOKEN = "mizan.refreshToken"
const ACCESS = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }
const UNAUTHORIZED = 401
const AUTH_PATHS_WITHOUT_TOKEN = new Set([
  "/api/v1/auth/register", "/api/v1/auth/login", REFRESH_PATH, "/api/v1/auth/logout", "/api/v1/auth/password-reset/request", "/api/v1/auth/password-reset/confirm",
])

let accessToken: string | null = null
let refreshInFlight: Promise<boolean> | null = null

export async function keepTokens(access: string, refresh: string | null | undefined) {
  accessToken = access
  if (refresh) await SecureStore.setItemAsync(REFRESH_TOKEN, refresh, ACCESS)
}

export async function forgetTokens() {
  accessToken = null
  await SecureStore.deleteItemAsync(REFRESH_TOKEN, ACCESS)
}

/**
 * Phones have no cookie jar the server can rely on, so the rotating refresh token lives in the
 * Keychain or Keystore and goes in the body. One refresh at a time: a second would present a
 * token the first already rotated away and lose the session.
 */
async function refreshAccessToken(): Promise<boolean> {
  refreshInFlight ??= (async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN, ACCESS)
      if (!refreshToken) return false
      const response = await fetch(`${API_ORIGIN}${REFRESH_PATH}`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ refreshToken }),
      })
      if (!response.ok) {
        accessToken = null
        if (response.status === UNAUTHORIZED) {
          await SecureStore.deleteItemAsync(REFRESH_TOKEN, ACCESS)
          sessionLost()
        }
        return false
      }
      const body = (await response.json()) as { accessToken: string; refreshToken: string }
      await keepTokens(body.accessToken, body.refreshToken)
      return true
    } catch {
      return false
    } finally {
      refreshInFlight = null
    }
  })()
  return refreshInFlight
}

const withToken = (request: Request) => {
  const authorised = request.clone()
  if (accessToken) authorised.headers.set("Authorization", `Bearer ${accessToken}`)
  return authorised
}

/**
 * openapi-fetch middleware must hand back its own Response class, which React Native's fetch
 * does not produce, so the token and the one retry after a refresh live in the fetch itself.
 */
async function authorisedFetch(request: Request): Promise<Response> {
  const path = new URL(request.url).pathname
  if (AUTH_PATHS_WITHOUT_TOKEN.has(path)) return fetch(request)
  if (!accessToken) await refreshAccessToken()
  const response = await fetch(withToken(request))
  if (response.status !== UNAUTHORIZED || !(await refreshAccessToken())) return response
  return fetch(withToken(request))
}

export function installApiClient() {
  installApi(createClient<paths>({ baseUrl: API_ORIGIN, fetch: authorisedFetch }))
}
