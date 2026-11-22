import { viewFor } from "@mizan/core/domain/appStyle"
import type { ReportAttachment } from "@/platform/support"
import { useAppStyle } from "@/theme"
import { useImagesField, useReportImage } from "./use-images-screen"
import { ImagesFieldSoft, ReportImageSoft } from "./views/images-soft"

/** ADR styles-1: each template draws the pictures its own way; a template without a view of its own gets Soft. */
const FIELD_VIEWS = { soft: ImagesFieldSoft }
const IMAGE_VIEWS = { soft: ReportImageSoft }

/** Up to four images to send, shrunk on this phone; each thumbnail can be taken out again. */
export function ImagesField({ images, onChange, disabled }: { images: string[]; onChange: (images: string[]) => void; disabled?: boolean }) {
  const model = useImagesField(images, onChange, disabled)
  const View = viewFor(FIELD_VIEWS, useAppStyle())
  return <View model={model} />
}

/** A sent image, fetched with the session's token; tapping it opens it full screen. */
export function ReportImage({ reportId, image, number }: { reportId: string; image: ReportAttachment; number: number }) {
  const model = useReportImage(reportId, image, number)
  const View = viewFor(IMAGE_VIEWS, useAppStyle())
  return <View model={model} />
}
