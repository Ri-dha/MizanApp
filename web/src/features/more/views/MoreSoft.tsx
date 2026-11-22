import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import type { MorePageModel } from "../useMorePage"

/** Soft: the rest of the app as titled groups of small tiles, each with its icon in a coloured square. */
export default function MoreSoft({ model }: { model: MorePageModel }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl">{t("nav.more")}</h1>
      {model.groups.map((group) => (
        <section key={group.id} className="flex flex-col gap-2">
          <h2 className="text-[13px] leading-[18px] font-semibold text-muted-foreground">{t(`more.groups.${group.id}`)}</h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {group.links.map((link) => (
              <Link key={link.to} to={link.to}
                className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-2 py-3 text-center text-xs leading-[15px] font-medium transition-colors hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                <span className={`grid size-9 place-items-center rounded-[10px] ${link.tone}`}><link.icon className="size-5" /></span>
                {t(link.key)}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
