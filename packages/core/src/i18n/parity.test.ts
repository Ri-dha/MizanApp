import { describe, expect, it } from "vitest"

import ar from "./ar.json"
import en from "./en.json"

type Tree = { [key: string]: string | Tree }
const PLURAL = /_(zero|one|two|few|many|other)$/

function keysOf(tree: Tree, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([key, value]) => (typeof value === "string" ? [`${prefix}${key}`.replace(PLURAL, "")] : keysOf(value, `${prefix}${key}.`)))
}

describe("translations", () => {
  it("Arabic and English carry the same strings (plural forms aside)", () => {
    const english = new Set(keysOf(en as Tree))
    const arabic = new Set(keysOf(ar as Tree))
    expect([...english].filter((k) => !arabic.has(k))).toEqual([])
    expect([...arabic].filter((k) => !english.has(k))).toEqual([])
  })
})
