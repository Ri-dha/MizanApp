import { describe, expect, it } from "vitest"

import vectors from "../../../../../shared/test-vectors/month-figures.json"
import { monthFigures, type MonthFiguresInput } from "./figures"

describe("month-figures vectors", () => {
  for (const vector of vectors) {
    it(vector.name, () => {
      expect(monthFigures(vector.input as MonthFiguresInput)).toEqual(vector.expected)
    })
  }
})
