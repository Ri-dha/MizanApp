import type { Worker } from "tesseract.js"
import { extractReceipt } from "@mizan/core/ocr/receipt"
import type { ReceiptReading } from "@mizan/core/ocr/reading"

export type { ReceiptReading } from "@mizan/core/ocr/reading"
export { extractDate, extractReceipt, westernDigits } from "@mizan/core/ocr/receipt"

const ASSETS = "/ocr"
const LANGS = "eng+ara"

let worker: Promise<Worker> | null = null

/** Everything runs on the device from files under /ocr, so a receipt is never sent anywhere (BR-16). */
async function getWorker(): Promise<Worker> {
  if (!worker) {
    worker = import("tesseract.js").then(({ createWorker }) =>
      createWorker(LANGS, 1, { workerPath: `${ASSETS}/worker.min.js`, corePath: ASSETS, langPath: ASSETS, gzip: true, workerBlobURL: false }),
    )
  }
  return worker
}

export async function readReceipt(image: Blob): Promise<ReceiptReading> {
  const w = await getWorker()
  const { data } = await w.recognize(image)
  return { ...extractReceipt(data.text), text: data.text }
}

