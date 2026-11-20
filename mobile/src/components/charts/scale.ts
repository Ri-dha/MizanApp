export interface Bounds {
  min: number
  max: number
}

/** Pads a flat or tiny range so a line never sits on the edge or divides by zero. */
export function boundsOf(values: number[], includeZero = false): Bounds {
  const present = values.filter((v) => Number.isFinite(v))
  if (present.length === 0) return { min: 0, max: 1 }
  let min = Math.min(...present, ...(includeZero ? [0] : []))
  let max = Math.max(...present, ...(includeZero ? [0] : []))
  if (min === max) {
    const pad = Math.abs(min) * 0.05 || 1
    min -= pad
    max += pad
  }
  return { min, max }
}

const MAGNITUDES = [
  { size: 1e9, suffix: "B" },
  { size: 1e6, suffix: "M" },
  { size: 1e3, suffix: "K" },
] as const

/** Hermes ignores Intl's compact notation and prints the full number, so axis labels shorten here. */
export function compact(value: number): string {
  const magnitude = MAGNITUDES.find((m) => Math.abs(value) >= m.size)
  if (!magnitude) return String(Math.round(value))
  return `${Number((value / magnitude.size).toFixed(2))}${magnitude.suffix}`
}

/** Up to `count` labels spread evenly, always including the first and the last. */
export function labelIndexes(length: number, count: number): number[] {
  if (length <= count) return Array.from({ length }, (_, i) => i)
  const step = (length - 1) / (count - 1)
  return Array.from({ length: count }, (_, i) => Math.round(i * step))
}
