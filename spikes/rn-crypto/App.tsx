import { useEffect, useState } from "react"
import { Platform, ScrollView, StyleSheet, Text } from "react-native"
import { StatusBar } from "expo-status-bar"
import { runAll } from "./harness/cases.ts"
import type { Fixtures } from "./harness/cases.ts"

const HOST = "http://localhost:8787"

export default function App() {
  const [lines, setLines] = useState<string[]>(["fetching fixtures…"])
  const log = (line: string) => setLines((all) => [...all, line])

  useEffect(() => {
    (async () => {
      try {
        const fixtures: Fixtures = await (await fetch(`${HOST}/fixtures`)).json()
        const results = await runAll(fixtures, (name, r) => log(`${r.error ? "ERR" : "ran"} ${name} ${r.ms} ms${r.error ? ` ${r.error}` : ""}`))
        const outcome = await (await fetch(`${HOST}/results`, {
          method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ platform: Platform.OS, results }),
        })).json()
        log(`VERDICT ${outcome.summary}`)
      } catch (e) {
        log(`FAILED ${e instanceof Error ? e.message : String(e)}`)
      }
    })()
  }, [])

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <StatusBar style="auto" />
      {lines.map((line, i) => <Text key={i} style={styles.line}>{line}</Text>)}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  page: { padding: 16, paddingTop: 64 },
  line: { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 11, marginBottom: 4 },
})
