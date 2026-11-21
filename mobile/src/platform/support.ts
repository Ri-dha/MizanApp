import Constants from "expo-constants"
import { File } from "expo-file-system"
import { ImageManipulator, SaveFormat } from "expo-image-manipulator"
import * as ImagePicker from "expo-image-picker"
import { Platform } from "react-native"

import { api, ApiError, NETWORK_ERROR, unwrap } from "@mizan/core/api/client"
import type { components } from "@mizan/core/api/generated"
import { authorisedSend } from "./api-client"
import { dataUriOf } from "./receipt-photo"

export type ReportSummary = components["schemas"]["ReportSummaryResponse"]
export type ReportDetail = components["schemas"]["ReportDetailResponse"]
export type ReportAttachment = components["schemas"]["ReportAttachment"]
export type ReportCategory = ReportDetail["category"]
export type ReportStatus = ReportDetail["status"]

export const MAX_REPORT_IMAGES = 4
export const REPORT_CATEGORIES: ReportCategory[] = ["PROBLEM", "SUGGESTION", "QUESTION"]

/** The web's size and quality, so text in a screenshot stays readable; re-encoding drops location and camera data (ADR support-1). */
const MAX_EDGE_PIXELS = 1600
const JPEG_QUALITY = 0.82

/** Picked images as files on this phone, already shrunk and re-encoded; the system picker needs no permission. */
export async function pickReportImages(room: number): Promise<string[]> {
  const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: true, selectionLimit: room, quality: 1 })
  if (picked.canceled) return []
  const prepared: string[] = []
  for (const asset of picked.assets.slice(0, room)) {
    const longest = Math.max(asset.width, asset.height)
    const context = ImageManipulator.manipulate(asset.uri)
    if (longest > MAX_EDGE_PIXELS) context.resize(asset.width >= asset.height ? { width: MAX_EDGE_PIXELS } : { height: MAX_EDGE_PIXELS })
    const saved = await (await context.renderAsync()).saveAsync({ format: SaveFormat.JPEG, compress: JPEG_QUALITY })
    prepared.push(saved.uri)
  }
  return prepared
}

function form(fields: Record<string, string>, images: string[]): FormData {
  const data = new FormData()
  for (const [key, value] of Object.entries(fields)) data.append(key, value)
  // Expo's fetch reads each part's bytes itself, so a part is a file on disk, not React Native's { uri } shape.
  images.forEach((uri, i) => data.append("images", new File(uri), `image-${i + 1}.jpg`))
  return data
}

async function postForm(path: string, data: FormData): Promise<ReportDetail> {
  let response: Response
  try {
    response = await authorisedSend(path, { method: "POST", body: data })
  } catch (cause) {
    throw new ApiError(NETWORK_ERROR.status, NETWORK_ERROR.code, NETWORK_ERROR.detail, { cause: String(cause) })
  }
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>
  if (!response.ok) throw new ApiError(response.status, (body.code as string) ?? "UNKNOWN", (body.detail as string) ?? response.statusText, body)
  return body as unknown as ReportDetail
}

export const sendReport = (fields: { category: ReportCategory; subject: string; body: string }, images: string[]) =>
  postForm("/api/v1/support/reports", form({ ...fields, platform: Platform.OS, appVersion: Constants.expoConfig?.version ?? "" }, images))

export const replyToReport = (id: string, body: string, images: string[]) => postForm(`/api/v1/support/reports/${id}/messages`, form({ body }, images))

export const myReports = () => unwrap(api().GET("/api/v1/support/reports"))
export const openReport = (id: string) => unwrap(api().GET("/api/v1/support/reports/{id}", { params: { path: { id } } }))

/** Images need the bearer token, so they come through the API and show as a data URI. */
export async function reportImageUri(reportId: string, image: ReportAttachment): Promise<string> {
  const bytes = await unwrap(api().GET("/api/v1/support/reports/{id}/images/{imageId}", { params: { path: { id: reportId, imageId: image.id } }, parseAs: "arrayBuffer" }))
  return dataUriOf(bytes as ArrayBuffer, image.contentType)
}
