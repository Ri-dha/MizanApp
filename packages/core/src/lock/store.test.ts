import { META_KEYS, writeMeta } from "../db/meta"
import { memoryStore } from "../store/memoryStore"
import { installStore } from "../store/store"
import { appHidden, appShown, currentDataKey, initialiseLock, lockState, setPin, unlockWithPin } from "./store"

describe("lock", () => {
  beforeEach(async () => {
    installStore(memoryStore())
    await initialiseLock()
  })

  it("asks for a PIN, then locks only after the grace period", async () => {
    expect(lockState()).toBe("no-pin")
    await setPin("2580")
    expect(lockState()).toBe("unlocked")
    await writeMeta(META_KEYS.lockAfterSeconds, 30)

    appHidden(1_000)
    await appShown(20_000)
    expect(lockState()).toBe("unlocked")

    appHidden(100_000)
    await appShown(131_000)
    expect(lockState()).toBe("locked")
    expect(currentDataKey()).toBeNull()

    expect(await unlockWithPin("0000")).toBe(false)
    expect(await unlockWithPin("2580")).toBe(true)
    expect(currentDataKey()).not.toBeNull()
  })
})
