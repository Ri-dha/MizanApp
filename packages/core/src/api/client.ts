import type { Client } from "openapi-fetch"

import type { paths } from "./generated"

/** The typed API client; each app builds its own (cookies on the web, a stored refresh token on phones). */
export type ApiClient = Client<paths>

let current: ApiClient | null = null

export function installApi(client: ApiClient) {
  current = client
}

export function api(): ApiClient {
  if (!current) throw new Error("API_NOT_SET")
  return current
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly detail: string
  readonly properties: Record<string, unknown>

  constructor(status: number, code: string, detail: string, properties: Record<string, unknown> = {}) {
    super(detail)
    this.status = status
    this.code = code
    this.detail = detail
    this.properties = properties
  }
}

export const NETWORK_ERROR = new ApiError(0, "NETWORK", "Cannot reach the server")

/** Turns openapi-fetch's `{ data, error }` into a value or a typed ApiError. */
export async function unwrap<T>(call: Promise<{ data?: T; error?: unknown; response: Response }>): Promise<T> {
  let result: { data?: T; error?: unknown; response: Response }
  try {
    result = await call
  } catch (cause) {
    throw new ApiError(NETWORK_ERROR.status, NETWORK_ERROR.code, NETWORK_ERROR.detail, { cause: cause instanceof Error ? cause.message : String(cause) })
  }
  if (result.error !== undefined || !result.response.ok) {
    const problem = (result.error ?? {}) as { code?: string; detail?: string; status?: number } & Record<string, unknown>
    throw new ApiError(result.response.status, problem.code ?? "UNKNOWN", problem.detail ?? result.response.statusText, problem)
  }
  return result.data as T
}
