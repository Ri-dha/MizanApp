const MAX_EDGE_PIXELS = 1600
const JPEG_QUALITY = 0.82

/**
 * Screenshots and photos for a report: small enough to send on a weak connection, sharp enough to
 * read text in. Re-encoding through a canvas also drops the location and camera data (ADR support-1);
 * the server strips it again in case a client does not.
 */
export async function prepareReportImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_EDGE_PIXELS / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const context = canvas.getContext("2d")!
  context.fillStyle = "#fff"
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("IMAGE_UNREADABLE"))), "image/jpeg", JPEG_QUALITY),
  )
}
