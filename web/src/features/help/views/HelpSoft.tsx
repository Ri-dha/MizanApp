import { BookOpen, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { useTranslation } from "react-i18next"
import Markdown from "react-markdown"
import { Link } from "react-router"
import remarkGfm from "remark-gfm"

import { Input } from "@/components/ui/input"
import type { HelpPageModel } from "../useHelpPage"

const link = "font-medium text-link underline-offset-4 hover:underline"

/** Soft: a wide search field over two columns of topic cards; a topic opens as one reading card. */
export default function HelpSoft({ model }: { model: HelpPageModel }) {
  const { t } = useTranslation()
  const { page, lang } = model

  if (page) {
    return (
      <article className="flex max-w-3xl flex-col gap-4">
        <Link to="/help" className={`${link} flex items-center gap-1 self-start text-sm`}><ChevronLeft className="size-4 rtl:rotate-180" />{t("help.backToIndex")}</Link>
        <div className="flex flex-col gap-4 rounded-[10px] border border-border bg-card p-5 shadow-card sm:p-7">
          <h1 className="text-3xl">{page.title}</h1>
          {page.lang !== lang && <p className="text-sm text-muted-foreground">{t("help.englishOnly")}</p>}
          <div className="manual">
            <Markdown remarkPlugins={[remarkGfm]}>{page.body}</Markdown>
          </div>
          {page.screen && <Link to={page.screen} className={`${link} self-start`}>{t("help.openScreen")}</Link>}
        </div>
      </article>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl">{t("help.title")}</h1>
      <div className="relative max-w-[640px]">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input className="h-11 ps-10" placeholder={t("help.search")} aria-label={t("help.search")} value={model.query} onChange={(e) => model.setQuery(e.target.value)} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {model.shown.map((p) => (
          <Link key={p.slug} to={`/help/${p.slug}`}
            className="flex items-start gap-3.5 rounded-[10px] border border-border bg-card p-5 shadow-card transition-colors hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-accent text-accent-foreground"><BookOpen className="size-5" /></span>
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-base leading-[22px] font-semibold">{p.title}</span>
              <span className="text-[13px] text-muted-foreground">{p.summary}</span>
              {p.lang !== lang && <span className="text-xs text-muted-foreground">{t("help.englishOnly")}</span>}
            </span>
            <ChevronRight className="size-5 shrink-0 text-muted-foreground rtl:rotate-180" />
          </Link>
        ))}
        {model.shown.length === 0 && <p className="text-muted-foreground">{t("help.noMatch")}</p>}
      </div>
      <a href={`/privacy.html#${lang}`} className={`${link} self-start text-sm`}>{t("help.privacy")}</a>
    </div>
  )
}
