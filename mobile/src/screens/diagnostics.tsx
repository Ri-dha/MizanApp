import { gunzipSync, gzipSync } from "fflate"
import { useCallback, useState } from "react"
import { Button, FlatList, StyleSheet, Text, View } from "react-native"

import { vaultVectorChecks } from "@mizan/core/vault/vectors"
import { usePlatformInfo } from "@/platform/context"

interface Outcome {
  label: string
  ms: number
  error: string | null
}

const fflate = { gzip: (bytes: Uint8Array) => gzipSync(bytes), gunzip: (bytes: Uint8Array) => gunzipSync(bytes) }

/** Runs the shared vault vectors on this device's crypto (ADR mobile-1): every one must pass before the app writes a record. */
export function Diagnostics() {
  const { cipherVersion } = usePlatformInfo()
  const [outcomes, setOutcomes] = useState<Outcome[]>([])
  const [running, setRunning] = useState(false)

  const run = useCallback(async () => {
    setRunning(true)
    const results: Outcome[] = []
    for (const check of vaultVectorChecks(fflate)) {
      const start = Date.now()
      let error: string | null = null
      try {
        await check.run()
      } catch (e) {
        error = e instanceof Error ? e.message : String(e)
      }
      results.push({ label: `${check.file}: ${check.name}`, ms: Date.now() - start, error })
      setOutcomes([...results])
    }
    setRunning(false)
  }, [])

  const failed = outcomes.filter((o) => o.error).length
  return (
    <FlatList
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.page}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text testID="cipher-version">SQLCipher {cipherVersion}</Text>
            <Button testID="run-vectors" title={running ? "Running…" : "Run vault vectors"} onPress={run} disabled={running} />
            {outcomes.length > 0 && !running ? (
              <Text testID="vector-summary" style={styles.summary}>{`${outcomes.length - failed} passed, ${failed} failed`}</Text>
            ) : null}
          </View>
        }
        data={outcomes}
        keyExtractor={(item) => item.label}
        renderItem={({ item }) => (
          <Text style={[styles.line, item.error ? styles.fail : null]}>{`${item.error ? "FAIL" : "ok"}  ${item.label}  ${item.ms} ms${item.error ? `\n${item.error}` : ""}`}</Text>
        )}
      />
  )
}

const styles = StyleSheet.create({
  page: { padding: 16 },
  header: { gap: 12, marginBottom: 12 },
  summary: { fontWeight: "600" },
  line: { fontSize: 11, fontFamily: "Menlo", marginBottom: 4 },
  fail: { color: "#c0392b" },
})
