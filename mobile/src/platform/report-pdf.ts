import { File, Paths } from "expo-file-system"
import * as Print from "expo-print"
import * as Sharing from "expo-sharing"

export interface ReportSection {
  heading: string
  rows: [string, string][]
}

const PDF_MIME = "application/pdf"

const escape = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

/** The web prints the page; the phone lays the same figures out as a simple document and shares the PDF. */
export async function shareReportPdf(fileName: string, title: string, subtitle: string, sections: ReportSection[], rtl: boolean) {
  const body = sections.map((section) => `
    <h2>${escape(section.heading)}</h2>
    <table>${section.rows.map(([label, value]) => `<tr><td>${escape(label)}</td><td class="n">${escape(value)}</td></tr>`).join("")}</table>`).join("")
  const html = `<!doctype html><html dir="${rtl ? "rtl" : "ltr"}" lang="${rtl ? "ar" : "en"}"><head><meta charset="utf-8">
    <style>
      body { font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; color: #111; margin: 32px; }
      h1 { font-size: 22px; margin: 0 0 4px; } p { color: #555; margin: 0 0 20px; font-size: 12px; }
      h2 { font-size: 15px; margin: 20px 0 6px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      td { padding: 5px 0; border-bottom: 1px solid #e5e5e5; } td.n { text-align: end; font-variant-numeric: tabular-nums; white-space: nowrap; }
    </style></head><body><h1>${escape(title)}</h1><p>${escape(subtitle)}</p>${body}</body></html>`
  const { uri } = await Print.printToFileAsync({ html })
  const named = new File(Paths.cache, `${fileName}.pdf`)
  if (named.exists) named.delete()
  new File(uri).move(named)
  await Sharing.shareAsync(named.uri, { mimeType: PDF_MIME, dialogTitle: title, UTI: "com.adobe.pdf" })
}
