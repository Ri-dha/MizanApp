import { describe, expect, it } from "vitest"

import type { CashAccount } from "../schema"
import { nextShareRow, NO_ACCOUNT, overAssigned, pickedAccount, rowsFrom, sharesFrom } from "./accountChoice"

const account = (id: string) => ({ id, name: id, currency: "IQD" }) as CashAccount

describe("choosing accounts", () => {
  it("treats No account and a deleted account as none", () => {
    expect(pickedAccount(NO_ACCOUNT, [account("a")])).toBeNull()
    expect(pickedAccount("gone", [account("a")])).toBeNull()
    expect(pickedAccount("a", [account("a")])).toBe("a")
  })

  it("turns typed rows into shares and back", () => {
    const shares = sharesFrom([{ cashAccountId: "a", kind: "PERCENT", text: "60" }, { cashAccountId: "b", kind: "AMOUNT", text: "1.5" }, { cashAccountId: "c", kind: "AMOUNT", text: " " }], "USD")
    expect(shares).toEqual([{ cashAccountId: "a", kind: "PERCENT", value: 6000 }, { cashAccountId: "b", kind: "AMOUNT", value: 150 }])
    expect(rowsFrom(shares, "USD")).toEqual([{ cashAccountId: "a", kind: "PERCENT", text: "60" }, { cashAccountId: "b", kind: "AMOUNT", text: "1.50" }])
  })

  it("flags shares that ask for more than the income", () => {
    expect(overAssigned([{ cashAccountId: "a", kind: "AMOUNT", text: "600" }, { cashAccountId: "b", kind: "PERCENT", text: "50" }], 1000, "IQD")).toBe(true)
    expect(overAssigned([{ cashAccountId: "a", kind: "PERCENT", text: "100" }], 1000, "IQD")).toBe(false)
  })

  it("adds the whole income first, then fixed amounts into accounts not used yet", () => {
    const first = nextShareRow([], [account("a"), account("b")])
    expect(first).toEqual({ cashAccountId: "a", kind: "PERCENT", text: "100" })
    expect(nextShareRow([first!], [account("a"), account("b")])).toEqual({ cashAccountId: "b", kind: "AMOUNT", text: "" })
    expect(nextShareRow([], [])).toBeNull()
  })
})
