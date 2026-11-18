import { formatMoney } from "./format"

describe("formatMoney", () => {
  it("keeps Western digits in Arabic unless Eastern ones are asked for", () => {
    expect(formatMoney(4500, "IQD", "ar")).not.toMatch(/[٠-٩]/)
    expect(formatMoney(4500, "IQD", "ar")).toContain("4,500")
    expect(formatMoney(4500, "IQD", "ar", "eastern")).toMatch(/[٤٥٠]/)
    expect(formatMoney(123456, "USD", "en")).toContain("1,234.56")
  })
})
