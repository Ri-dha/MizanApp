import { useState } from "react"
import { StyleSheet, View, type LayoutChangeEvent } from "react-native"
import Svg, { Line, Rect } from "react-native-svg"

import { ThemedText } from "@/components/themed-text"
import { spacing } from "@/theme"
import { Legend } from "./line-chart"
import { boundsOf, compact, labelIndexes } from "./scale"

export interface BarStack {
  key: string
  label: string
  colour: string
  values: number[]
}

const AXIS_WIDTH = 52
const X_LABELS = 6
const GRID_LINES = 3
const GRID = "#8888884D"
const BAR_SHARE = 0.65

/** Stacked bars per period (spending by bucket per month); left to right in Arabic too. */
export function StackedBarChart({ stacks, labels, height = 220, formatY = compact, testID }: {
  stacks: BarStack[]
  labels: string[]
  height?: number
  formatY?: (value: number) => string
  testID?: string
}) {
  const [width, setWidth] = useState(0)
  const plotWidth = Math.max(0, width - AXIS_WIDTH)
  const totals = labels.map((_, i) => stacks.reduce((sum, s) => sum + Math.max(0, s.values[i] ?? 0), 0))
  const bounds = boundsOf(totals, true)
  const slot = labels.length > 0 ? plotWidth / labels.length : 0
  const barWidth = slot * BAR_SHARE
  const y = (v: number) => height - ((v - bounds.min) / (bounds.max - bounds.min)) * height
  const ticks = Array.from({ length: GRID_LINES }, (_, i) => bounds.min + ((bounds.max - bounds.min) * i) / (GRID_LINES - 1))

  return (
    <View testID={testID} style={styles.ltr} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      <View style={{ height }}>
        {width > 0 ? (
          <Svg width={width} height={height}>
            {ticks.map((tick) => <Line key={tick} x1={AXIS_WIDTH} x2={width} y1={y(tick)} y2={y(tick)} stroke={GRID} strokeWidth={1} />)}
            {labels.map((label, i) => {
              let base = 0
              return stacks.map((s) => {
                const value = Math.max(0, s.values[i] ?? 0)
                if (value === 0) return null
                const top = y(base + value)
                const rect = <Rect key={`${label}-${s.key}`} x={AXIS_WIDTH + i * slot + (slot - barWidth) / 2} y={top} width={barWidth} height={y(base) - top} fill={s.colour} />
                base += value
                return rect
              })
            })}
          </Svg>
        ) : null}
        {ticks.map((tick) => (
          <ThemedText key={tick} variant="caption" style={[styles.yLabel, { top: Math.min(height - spacing.md, Math.max(0, y(tick) - spacing.sm)) }]}>{formatY(tick)}</ThemedText>
        ))}
      </View>
      <View style={[styles.xLabels, { marginStart: AXIS_WIDTH }]}>
        {labelIndexes(labels.length, X_LABELS).map((i) => <ThemedText key={i} variant="caption">{labels[i]}</ThemedText>)}
      </View>
      <Legend items={stacks.map((s) => ({ label: s.label, colour: s.colour }))} />
    </View>
  )
}

const styles = StyleSheet.create({
  ltr: { direction: "ltr", gap: spacing.xs },
  yLabel: { position: "absolute", left: 0, width: AXIS_WIDTH - spacing.xs },
  xLabels: { flexDirection: "row", justifyContent: "space-between" },
})
