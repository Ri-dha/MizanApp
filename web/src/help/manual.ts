import { pagesIn, parseManual, type ManualPage } from "@mizan/core/help/manual"

export { parseFrontMatter, type ManualPage } from "@mizan/core/help/manual"

const RAW = import.meta.glob("../../../docs/manual/*/*.md", { query: "?raw", import: "default", eager: true }) as Record<string, string>

const PAGES = parseManual(RAW)

export function pagesFor(lang: string): ManualPage[] {
  return pagesIn(PAGES, lang)
}

export function pageFor(lang: string, slug: string): ManualPage | undefined {
  return pagesFor(lang).find((p) => p.slug === slug)
}

export function allPages(): ManualPage[] {
  return PAGES
}
