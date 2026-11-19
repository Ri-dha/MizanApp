import { ImageManipulator, SaveFormat } from "expo-image-manipulator"
import * as ImagePicker from "expo-image-picker"

import { fromBase64 } from "@mizan/core/attachments/crypto"

const MAX_EDGE_PIXELS = 1200
const JPEG_QUALITY = 0.6

export type PhotoSource = "camera" | "library"

/**
 * Same size and quality as the web's receipts (1200 px, JPEG 0.6); re-encoding drops EXIF. The
 * phone keeps colour, since the native resizer has no grey filter.
 */
export async function takeReceiptPhoto(source: PhotoSource): Promise<ArrayBuffer | null> {
  const allowed = source === "camera" ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!allowed.granted) return null
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 1 }
  const picked = source === "camera" ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options)
  const asset = picked.canceled ? null : picked.assets[0]
  if (!asset) return null
  const longest = Math.max(asset.width, asset.height)
  const context = ImageManipulator.manipulate(asset.uri)
  if (longest > MAX_EDGE_PIXELS) context.resize(asset.width >= asset.height ? { width: MAX_EDGE_PIXELS } : { height: MAX_EDGE_PIXELS })
  const rendered = await context.renderAsync()
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: JPEG_QUALITY, base64: true })
  return saved.base64 ? fromBase64(saved.base64).buffer : null
}

const CHUNK = 0x8000

/** A data URI for the decrypted photo; chunked because the bytes overflow one String.fromCharCode call. */
export function dataUriOf(bytes: ArrayBuffer, mimeType: string): string {
  const view = new Uint8Array(bytes)
  let binary = ""
  for (let i = 0; i < view.length; i += CHUNK) binary += String.fromCharCode(...view.subarray(i, i + CHUNK))
  return `data:${mimeType};base64,${btoa(binary)}`
}
