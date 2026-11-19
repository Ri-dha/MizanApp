import { useState } from "react"
import { StyleSheet, View, type LayoutChangeEvent } from "react-native"
import Svg, { Line, Path } from "react-native-svg"

import { ThemedText } from "@/components/themed-text"
import { spacing } from "@/theme"
import { boundsOf, compact, labelIndexes } from "./scale"

export interface LineSeries {
  key: string
  label: string
  colour: string
  values: (number | null)[]
  dashed?: boolean
  /** Holds each value until the next, as prices and costs do between changes. */
  step?: boolean
}

const AXIS_WIDTH = 52
const X_LABELS = 4
const GRID_LINES = 3
const GRID = "#8888884D"
const STROKE = 2.5
const DASH = "6 4"

function pathOf(values: (number | null)[], x: (i: number) => number, y: (v: number) => number, step: boolean): string {
  let d = ""
  let previous: { x: number; y: number } | null = null
  values.forEach((value, i) => {
    if (value === null) {
      previous = null
      return
    }
    const point = { x: x(i), y: y(value) }
    if (!previous) d += `M${point.x},${point.y}`
    else if (step) d += `H${point.x}V${point.y}`
    else d += `L${point.x},${point.y}`
    previous = point
  })
  return d
}

/** Kept left to right in Arabic too, as on the web (charts are a `dir="ltr"` island). */
export function LineChart({ series, labels, height = 220, formatY = compact, testID }: {
  series: LineSeries[]
  labels: string[]
  height?: number
  formatY?: (value: number) => string
  testID?: string
}) {
  const [width, setWidth] = useState(0)
  const plotWidth = Math.max(0, width - AXIS_WIDTH)
  const bounds = boundsOf(series.flatMap((s) => s.values.filter((v): v is number => v !== null)))
  const count = labels.length
  const x = (i: number) => AXIS_WIDTH + (count <= 1 ? plotWidth / 2 : (i / (count - 1)) * plotWidth)
  const y = (v: number) => height - ((v - bounds.min) / (bounds.max - bounds.min)) * height
  const ticks = Array.from({ length: GRID_LINES }, (_, i) => bounds.min + ((bounds.max - bounds.min) * i) / (GRID_LINES - 1))

  return (
    <View testID={testID} style={styles.ltr} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      <View style={{ height }}>
        {width > 0 ? (
          <Svg width={width} height={height}>
            {ticks.map((tick) => <Line key={tick} x1={AXIS_WIDTH} x2={width} y1={y(tick)} y2={y(tick)} stroke={GRID} strokeWidth={1} />)}
            {series.map((s) => (
              <Path key={s.key} d={pathOf(s.values, x, y, !!s.step)} stroke={s.colour} strokeWidth={STROKE} fill="none" strokeDasharray={s.dashed ? DASH : undefined} strokeLinejoin="round" />
            ))}
          </Svg>
        ) : null}
        {ticks.map((tick) => (
          <ThemedText key={tick} variant="caption" style={[styles.yLabel, { top: Math.min(height - spacing.md, Math.max(0, y(tick) - spacing.sm)) }]}>{formatY(tick)}</ThemedText>
        ))}
      </View>
      <View style={[styles.xLabels, { marginStart: AXIS_WIDTH }]}>
        {labelIndexes(count, X_LABELS).map((i) => <ThemedText key={i} variant="caption">{labels[i]}</ThemedText>)}
      </View>
      {series.length > 1 ? <Legend items={series.map((s) => ({ label: s.label, colour: s.colour, dashed: s.dashed }))} /> : null}
    </View>
  )
}

export function Legend({ items }: { items: { label: string; colour: string; dashed?: boolean }[] }) {
  return (
    <View style={styles.legend}>
      {items.map((item) => (
        <View key={item.label} style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: item.dashed ? "transparent" : item.colour, borderColor: item.colour }]} />
          <ThemedText variant="caption">{item.label}</ThemedText>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  ltr: { direction: "ltr", gap: spacing.xs },
  yLabel: { position: "absolute", left: 0, width: AXIS_WIDTH - spacing.xs },
  xLabels: { flexDirection: "row", justifyContent: "space-between" },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.xs },
  legendItem: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  swatch: { width: spacing.md, height: spacing.xs, borderWidth: 1, borderRadius: 1 },
})
