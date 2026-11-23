import { describe, expect, it } from "vitest"

import { RECOVERY_REMINDER_DAYS, recoveryReminderDue } from "./account"

const DAY = 86_400_000
const now = Date.parse("2026-11-23T10:00:00Z")

describe("recovery code reminder", () => {
  it("asks on a device that never heard the answer", () => {
    expect(recoveryReminderDue(null, now)).toBe(true)
  })

  it("stays quiet while the last answer is recent", () => {
    expect(recoveryReminderDue(new Date(now - 10 * DAY).toISOString(), now)).toBe(false)
    expect(recoveryReminderDue(new Date(now - RECOVERY_REMINDER_DAYS * DAY).toISOString(), now)).toBe(false)
  })

  it("asks again once the answer is older than the reminder period", () => {
    expect(recoveryReminderDue(new Date(now - (RECOVERY_REMINDER_DAYS + 1) * DAY).toISOString(), now)).toBe(true)
  })
})
