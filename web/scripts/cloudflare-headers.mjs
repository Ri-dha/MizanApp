// ADR deploy-cf-1: Cloudflare serves the files, so the policy Caddy sends goes in dist/_headers.
import { writeFileSync } from "node:fs"
import path from "node:path"

import { productionHeaders } from "../vite.config.ts"

const headers = productionHeaders()
if (!headers["Content-Security-Policy"]) throw new Error("No security headers found; is infra/caddy/security-headers.caddy there?")
const lines = ["/*", ...Object.entries(headers).map(([name, value]) => `  ${name}: ${value.replace(/\s+/g, " ").trim()}`)]
writeFileSync(path.resolve(import.meta.dirname, "../dist/_headers"), lines.join("\n") + "\n")
console.log(`dist/_headers: ${Object.keys(headers).length} headers`)
