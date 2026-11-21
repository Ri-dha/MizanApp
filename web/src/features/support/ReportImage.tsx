import { ImageOff } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { reportImage } from "@/api/support"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

/** {@code removed}: deleted some months after the report was resolved (T-report-image-retention); nothing to load. */
export function ReportImage({ reportId, imageId, asOperator, number, removed = false }: { reportId: string; imageId: string; asOperator: boolean; number: number; removed?: boolean }) {
  const { t } = useTranslation()
  const [url, setUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (removed) return
    let created: string | null = null
    let live = true
    reportImage(reportId, imageId, asOperator)
      .then((blob) => {
        created = URL.createObjectURL(blob)
        if (live) setUrl(created)
      })
      .catch(() => live && setFailed(true))
    return () => {
      live = false
      if (created) URL.revokeObjectURL(created)
    }
  }, [reportId, imageId, asOperator, removed])

  const alt = t("support.imageAlt", { number })
  if (removed) {
    return (
      <div className="flex size-24 flex-col items-center justify-center gap-1 rounded-md border border-dashed p-1 text-center text-[10px] leading-tight text-muted-foreground" title={t("support.imageRemoved")}>
        <ImageOff className="size-4" aria-hidden />
        <span>{t("support.imageRemovedShort")}</span>
      </div>
    )
  }
  if (failed) return <div className="flex size-24 items-center justify-center rounded-md border text-muted-foreground"><ImageOff className="size-5" aria-label={t("support.imageFailed")} /></div>
  if (!url) return <div className="size-24 animate-pulse rounded-md bg-muted" />
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="size-24 overflow-hidden rounded-md border" aria-label={t("support.openImage", { number })}>
        <img src={url} alt={alt} className="size-full object-cover" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] p-2 sm:max-w-3xl">
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          <img src={url} alt={alt} className="max-h-[80vh] w-full object-contain" />
        </DialogContent>
      </Dialog>
    </>
  )
}
