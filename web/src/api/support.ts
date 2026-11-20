import { api, unwrap } from "./client"
import type { components } from "@mizan/core/api/generated"

export type ReportSummary = components["schemas"]["ReportSummaryResponse"]
export type ReportDetail = components["schemas"]["ReportDetailResponse"]
export type ReportMessage = components["schemas"]["ReportMessage"]
export type ReportCategory = ReportDetail["category"]
export type ReportStatus = ReportDetail["status"]

export const MAX_REPORT_IMAGES = 4

function form(fields: Record<string, string | undefined>, images: Blob[]): FormData {
  const data = new FormData()
  for (const [key, value] of Object.entries(fields)) if (value !== undefined) data.append(key, value)
  images.forEach((image, i) => data.append("images", image, `image-${i + 1}.jpg`))
  return data
}

export const sendReport = (fields: { category: ReportCategory; subject: string; body: string; appVersion?: string; platform?: string }, images: Blob[]) =>
  unwrap(api.POST("/api/v1/support/reports", { body: form(fields, images) as never }))
export const myReports = () => unwrap(api.GET("/api/v1/support/reports"))
export const openReport = (id: string) => unwrap(api.GET("/api/v1/support/reports/{id}", { params: { path: { id } } }))
export const replyToReport = (id: string, body: string, images: Blob[]) =>
  unwrap(api.POST("/api/v1/support/reports/{id}/messages", { params: { path: { id } }, body: form({ body }, images) as never }))

export const reportQueue = (status?: ReportStatus) => unwrap(api.GET("/api/v1/admin/support/reports", { params: { query: { status } } }))
export const openReportAsOperator = (id: string) => unwrap(api.GET("/api/v1/admin/support/reports/{id}", { params: { path: { id } } }))
export const replyAsOperator = (id: string, body: string, images: Blob[]) =>
  unwrap(api.POST("/api/v1/admin/support/reports/{id}/messages", { params: { path: { id } }, body: form({ body }, images) as never }))
export const setReportStatus = (id: string, status: ReportStatus) =>
  unwrap(api.PUT("/api/v1/admin/support/reports/{id}/status", { params: { path: { id } }, body: { status } }))

/** Images need the bearer token, so they come through fetch and are shown from a blob URL. */
export async function reportImage(reportId: string, imageId: string, asOperator: boolean): Promise<Blob> {
  const path = asOperator ? "/api/v1/admin/support/reports/{id}/images/{imageId}" : "/api/v1/support/reports/{id}/images/{imageId}"
  return unwrap(api.GET(path, { params: { path: { id: reportId, imageId } }, parseAs: "blob" })) as Promise<Blob>
}
