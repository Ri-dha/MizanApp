import { beforeEach, describe, expect, it } from "vitest"

import { memoryStore } from "../store/memoryStore"
import { installStore, table } from "../store/store"

import { createGoal, liveDeposits, recordDeposit, savedOf, updateGoal, type GoalInput } from "./goals"

const CAR: GoalInput = {
  name: "Car", targetAmount: 10_000_000, currency: "IQD", targetDate: null, monthlyContribution: null,
  bucketId: null, backingAssetId: null, note: null, visibility: "SHARED",
}

describe("money already saved toward a goal", () => {
  beforeEach(() => {
    installStore(memoryStore())
  })

  it("counts toward progress without a deposit or a transaction", async () => {
    const id = await createGoal({ ...CAR, openingAmount: 4_000_000 })
    const goal = (await table("goals").get(id))!

    expect(savedOf(goal, await liveDeposits())).toBe(4_000_000)
    expect(await table("transactions").count()).toBe(0)
    expect(await table("goalDeposits").count()).toBe(0)
  })

  it("adds deposits on top of what was already saved", async () => {
    const id = await createGoal({ ...CAR, openingAmount: 4_000_000 })
    await recordDeposit((await table("goals").get(id))!, [], 1_000_000, "DEPOSIT", "2026-11-21", "2026-11", null)

    expect(savedOf((await table("goals").get(id))!, await liveDeposits())).toBe(5_000_000)
  })

  it("reaches the goal when the saved amount covers it, and reopens it when the target rises", async () => {
    const id = await createGoal({ ...CAR, openingAmount: 10_000_000 })
    expect((await table("goals").get(id))!.status).toBe("COMPLETED")

    await updateGoal(id, { targetAmount: 12_000_000 })
    expect((await table("goals").get(id))!).toMatchObject({ status: "ACTIVE", completedOn: null })
  })

  it("treats a goal saved before the field existed as starting from nothing", () => {
    const old = { id: "g", ownerId: null, clocks: {}, deletedAt: null, ...CAR, backingAssetType: null, status: "ACTIVE" as const, completedOn: null, sortOrder: 0 }
    expect(savedOf(old, [])).toBe(0)
  })
})
