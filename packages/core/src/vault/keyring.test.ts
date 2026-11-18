import { aesSecretStore, installSecretStore } from "../platform/secretStore"
import { memoryStore } from "../store/memoryStore"
import { installStore, table } from "../store/store"
import { createAccountKeys, derivePasswordKeys } from "./crypto"
import { clearKeyring, deviceMetaKeys, hasAccountKeys, loadKeyring, sealTargetFor, setAccount } from "./keyring"
import { openFields, sealFields } from "./records"

const deviceKey = crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"])

describe("keyring", () => {
  beforeEach(() => {
    installStore(memoryStore())
    installSecretStore(aesSecretStore(() => deviceKey, ["test.deviceKey"]))
  })

  it("keeps the account's keys sealed by the device secret and opens them again", async () => {
    const { wrapSecret } = await derivePasswordKeys("member@example.test", "a long test passphrase")
    const { account } = await createAccountKeys(wrapSecret)
    await setAccount(account)

    const stored = await table("meta").get("vault.keyring")
    expect(JSON.stringify(stored)).not.toContain("userKey")
    expect(await loadKeyring()).toBe(true)
    expect(hasAccountKeys()).toBe(true)
    expect(deviceMetaKeys()).toEqual(["vault.keyring", "test.deviceKey"])

    const sealed = await sealFields("ledger_transaction", "row-1", "PRIVATE", { payee: "شاي", amount: 2500, visibility: "PRIVATE" })
    expect(sealed?.payee).toMatch(/^e1\.u\.1\./)
    expect(sealed?.visibility).toBe("PRIVATE")
    expect(await openFields("ledger_transaction", "row-1", sealed!)).toEqual({ status: "open", fields: { payee: "شاي", amount: 2500, visibility: "PRIVATE" } })
  })

  it("has no target for a shared row until the household key arrives", async () => {
    const { wrapSecret } = await derivePasswordKeys("member@example.test", "a long test passphrase")
    await setAccount((await createAccountKeys(wrapSecret)).account)
    expect(sealTargetFor("ledger_transaction", "SHARED")).toBeNull()
    await clearKeyring()
    expect(hasAccountKeys()).toBe(false)
  })
})
