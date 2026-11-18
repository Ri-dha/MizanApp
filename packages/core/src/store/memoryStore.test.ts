import { memoryStore } from "./memoryStore"
import { sortBy } from "./store"

const row = (id: string, monthKey: string) => ({ id, monthKey, ownerId: null, deletedAt: null, clocks: {} }) as never

describe("memoryStore", () => {
  it("reads back copies, finds by field and keys meta by key", async () => {
    const s = memoryStore()
    await s.table("transactions").bulkPut([row("a", "2026-01"), row("b", "2026-02")])
    await s.table("meta").put({ key: "k", value: 1 })
    const found = await s.table("transactions").where("monthKey", "2026-02")
    expect(found.map((t) => t.id)).toEqual(["b"])
    found[0].monthKey = "changed"
    expect((await s.table("transactions").get("b"))?.monthKey).toBe("2026-02")
    expect(await s.table("meta").get("k")).toEqual({ key: "k", value: 1 })
  })

  it("undoes a transaction that throws, including nested ones", async () => {
    const s = memoryStore()
    await s.table("transactions").put(row("a", "2026-01"))
    await expect(s.transaction(["transactions"], async () => {
      await s.table("transactions").delete("a")
      await s.transaction(["transactions"], async () => s.table("transactions").put(row("b", "2026-01")))
      throw new Error("boom")
    })).rejects.toThrow("boom")
    expect((await s.table("transactions").all()).map((t) => t.id)).toEqual(["a"])
  })
})

describe("sortBy", () => {
  it("is stable, puts nulls first and can descend", () => {
    const rows = [{ k: "b", n: 1 }, { k: null, n: 2 }, { k: "a", n: 3 }, { k: "b", n: 4 }]
    expect(sortBy(rows, (r) => r.k).map((r) => r.n)).toEqual([2, 3, 1, 4])
    expect(sortBy(rows, (r) => r.k, "desc").map((r) => r.n)).toEqual([1, 4, 3, 2])
  })
})
