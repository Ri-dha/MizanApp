import { writeFields } from "../db/write"
import type { CashAccount } from "../schema"
import type { LocalSession } from "../session"
import { memoryStore } from "../store/memoryStore"
import { installStore, rows, table } from "../store/store"
import { applyImport, buildExport, validateImport } from "./export"

const session = { householdId: "h-1", householdName: "Home", baseCurrency: "IQD", monthStartDay: 1 } as LocalSession

describe("export and import", () => {
  it("carries a household's rows to a fresh device through the normal write path", async () => {
    installStore(memoryStore())
    await writeFields<CashAccount>("cash_account", "acc-1", { name: "محفظة", balance: 250000, currency: "IQD", kind: "WALLET", visibility: "SHARED", institution: null, sortOrder: 0 })
    const file = JSON.parse(JSON.stringify(await buildExport(session)))

    installStore(memoryStore())
    const written = await applyImport(validateImport(file))

    expect(written).toBe(1)
    expect(await table("cashAccounts").get("acc-1")).toMatchObject({ name: "محفظة", balance: 250000 })
    expect((await rows("outbox")).map((op) => op.rowId)).toEqual(["acc-1"])
    expect(() => validateImport({ format: "other" })).toThrow()
  })
})
