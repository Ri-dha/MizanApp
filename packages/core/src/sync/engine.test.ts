import { installApi, type ApiClient } from "../api/client"
import { liveSyncRejections } from "../db/syncRejections"
import { writeFields } from "../db/write"
import { aesSecretStore, installSecretStore } from "../platform/secretStore"
import type { LedgerTransaction } from "../schema"
import type { LocalSession } from "../session"
import { memoryStore } from "../store/memoryStore"
import { installStore, rows, table } from "../store/store"
import { createAccountKeys, derivePasswordKeys, newSharedKey, wrapForMember } from "../vault/crypto"
import { holdsKey, setAccount } from "../vault/keyring"
import { sealFields } from "../vault/records"
import { startSyncEngine, syncNow, syncStatus } from "./engine"

type Op = { opId: string; table: string; rowId: string; fields: Record<string, unknown>; clocks: Record<string, string> }

const session: LocalSession = {
  userId: "user-1", householdId: "household-1", householdName: "Home", displayName: "Owner", contact: "owner@example.test", locale: "en",
  verified: true, role: "OWNER", baseCurrency: "IQD", monthStartDay: 1, deletionRequestedAt: null, householdDeletionRequestedAt: null,
}

type Refusal = { status: number; error: { code: string } }

/** Just enough of the server for one device: it accepts every op (unless told to refuse one push) and serves one pulled record. */
function fakeServer(publicKey: string, pulled: unknown[], options: { grants?: () => unknown[]; refusePush?: () => Refusal | null; rejectOp?: (op: Op) => string | null } = {}) {
  const pushed: Op[] = []
  const ok = (data: unknown) => Promise.resolve({ data, response: new Response(null, { status: 200 }) })
  const routes: Record<string, (init?: { body?: unknown; params?: { query?: { since?: number } } }) => unknown> = {
    "GET /api/v1/keys/me": () => ({ account: { publicKey }, grants: options.grants?.() ?? [] }),
    "GET /api/v1/keys/household/members": () => [],
    "GET /api/v1/keys/household/state": () => [],
    "POST /api/v1/sync/devices": () => ({ id: "device-1" }),
    "POST /api/v1/sync/push": (init) => {
      const refusal = options.refusePush?.()
      if (refusal) return refusal
      const ops = (init?.body as { ops: Op[] }).ops
      const rejected = ops.flatMap((op) => {
        const code = options.rejectOp?.(op)
        return code ? [{ opId: op.opId, code, detail: "refused" }] : []
      })
      const refused = new Set(rejected.map((r) => r.opId))
      pushed.push(...ops.filter((op) => !refused.has(op.opId)))
      return { applied: ops.filter((op) => !refused.has(op.opId)).map((op) => op.opId), conflicts: [], rejected }
    },
    "GET /api/v1/sync/pull": (init) => (init?.params?.query?.since ?? 0) === 0 ? { records: pulled, nextSeq: 1, hasMore: false } : { records: [], nextSeq: 1, hasMore: false },
    "GET /api/v1/vault/status": () => ({ migrated: true, legacyRows: 0 }),
    "PUT /api/v1/notifications/schedule": () => ({}),
  }
  const call = (method: string) => (path: string, init?: never) => {
    const route = routes[`${method} ${path}`]
    if (!route) throw new Error(`unexpected ${method} ${path}`)
    const answer = route(init) as Refusal | unknown
    if (answer && typeof answer === "object" && "error" in answer && "status" in answer) {
      return Promise.resolve({ error: (answer as Refusal).error, response: new Response(null, { status: (answer as Refusal).status }) })
    }
    return ok(answer)
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

    expect(syncStatus()).toMatchObject({ phase: "idle", lastError: null, awaitingKey: false })
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

  it("tells a new viewer their records wait for the household key, and stops once it is granted", async () => {
    installStore(memoryStore())
    const deviceKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"])
    installSecretStore(aesSecretStore(async () => deviceKey))
    const { wrapSecret } = await derivePasswordKeys(session.contact, "a long test passphrase")
    const { account } = await createAccountKeys(wrapSecret)
    await setAccount(account)
    const grants: unknown[] = []
    installApi(fakeServer(account.publicKey, [], { grants: () => grants }).client)
    session.role = "VIEWER"
    try {
      await syncNow()
      expect(syncStatus()).toMatchObject({ phase: "idle", awaitingKey: true })

      grants.push({ keyKind: "HOUSEHOLD", keyVersion: 1, wrappedKey: await wrapForMember(await newSharedKey(), account.publicKey, "HOUSEHOLD", 1) })
      await syncNow()
      expect(syncStatus().awaitingKey).toBe(false)
    } finally {
      session.role = "OWNER"
    }
  })

  it("after a push refused for a rotated key, fetches the new key and seals the outbox with it (ADR e2e-4)", async () => {
    installStore(memoryStore())
    const deviceKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"])
    installSecretStore(aesSecretStore(async () => deviceKey))
    const { wrapSecret } = await derivePasswordKeys(session.contact, "a long test passphrase")
    const { account } = await createAccountKeys(wrapSecret)
    await setAccount(account)
    const grantFor = async (version: number) =>
      ({ keyKind: "HOUSEHOLD", keyVersion: version, wrappedKey: await wrapForMember(await newSharedKey(), account.publicKey, "HOUSEHOLD", version) })
    const held = [await grantFor(1)]
    const secondVersion = await grantFor(2)
    let rotatedElsewhere = true
    const server = fakeServer(account.publicKey, [], {
      grants: () => held,
      refusePush: () => {
        if (!rotatedElsewhere) return null
        rotatedElsewhere = false
        held.push(secondVersion)
        return { status: 409, error: { code: "KEY_ROTATED" } }
      },
    })
    installApi(server.client)
    await writeFields<LedgerTransaction>("ledger_transaction", "shared-1", { visibility: "SHARED", payee: "Market", amount: 9000 } as never)

    startSyncEngine({
      lifecycle: { isOnline: () => true, onOnline: () => {}, onOffline: () => {}, onForeground: () => {} },
      loadSession: async () => ({ ...session, role: "MEMBER" }), refreshProfile: async () => {}, vaultReady: () => true, onVaultReady: () => {},
      onKeysReplaced: async () => {}, deviceName: () => "Test", afterDuties: async () => {}, afterSync: async () => {},
    })
    await syncNow()

    expect(syncStatus()).toMatchObject({ phase: "idle", lastError: null })
    const op = server.pushed.find((pushedOp) => pushedOp.rowId === "shared-1")!
    expect(op.fields.payee).toMatch(/^e1\.h\.2\./)
    expect(await table("outbox").count()).toBe(0)
  })

  it("drops an op the server refused on its own, records it without values, and still syncs the rest (ADR sync-3)", async () => {
    installStore(memoryStore())
    const deviceKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"])
    installSecretStore(aesSecretStore(async () => deviceKey))
    const { wrapSecret } = await derivePasswordKeys(session.contact, "a long test passphrase")
    const { account } = await createAccountKeys(wrapSecret)
    await setAccount(account)
    const server = fakeServer(account.publicKey, [], { rejectOp: (op) => (op.rowId === "bad-1" ? "SYNC_FIELD_UNKNOWN" : null) })
    installApi(server.client)
    await writeFields<LedgerTransaction>("ledger_transaction", "bad-1", { visibility: "PRIVATE", payee: "Refused", amount: 1 } as never)
    await writeFields<LedgerTransaction>("ledger_transaction", "good-1", { visibility: "PRIVATE", payee: "Kept", amount: 2 } as never)

    startSyncEngine({
      lifecycle: { isOnline: () => true, onOnline: () => {}, onOffline: () => {}, onForeground: () => {} },
      loadSession: async () => session, refreshProfile: async () => {}, vaultReady: () => true, onVaultReady: () => {},
      onKeysReplaced: async () => {}, deviceName: () => "Test", afterDuties: async () => {}, afterSync: async () => {},
    })
    await syncNow()

    expect(syncStatus()).toMatchObject({ phase: "idle", lastError: null, pending: 0 })
    expect(server.pushed.some((op) => op.rowId === "good-1")).toBe(true)
    expect(await table("outbox").count()).toBe(0)
    const rejections = await liveSyncRejections()
    expect(rejections).toHaveLength(1)
    expect(rejections[0]).toMatchObject({ table: "ledger_transaction", rowId: "bad-1", code: "SYNC_FIELD_UNKNOWN" })
    expect(JSON.stringify(rejections)).not.toContain("Refused")
    expect(await table("transactions").get("bad-1")).toMatchObject({ payee: "Refused" })
  })
})
