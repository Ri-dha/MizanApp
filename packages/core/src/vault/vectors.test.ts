import { gunzipSync, gzipSync } from "node:zlib"

import { vaultVectorChecks } from "./vectors"

const checks = vaultVectorChecks({ gzip: (b) => gzipSync(b), gunzip: (b) => gunzipSync(b) })

describe("vault vectors", () => {
  it.each(checks.map((check) => [`${check.file}: ${check.name}`, check] as const))("%s", async (_label, check) => {
    await check.run()
  })
})
