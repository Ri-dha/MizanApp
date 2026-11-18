import { installApi, type ApiClient } from "../api/client"
import { writeFields } from "../db/write"
import { aesSecretStore, installSecretStore } from "../platform/secretStore"
import type { LedgerTransaction } from "../schema"
import type { LocalSession } from "../session"
import { memoryStore } from "../store/memoryStore"
import { installStore, rows, table } from "../store/store"
import { createAccountKeys, derivePasswordKeys } from "../vault/crypto"
import { holdsKey, setAccount } from "../vault/keyring"
import { sealFields } from "../vault/records"
import { startSyncEngine, syncNow, syncStatus } from "./engine"

type Op = { opId: string; table: string; rowId: string; fields: Record<string, unknown>; clocks: Record<string, string> }

const session: LocalSession = {
  userId: "user-1", householdId: "household-1", householdName: "Home", displayName: "Owner", contact: "owner@example.test", locale: "en",
  verified: true, role: "OWNER", baseCurrency: "IQD", monthStartDay: 1, deletionRequestedAt: null, householdDeletionRequestedAt: null,
}

/** Just enough of the server for one device: it accepts every op and serves one pulled record. */
function fakeServer(publicKey: string, pulled: unknown[]) {
  const pushed: Op[] = []
  const ok = (data: unknown) => Promise.resolve({ data, response: new Response(null, { status: 200 }) })
  const routes: Record<string, (init?: { body?: unknown; params?: { query?: { since?: number } } }) => unknown> = {
    "GET /api/v1/keys/me": () => ({ account: { publicKey }, grants: [] }),
    "GET /api/v1/keys/household/members": () => [],
    "POST /api/v1/sync/devices": () => ({ id: "device-1" }),
    "POST /api/v1/sync/push": (init) => {
      const ops = (init?.body as { ops: Op[] }).ops
      pushed.push(...ops)
      return { applied: ops.map((op) => op.opId), conflicts: [] }
    },
    "GET /api/v1/sync/pull": (init) => (init?.params?.query?.since ?? 0) === 0 ? { records: pulled, nextSeq: 1, hasMore: false } : { records: [], nextSeq: 1, hasMore: false },
    "GET /api/v1/vault/status": () => ({ migrated: true, legacyRows: 0 }),
    "PUT /api/v1/notifications/schedule": () => ({}),
  }
  const call = (method: string) => (path: string, init?: never) => {
    const route = routes[`${method} ${path}`]
    if (!route) throw new Error(`unexpected ${method} ${path}`)
    return ok(route(init))
  }
  const client = { GET: call("GET"), POST: call("POST"), PUT: call("PUT"), PATCH: call("PATCH"), DELETE: call("DELETE") } as unknown as ApiClient
  return { client, pushed }
}

describe("sync engine", () => {
  beforeAll(() => vi.useFakeTimers({ toFake: ["setInterval", "setTimeout"] }))
  afterAll(() => vi.useRealTimers())

  it("pushes only ciphertext, opens what it pulls, and leaves the outbox empty", async () => {
    installStore(memoryStore())
    const deviceKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"])
    installSecretStore(aesSecretStore(async () => deviceKey))
    const { wrapSecret } = await derivePasswordKeys(session.contact, "a long test passphrase")
    const { account } = await createAccountKeys(wrapSecret)
    await setAccount(account)

    const incoming = await sealFields("ledger_transaction", "from-other-device", "PRIVATE", {
      visibility: "PRIVATE", payee: "Bakery", amount: 1500, deletedAt: null,
    })
    const server = fakeServer(account.publicKey, [{
      table: "ledger_transaction", rowId: "from-other-device", ownerId: session.userId, fields: incoming,
      clocks: { visibility: "1700000000000:0000:aaaaaaaa", payee: "1700000000000:0000:aaaaaaaa", amount: "1700000000000:0000:aaaaaaaa", deletedAt: "1700000000000:0000:aaaaaaaa" },
      encrypted: true,
    }])
    installApi(server.client)
    await writeFields<LedgerTransaction>("ledger_transaction", "local-1", { visibility: "PRIVATE", payee: "شاي", amount: 2500 } as never)

    startSyncEngine({
      lifecycle: { isOnline: () => true, onOnline: () => {}, onOffline: () => {}, onForeground: () => {} },
      loadSession: async () => session, refreshProfile: async () => {}, vaultReady: () => true, onVaultReady: () => {},
      onKeysReplaced: async () => {}, deviceName: () => "Test", afterDuties: async () => {}, afterSync: async () => {},
    })
    await syncNow()

    expect(syncStatus()).toMatchObject({ phase: "idle", lastError: null })
    expect(holdsKey("HOUSEHOLD")).toBe(true)
    expect(server.pushed.map((op) => op.table)).toEqual(expect.arrayContaining(["ledger_transaction", "plan", "bucket"]))
    for (const op of server.pushed) {
      for (const [field, value] of Object.entries(op.fields)) {
        if (field === "visibility" || field === "deletedAt") continue
        expect(value, `${op.table}.${field}`).toMatch(/^e1\.[hur]\.\d+\./)
      }
    }
    const pulled = await table("transactions").get("from-other-device")
    expect(pulled).toMatchObject({ payee: "Bakery", amount: 1500, vaulted: true })
    expect(await table("outbox").count()).toBe(0)
    expect((await rows("plans")).length).toBe(1)
  })
})
