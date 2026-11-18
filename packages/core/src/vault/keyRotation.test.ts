import { installApi, type ApiClient } from "../api/client"
import { aesSecretStore, installSecretStore } from "../platform/secretStore"
import { memoryStore } from "../store/memoryStore"
import { installStore } from "../store/store"
import { createAccountKeys, derivePasswordKeys, newSharedKey, openField, openGrant, readHeader, wrapForMember, type OpenAccount } from "./crypto"
import { refreshGrants, rotateKeysIfDue, sealTargetFor, setAccount, shareKeysWithMembers } from "./keyring"
import { sealFields } from "./records"

type Answer = unknown | { status: number; error: { code: string } }
type Route = (init?: { body?: unknown }) => Answer

/** A server that answers the routes it is given and fails the test on any other call. */
function fakeServer(routes: Record<string, Route>) {
  const calls: { route: string; body: unknown }[] = []
  const call = (method: string) => (path: string, init?: { body?: unknown }) => {
    const route = routes[`${method} ${path}`]
    if (!route) throw new Error(`unexpected ${method} ${path}`)
    calls.push({ route: `${method} ${path}`, body: init?.body })
    const answer = route(init)
    if (answer && typeof answer === "object" && "status" in answer && "error" in answer) {
      return Promise.resolve({ error: answer.error, response: new Response(null, { status: answer.status as number }) })
    }
    return Promise.resolve({ data: answer, response: new Response(null, { status: 200 }) })
  }
  const client = { GET: call("GET"), POST: call("POST"), PUT: call("PUT"), PATCH: call("PATCH"), DELETE: call("DELETE") } as unknown as ApiClient
  return { client, calls }
}

async function account(contact: string): Promise<OpenAccount> {
  const { wrapSecret } = await derivePasswordKeys(contact, "a long test passphrase")
  return (await createAccountKeys(wrapSecret)).account
}

const member = (userId: string, publicKey: string | null, holds: { keyKind: string; keyVersion: number }[] = [], mayHoldHouseholdKey = true) =>
  ({ userId, mayHoldHouseholdKey, mayHoldReportKey: mayHoldHouseholdKey, publicKey, holds })

describe("shared key rotation (ADR e2e-4)", () => {
  let device: OpenAccount
  let other: OpenAccount
  let firstKey: CryptoKey

  beforeEach(async () => {
    installStore(memoryStore())
    const deviceKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"])
    installSecretStore(aesSecretStore(async () => deviceKey))
    device = await account("device@example.test")
    other = await account("other@example.test")
    firstKey = await newSharedKey()
    await setAccount(device)
  })

  const grantsOf = async (versions: { key: CryptoKey; version: number }[]) => Promise.all(versions.map(async ({ key, version }) =>
    ({ keyKind: "HOUSEHOLD", keyVersion: version, wrappedKey: await wrapForMember(key, device.publicKey, "HOUSEHOLD", version) })))

  it("makes the next version for every remaining member who may hold it and seals with it once accepted", async () => {
    const firstGrant = await grantsOf([{ key: firstKey, version: 1 }])
    const server = fakeServer({
      "GET /api/v1/keys/me": () => ({ account: { publicKey: device.publicKey }, grants: firstGrant }),
      "GET /api/v1/keys/household/state": () => [{ keyKind: "HOUSEHOLD", currentVersion: 1, rotationDue: true }],
      "GET /api/v1/keys/household/members": () => [
        member("device", device.publicKey), member("other", other.publicKey), member("dependent", other.publicKey, [], false), member("no-keys-yet", null),
      ],
      "POST /api/v1/keys/household/rotate": () => ({ keyKind: "HOUSEHOLD", currentVersion: 2, rotationDue: false }),
    })
    installApi(server.client)
    await refreshGrants()
    expect(sealTargetFor("ledger_transaction", "SHARED")?.version).toBe(1)

    expect(await rotateKeysIfDue()).toEqual(["HOUSEHOLD"])

    const rotation = server.calls.find((c) => c.route === "POST /api/v1/keys/household/rotate")!.body as { keyVersion: number; grants: { userId: string; wrappedKey: string }[] }
    expect(rotation.keyVersion).toBe(2)
    expect(rotation.grants.map((g) => g.userId).sort()).toEqual(["device", "other"])
    const sealed = await sealFields("ledger_transaction", "row-1", "SHARED", { payee: "Bakery", visibility: "SHARED" })
    expect(sealed?.payee).toMatch(/^e1\.h\.2\./)
    const othersKey = await openGrant(rotation.grants.find((g) => g.userId === "other")!.wrappedKey, other.privateKey, "HOUSEHOLD", 2)
    expect(await openField(othersKey!, readHeader(sealed!.payee)!, "ledger_transaction", "row-1", "payee")).toBe("Bakery")
  })

  it("keeps nothing when another device rotated first", async () => {
    const firstGrant = await grantsOf([{ key: firstKey, version: 1 }])
    installApi(fakeServer({
      "GET /api/v1/keys/me": () => ({ account: { publicKey: device.publicKey }, grants: firstGrant }),
      "GET /api/v1/keys/household/state": () => [{ keyKind: "HOUSEHOLD", currentVersion: 1, rotationDue: true }],
      "GET /api/v1/keys/household/members": () => [member("device", device.publicKey)],
      "POST /api/v1/keys/household/rotate": () => ({ status: 409, error: { code: "KEY_ROTATION_CONFLICT" } }),
    }).client)
    await refreshGrants()

    expect(await rotateKeysIfDue()).toEqual([])
    expect(sealTargetFor("ledger_transaction", "SHARED")?.version).toBe(1)
  })

  it("leaves a rotation to a device that holds the current version", async () => {
    const firstGrant = await grantsOf([{ key: firstKey, version: 1 }])
    const server = fakeServer({
      "GET /api/v1/keys/me": () => ({ account: { publicKey: device.publicKey }, grants: firstGrant }),
      "GET /api/v1/keys/household/state": () => [{ keyKind: "HOUSEHOLD", currentVersion: 2, rotationDue: true }],
    })
    installApi(server.client)
    await refreshGrants()

    expect(await rotateKeysIfDue()).toEqual([])
    expect(server.calls.map((c) => c.route)).not.toContain("POST /api/v1/keys/household/rotate")
  })

  it("hands a newcomer every version it holds, so records from before a rotation stay readable", async () => {
    const secondKey = await newSharedKey()
    const held = await grantsOf([{ key: firstKey, version: 1 }, { key: secondKey, version: 2 }])
    const server = fakeServer({
      "GET /api/v1/keys/me": () => ({ account: { publicKey: device.publicKey }, grants: held }),
      "GET /api/v1/keys/household/members": () => [
        member("device", device.publicKey, [{ keyKind: "HOUSEHOLD", keyVersion: 1 }, { keyKind: "HOUSEHOLD", keyVersion: 2 }]),
        member("newcomer", other.publicKey),
      ],
      "POST /api/v1/keys/household/grants": () => [],
    })
    installApi(server.client)
    await refreshGrants()

    await shareKeysWithMembers(false)

    const granted = server.calls.find((c) => c.route === "POST /api/v1/keys/household/grants")!.body as { userId: string; keyKind: string; keyVersion: number; wrappedKey: string }[]
    expect(granted.map((g) => `${g.userId} ${g.keyKind} ${g.keyVersion}`).sort()).toEqual(["newcomer HOUSEHOLD 1", "newcomer HOUSEHOLD 2"])
    for (const grant of granted) {
      expect(await openGrant(grant.wrappedKey, other.privateKey, "HOUSEHOLD", grant.keyVersion)).not.toBeNull()
    }
  })
})
