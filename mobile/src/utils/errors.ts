import { ApiError } from "@mizan/core/api/client"
import i18n from "@/i18n"

/** The web's rule: a problem+json code with a translation wins, otherwise the server's own detail. */
export function describeError(error: unknown): string {
  if (error instanceof ApiError && error.status !== 0) {
    const key = `errors.${error.code}`
    return i18n.exists(key) ? i18n.t(key) : error.detail
  }
  return i18n.t("common.error")
}
