import { formatDateTime, formatNumber, withDigits } from "./digits"
import { formatDate } from "./calendar/hijri"
import { formatMoney } from "./money/format"

const ARABIC_INDIC = /[٠-٩]/
const WESTERN = /[0-9]/

describe("digits follow the person's setting, not the locale", () => {
  it("converts both ways", () => {
    expect(withDigits("٢٠٢٦/١١/٢١", "western")).toBe("2026/11/21")
    expect(withDigits("2026/11/21", "eastern")).toBe("٢٠٢٦/١١/٢١")
  })

  it("dates, numbers, money and Hijri dates in Arabic use the chosen digits", () => {
    const at = Date.UTC(2026, 10, 21, 12, 30)
    for (const text of [
      formatDateTime(at, "ar", { dateStyle: "medium", timeStyle: "short" }, "western"),
      formatNumber(1234567, "ar", {}, "western"),
      formatMoney(1250000, "IQD", "ar", "western"),
      formatDate("2026-11-21", "ar", true, undefined, "western"),
    ]) {
      expect(text, text).toMatch(WESTERN)
      expect(text, text).not.toMatch(ARABIC_INDIC)
    }
    for (const text of [
      formatDateTime(at, "ar", { dateStyle: "medium" }, "eastern"),
      formatNumber(1234567, "ar", {}, "eastern"),
      formatMoney(1250000, "IQD", "ar", "eastern"),
      formatDate("2026-11-21", "ar", true, undefined, "eastern"),
    ]) {
      expect(text, text).toMatch(ARABIC_INDIC)
      expect(text, text).not.toMatch(WESTERN)
    }
  })

  it("leaves English alone whatever the setting", () => {
    expect(formatNumber(1234, "en", {}, "eastern")).toBe("1,234")
    expect(formatMoney(1250000, "IQD", "en", "eastern")).not.toMatch(ARABIC_INDIC)
  })
})
