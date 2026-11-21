import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"

import { currentSession, loadSession } from "@/api/auth"
import { META_KEYS, readMeta, writeMeta } from "@mizan/core/db/meta"
import type { LocalSession } from "@mizan/core/session"
import { hasAccessToken, refreshAccessToken } from "./client"

const A = "11111111-1111-1111-1111-111111111111"
const B = "22222222-2222-2222-2222-222222222222"

const sessionOf = (userId: string) => ({ userId, contact: `${userId}@mizan.test` }) as LocalSession
const tokenFor = (sub: string) => `h.${btoa(JSON.stringify({ sub })).replace(/=+$/, "")}.s`
const reload = vi.fn()

function refreshAnswers(sub: string) {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ accessToken: tokenFor(sub) }), { status: 200 })))
}

describe("a refresh for another account than this tab's", () => {
  beforeAll(async () => {
    Object.defineProperty(window, "location", { value: { ...window.location, reload }, configurable: true })
    await writeMeta(META_KEYS.session, sessionOf(A))
    await loadSession()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    reload.mockClear()
  })

  it("keeps the token when it is this tab's account", async () => {
    refreshAnswers(A)
    expect(await refreshAccessToken()).toBe(true)
    expect(hasAccessToken()).toBe(true)
  })

  it("reloads into the account another tab signed in here, without wiping it", async () => {
    await writeMeta(META_KEYS.session, sessionOf(B))
    refreshAnswers(B)
    expect(await refreshAccessToken()).toBe(false)
    expect(hasAccessToken()).toBe(false)
    expect(reload).toHaveBeenCalledOnce()
    expect((await readMeta<LocalSession>(META_KEYS.session))?.userId).toBe(B)
  })

  it("signs this tab out when the cookie belongs to an account this browser does not hold", async () => {
    await writeMeta(META_KEYS.session, sessionOf(A))
    refreshAnswers(B)
    expect(await refreshAccessToken()).toBe(false)
    await vi.waitFor(() => expect(currentSession()).toBeNull())
    expect(reload).not.toHaveBeenCalled()
    expect(await readMeta(META_KEYS.session)).toBeUndefined()
  })
})
