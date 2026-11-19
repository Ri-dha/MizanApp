export interface ManualPage {
  slug: string
  order: number
  lang: string
  title: string
  screen: string | null
  summary: string
  body: string
}

/** Front matter is three fields on top of the file; a full YAML parser is not worth its weight. */
export function parseFrontMatter(text: string): { meta: Record<string, string>; body: string } {
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(text)
  if (!match) return { meta: {}, body: text }
  const meta: Record<string, string> = {}
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":")
    if (idx > 0) meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim().replace(/^"(.*)"$/, "$1")
  }
  return { meta, body: text.slice(match[0].length) }
}

/** Raw files keyed by a path ending in `manual/<lang>/<nn>-<slug>.md`, however each app bundles them. */
export function parseManual(raw: Record<string, string>): ManualPage[] {
  return Object.entries(raw).map(([path, text]) => {
    const match = /\/manual\/([a-z]{2})\/(\d+)-([a-z0-9-]+)\.md$/.exec(path)
    const lang = match?.[1] ?? "en"
    const slug = match?.[3] ?? path
    const { meta, body } = parseFrontMatter(text)
    return { slug, order: Number(match?.[2] ?? 0), lang, title: meta.title ?? slug, screen: meta.screen ?? null, summary: meta.summary ?? "", body }
  })
}

/** Pages for a language in reading order; Arabic falls back to English page by page. */
export function pagesIn(pages: ManualPage[], lang: string): ManualPage[] {
  const wanted = pages.filter((p) => p.lang === lang)
  return pages
    .filter((p) => p.lang === "en")
    .map((en) => wanted.find((p) => p.slug === en.slug) ?? en)
    .sort((a, b) => a.order - b.order)
}

export function searchPages(pages: ManualPage[], query: string): ManualPage[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return pages
  return pages.filter((p) => p.title.toLowerCase().includes(needle) || p.summary.toLowerCase().includes(needle) || p.body.toLowerCase().includes(needle))
}
