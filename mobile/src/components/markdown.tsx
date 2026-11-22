import { Fragment, type ReactNode } from "react"
import { Platform, StyleSheet, Text, View } from "react-native"

import { radius, spacing, makeStyles } from "@/theme"
import { ThemedText } from "./themed-text"

type Block =
  | { kind: "heading"; level: number; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "table"; rows: string[][] }

const MONO = Platform.select({ ios: "Menlo", default: "monospace" })
const TABLE_DIVIDER = /^\|?\s*:?-{3,}/

function cellsOf(line: string): string[] {
  return line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim())
}

/** The manual uses headings, paragraphs, lists, tables, bold and inline code; nothing else is parsed. */
export function parseMarkdown(source: string): Block[] {
  const blocks: Block[] = []
  const lines = source.split("\n")
  let index = 0
  while (index < lines.length) {
    const line = lines[index]
    if (!line.trim()) { index++; continue }
    const heading = /^(#{1,6})\s+(.*)$/.exec(line)
    if (heading) { blocks.push({ kind: "heading", level: heading[1].length, text: heading[2] }); index++; continue }
    if (line.trim().startsWith("|")) {
      const rows: string[][] = []
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        if (!TABLE_DIVIDER.test(lines[index].trim())) rows.push(cellsOf(lines[index]))
        index++
      }
      blocks.push({ kind: "table", rows })
      continue
    }
    const bullet = /^\s*([-*]|\d+\.)\s+/
    if (bullet.test(line)) {
      const ordered = /^\s*\d+\./.test(line)
      const items: string[] = []
      while (index < lines.length && bullet.test(lines[index])) {
        items.push(lines[index].replace(bullet, ""))
        index++
      }
      blocks.push({ kind: "list", ordered, items })
      continue
    }
    const paragraph: string[] = []
    while (index < lines.length && lines[index].trim() && !/^(#{1,6})\s/.test(lines[index]) && !bullet.test(lines[index]) && !lines[index].trim().startsWith("|")) {
      paragraph.push(lines[index].trim())
      index++
    }
    blocks.push({ kind: "paragraph", text: paragraph.join(" ") })
  }
  return blocks
}

function inline(text: string, styles: ReturnType<typeof useStyles>): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean).map((part, i) => {
    if (part.startsWith("**")) return <Text key={i} style={styles.bold}>{part.slice(2, -2)}</Text>
    if (part.startsWith("`")) return <Text key={i} style={styles.code}>{part.slice(1, -1)}</Text>
    return <Fragment key={i}>{part.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")}</Fragment>
  })
}

export function Markdown({ source }: { source: string }) {
  const styles = useStyles()
  return (
    <View style={styles.document}>
      {parseMarkdown(source).map((block, i) => {
        switch (block.kind) {
          case "heading":
            return <ThemedText key={i} variant={block.level <= 2 ? "title" : "headline"} style={styles.heading}>{inline(block.text, styles)}</ThemedText>
          case "paragraph":
            return <ThemedText key={i}>{inline(block.text, styles)}</ThemedText>
          case "list":
            return (
              <View key={i} style={styles.list}>
                {block.items.map((item, n) => (
                  <View key={n} style={styles.item}>
                    <ThemedText>{block.ordered ? `${n + 1}.` : "•"}</ThemedText>
                    <ThemedText style={styles.itemText}>{inline(item, styles)}</ThemedText>
                  </View>
                ))}
              </View>
            )
          case "table":
            return (
              <View key={i} style={styles.table}>
                {block.rows.map((row, r) => (
                  <View key={r} style={[styles.tableRow, r > 0 ? styles.rowDivider : null]}>
                    {row.map((cell, c) => (
                      <ThemedText key={c} variant={r === 0 ? "headline" : "subhead"} style={styles.cell}>{inline(cell, styles)}</ThemedText>
                    ))}
                  </View>
                ))}
              </View>
            )
        }
      })}
    </View>
  )
}

const useStyles = makeStyles((colors) => ({
  document: { gap: spacing.md },
  heading: { marginTop: spacing.sm },
  bold: { fontWeight: "600" },
  code: { fontFamily: MONO },
  list: { gap: spacing.xs },
  item: { flexDirection: "row", gap: spacing.sm },
  itemText: { flex: 1 },
  table: { backgroundColor: colors.surface, borderRadius: radius.md, borderCurve: "continuous", overflow: "hidden" },
  tableRow: { flexDirection: "row", gap: spacing.sm, padding: spacing.sm },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator },
  cell: { flex: 1 },
}))
