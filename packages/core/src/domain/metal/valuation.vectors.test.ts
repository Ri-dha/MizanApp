import { describe, expect, it } from "vitest"

import vectors from "../../../../../shared/test-vectors/metal-valuation.json"
import { metalValuation } from "./valuation"

describe("metal-valuation vectors", () => {
  for (const vector of vectors) {
    it(vector.name, () => {
      // The shared vectors predate other base currencies; for a dinar household the two rates are the same.
      const { usdIqdMicros, ...rest } = vector.input
      expect(metalValuation({ ...rest, usdBaseMicros: usdIqdMicros })).toEqual(vector.expected)
    })
  }
})
