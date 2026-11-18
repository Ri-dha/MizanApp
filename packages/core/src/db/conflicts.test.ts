import { memoryStore } from "../store/memoryStore"
import { installStore, table } from "../store/store"
import { dismissConflict, liveConflicts } from "./conflicts"

const conflict = (id: string, detectedAt: string) => ({
  id, table: "ledger_transaction" as const, rowId: "row-1", field: "payee", clientValue: "Mine", serverValue: "Theirs", detectedAt, dismissed: false,
})

describe("conflicts", () => {
  it("lists overridden edits newest first and hides dismissed ones", async () => {
    installStore(memoryStore())
    await table("conflicts").bulkPut([conflict("a", "2026-11-18T10:00:00Z"), conflict("b", "2026-11-19T09:00:00Z")])
    expect((await liveConflicts()).map((c) => c.id)).toEqual(["b", "a"])
    await dismissConflict("b")
    expect((await liveConflicts()).map((c) => c.id)).toEqual(["a"])
  })
})
