import { gunzipSync, gzipSync } from "fflate"
import { useCallback, useState } from "react"
import { FlatList, StyleSheet, Text, View } from "react-native"

import { vaultVectorChecks } from "@mizan/core/vault/vectors"
import { Button } from "@/components/button"
import { ThemedText } from "@/components/themed-text"
import { usePlatformInfo } from "@/platform/context"
import { colors, spacing, type, useBrandColors } from "@/theme"

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

  const brand = useBrandColors()
  const failed = outcomes.filter((o) => o.error).length
  return (
    <FlatList
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.page}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText testID="cipher-version" variant="subhead">SQLCipher {cipherVersion}</ThemedText>
            <Button testID="run-vectors" title="Run vault vectors" loading={running} onPress={run} />
            {outcomes.length > 0 && !running ? (
              <ThemedText testID="vector-summary" variant="headline">{`${outcomes.length - failed} passed, ${failed} failed`}</ThemedText>
            ) : null}
          </View>
        }
        data={outcomes}
        keyExtractor={(item) => item.label}
        renderItem={({ item }) => (
          <Text style={[styles.line, { color: item.error ? brand.destructive : colors.label }]}>{`${item.error ? "FAIL" : "ok"}  ${item.label}  ${item.ms} ms${item.error ? `\n${item.error}` : ""}`}</Text>
        )}
      />
  )
}

const styles = StyleSheet.create({
  page: { padding: spacing.md, backgroundColor: colors.background },
  header: { gap: spacing.md, marginBottom: spacing.md },
  line: { ...type.log, marginBottom: spacing.xs },
})
