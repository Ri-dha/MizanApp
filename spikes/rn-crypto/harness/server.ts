import { createServer } from "node:http"
import { mkdirSync, writeFileSync } from "node:fs"
import { FIELD_VALUES, IDENTIFIERS, PASSWORD, makeFixtures, runAll } from "./cases.ts"
import type { CaseResult, Results } from "./cases.ts"
import {
  derivePasswordKeys, openAccountWithPassword, openAccountWithRecovery, openField, openGrant, readHeader, toBase64Url,
} from "../../../web/src/vault/crypto.ts"

const PORT = 8787
const OUT = new URL("./out/", import.meta.url)

const { fixtures, accountPrivateKey } = await makeFixtures()
const expected = await runAll(fixtures)
const nodeTimes = Object.fromEntries(Object.entries(expected).map(([name, r]) => [name, r.ms]))
console.log(`fixtures ready; node ran ${Object.keys(expected).length} cases, derivePasswordKeys ${nodeTimes.derivePasswordKeys} ms`)

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
const raw = async (key: CryptoKey | null) => key ? toBase64Url(await crypto.subtle.exportKey("raw", key)) : null

const outbound: Record<string, (value: any) => Promise<string | null>> = {
  createAccount: async (v) => {
    const keys = await derivePasswordKeys(IDENTIFIERS[1], PASSWORD)
    const byPassword = await openAccountWithPassword(v.material, keys.wrapSecret)
    const byRecovery = await openAccountWithRecovery(v.material, v.recoveryCode)
    if (await raw(byPassword?.userKey ?? null) !== v.userKey) return "node could not open the phone's account with the password"
    if (await raw(byRecovery?.userKey ?? null) !== v.userKey) return "node could not open the phone's account with the recovery code"
    await crypto.subtle.importKey("spki", Uint8Array.from(Buffer.from(v.material.publicKey, "base64url")), { name: "ECDH", namedCurve: "P-256" }, false, [])
    return null
  },
  grantAndSealToNode: async (v) => {
    const household = await openGrant(v.grant, accountPrivateKey, "HOUSEHOLD", 7)
    if (await raw(household) !== v.household) return "node could not open the phone's grant"
    for (const [i, text] of (v.sealed as string[]).entries()) {
      const opened = await openField(household!, readHeader(text)!, "txn", "rec-9", "note")
      if (!same(opened, FIELD_VALUES[i])) return `field ${i} opened as ${JSON.stringify(opened)}`
    }
    return null
  },
  recoveryCode: async (v) => /^([A-HJ-NP-Z2-9]{4}-){7}[A-HJ-NP-Z2-9]{4}$/.test(v) ? null : `bad format ${v}`,
}

async function verify(name: string, phone: CaseResult): Promise<string | null> {
  if (phone.error) return phone.error
  if (phone.kind === "outbound") return outbound[name](phone.value)
  return same(phone.value, expected[name].value) ? null : `phone ${JSON.stringify(phone.value)} != node ${JSON.stringify(expected[name].value)}`
}

async function report(platform: string, results: Results) {
  const lines: string[] = []
  let failed = 0
  for (const name of Object.keys(expected)) {
    const phone = results[name]
    const problem = phone ? await verify(name, phone) : "missing"
    if (problem) failed++
    lines.push(`${problem ? "FAIL" : "ok  "} ${name.padEnd(26)} phone ${String(phone?.ms ?? "-").padStart(6)} ms  node ${String(nodeTimes[name]).padStart(6)} ms${problem ? `  ${problem}` : ""}`)
  }
  const summary = `${platform}: ${Object.keys(expected).length - failed} passed, ${failed} failed`
  console.log(`\n${summary}\n${lines.join("\n")}`)
  mkdirSync(OUT, { recursive: true })
  writeFileSync(new URL(`${platform}.txt`, OUT), `${summary}\n${lines.join("\n")}\n`)
  writeFileSync(new URL(`${platform}.json`, OUT), JSON.stringify(results, null, 2))
  return { summary, failed }
}

createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/fixtures") {
    res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(fixtures))
    return
  }
  if (req.method === "POST" && req.url === "/results") {
    let body = ""
    for await (const chunk of req) body += chunk
    const { platform, results } = JSON.parse(body)
    const outcome = await report(platform, results)
    res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(outcome))
    return
  }
  res.writeHead(404).end()
}).listen(PORT, "0.0.0.0", () => console.log(`listening on ${PORT}`))
