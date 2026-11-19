import * as DocumentPicker from "expo-document-picker"
import { File, Paths } from "expo-file-system"
import * as Sharing from "expo-sharing"

/** Writes the file where the system may clean it up later, then hands it to the share sheet to save or send. */
export async function shareFile(name: string, content: string | Uint8Array, mimeType: string) {
  const file = new File(Paths.cache, name)
  if (file.exists) file.delete()
  file.create()
  file.write(content)
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: name })
}

/** The picked file's text, or null when the person backs out of the picker. */
export async function pickTextFile(types: string[]): Promise<string | null> {
  const picked = await DocumentPicker.getDocumentAsync({ type: types, copyToCacheDirectory: true })
  if (picked.canceled || !picked.assets[0]) return null
  return new File(picked.assets[0].uri).text()
}
