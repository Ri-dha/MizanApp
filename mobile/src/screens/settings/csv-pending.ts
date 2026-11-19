/** The picked statement waits here for the import screen; the text is too large for a route parameter. */
let pending: string | null = null

export function setPendingCsv(text: string) {
  pending = text
}

export function takePendingCsv(): string | null {
  const text = pending
  pending = null
  return text
}
