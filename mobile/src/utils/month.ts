/** The household month as a title, the way the web shows it: "November 2026", "تشرين الثاني ٢٠٢٦". */
export function formatMonthKey(key: string, locale: string): string {
  const [year, month] = key.split("-").map(Number)
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-IQ" : "en-GB", { month: "long", year: "numeric" }).format(new Date(Date.UTC(year, month - 1, 1)))
}
