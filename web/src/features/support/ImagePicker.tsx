import { ImagePlus, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { MAX_REPORT_IMAGES } from "@/api/support"
import { Button } from "@/components/ui/button"
import { prepareReportImage } from "./prepareImage"

/** Picks up to four images, shrinks them on the device and shows what will be sent. */
export function ImagePicker({ images, onChange, disabled }: { images: Blob[]; onChange: (images: Blob[]) => void; disabled?: boolean }) {
  const { t } = useTranslation()
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [preparing, setPreparing] = useState(false)
  const previews = useMemo(() => images.map((image) => URL.createObjectURL(image)), [images])
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews])

  async function add(files: FileList | null) {
    if (!files?.length) return
    setError(null)
    setPreparing(true)
    const room = MAX_REPORT_IMAGES - images.length
    const picked = Array.from(files).slice(0, room)
    const prepared: Blob[] = []
    for (const file of picked) {
      try {
        prepared.push(await prepareReportImage(file))
      } catch {
        setError(t("support.imageUnreadable"))
      }
    }
    if (files.length > room) setError(t("support.tooManyImages", { count: MAX_REPORT_IMAGES }))
    onChange([...images, ...prepared])
    setPreparing(false)
    if (input.current) input.current.value = ""
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {previews.map((url, i) => (
          <div key={url} className="relative size-20 overflow-hidden rounded-md border">
            <img src={url} alt={t("support.imageAlt", { number: i + 1 })} className="size-full object-cover" />
            <button
              type="button"
              className="absolute end-0.5 top-0.5 rounded-full bg-background/90 p-0.5 shadow"
              aria-label={t("support.removeImage", { number: i + 1 })}
              onClick={() => onChange(images.filter((_, j) => j !== i))}
              disabled={disabled}
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        {images.length < MAX_REPORT_IMAGES && (
          <Button type="button" variant="outline" className="size-20 flex-col gap-1 text-xs" disabled={disabled || preparing} onClick={() => input.current?.click()}>
            <ImagePlus className="size-5" />
            {preparing ? t("common.loading") : t("support.addImage")}
          </Button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => void add(e.target.files)} />
      <p className="text-xs text-muted-foreground">{t("support.imageHint", { count: MAX_REPORT_IMAGES })}</p>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
