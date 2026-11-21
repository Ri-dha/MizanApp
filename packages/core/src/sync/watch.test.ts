import { describe, expect, it } from "vitest"

import { watchForChanges, type WatchDeps } from "./watch"

function fake(answers: (boolean | Error)[], options: { advances?: boolean } = {}) {
  let cursor = 10
  const waits: number[] = []
  const sleeps: number[] = []
  let syncs = 0
  const deps: WatchDeps = {
    since: async () => cursor,
    wait: async (since) => {
      waits.push(since)
      const answer = answers.shift()
      if (answer instanceof Error) throw answer
      return answer ?? false
    },
    changed: async () => {
      syncs++
      if (options.advances !== false) cursor++
    },
    active: () => answers.length > 0,
    sleep: async (ms) => void sleeps.push(ms),
  }
  return { deps, waits, sleeps, syncs: () => syncs }
}

describe("waiting for changes (ADR sync-4)", () => {
  it("syncs when the server says something changed and waits again from the new cursor", async () => {
    const run = fake([false, true, false])
    await watchForChanges(run.deps)
    expect(run.syncs()).toBe(1)
    expect(run.waits).toEqual([10, 10, 11])
    expect(run.sleeps).toEqual([])
  })

  it("backs off after errors, doubling up to a minute", async () => {
    const run = fake([new Error("offline"), new Error("offline"), new Error("offline"), new Error("offline"), new Error("offline"), true])
    await watchForChanges(run.deps)
    expect(run.sleeps).toEqual([5_000, 10_000, 20_000, 40_000, 60_000])
  })

  it("does not spin when a sync cannot catch up", async () => {
    const run = fake([true, true], { advances: false })
    await watchForChanges(run.deps)
    expect(run.syncs()).toBe(2)
    expect(run.sleeps).toEqual([5_000, 10_000])
  })

  it("stops when signed out", async () => {
    const run = fake([true])
    run.deps.since = async () => undefined
    await watchForChanges(run.deps)
    expect(run.waits).toEqual([])
  })
})
