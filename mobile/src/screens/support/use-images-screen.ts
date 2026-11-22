import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { MAX_REPORT_IMAGES, pickReportImages, reportImageUri, type ReportAttachment } from "@/platform/support"

/** Up to four images to send, shrunk on this phone; each one can be taken out again. */
export function useImagesField(images: string[], onChange: (images: string[]) => void, disabled?: boolean) {
  const { t } = useTranslation()
  const [preparing, setPreparing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function add() {
    setError(null)
    setPreparing(true)
    try {
      onChange([...images, ...(await pickReportImages(MAX_REPORT_IMAGES - images.length))])
    } catch {
      setError(t("support.imageUnreadable"))
    } finally {
      setPreparing(false)
    }
  }

  return {
    preparing, error, disabled,
    max: MAX_REPORT_IMAGES,
    canAdd: images.length < MAX_REPORT_IMAGES,
    add: () => void add(),
    images: images.map((uri, i) => ({ uri, number: i + 1, remove: () => onChange(images.filter((_, j) => j !== i)) })),
  }
}

export type ImagesFieldModel = ReturnType<typeof useImagesField>

/** A sent image, fetched with the session's token; it can be opened full screen. */
export function useReportImage(reportId: string, image: ReportAttachment, number: number) {
  const [uri, setUri] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [open, setOpen] = useState(false)
  const removed = !!image.removedAt

  useEffect(() => {
    // The server deletes photos six months after a report is resolved and answers 410 for them.
    if (removed) return
    let live = true
    reportImageUri(reportId, image).then((loaded) => live && setUri(loaded)).catch(() => live && setFailed(true))
    return () => {
      live = false
    }
  }, [reportId, image, removed])

  return { id: image.id, number, uri, failed, removed, open, show: () => setOpen(true), hide: () => setOpen(false) }
}

export type ReportImageModel = ReturnType<typeof useReportImage>
