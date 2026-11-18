import { generateDataKey, secretFromPin, unwrapDataKey, wrapDataKey } from "./crypto"

describe("PIN lock key", () => {
  it("opens with the right PIN and refuses a wrong one", async () => {
    const dataKey = await generateDataKey()
    const entry = await wrapDataKey(dataKey, secretFromPin("2580"))
    const opened = await unwrapDataKey(entry, secretFromPin("2580"))
    const raw = async (key: CryptoKey) => Buffer.from(await crypto.subtle.exportKey("raw", key)).toString("hex")
    expect(opened && (await raw(opened))).toBe(await raw(dataKey))
    expect(await unwrapDataKey(entry, secretFromPin("0000"))).toBeNull()
  })
})
