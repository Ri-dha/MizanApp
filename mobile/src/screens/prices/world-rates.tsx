import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, StyleSheet, View } from "react-native"

import { updateProfile } from "@mizan/core/auth/profile"
import { trackedCurrencies, unitRate } from "@mizan/core/market/currency"
import { Button } from "@/components/button"
import { LineChart } from "@/components/charts/line-chart"
import { CurrencyField } from "@/components/currency-field"
import { Notice } from "@/components/notice"
import { Group, Row } from "@/components/row"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { useSession } from "@/hooks/use-core"
import { useCurrencyName } from "@/hooks/use-currency"
import { useWorldHistory, useWorldRates } from "@/hooks/use-market"
import { useMetals } from "@/hooks/use-views"
import { spacing, useBrandColors } from "@/theme"
import { DATE, formatCount, formatWhen } from "@/utils/dates"
import { describeError } from "@/utils/errors"

/** Rates run from 0.0003 dinars (the rial) to 4,800 (the Kuwaiti dinar): keep four significant digits below one. */
function rateOptions(value: number): Intl.NumberFormatOptions {
  if (value >= 100) return { maximumFractionDigits: 0 }
  if (value >= 1) return { maximumFractionDigits: 2 }
  return { maximumSignificantDigits: 4 }
}

/** The chart's axis stays in plain digits, like every chart in the app. */
const axisRate = (value: number) => new Intl.NumberFormat("en", rateOptions(value)).format(value)

/** T-world-rates: a converter, the currencies a person follows in the household's currency, and a year's chart for each. */
export function WorldRates() {
  const { t, i18n } = useTranslation()
  const brand = useBrandColors()
  const session = useSession()
  const world = useWorldRates()
  const { prices } = useMetals()
  const names = useCurrencyName()
  const base = session?.baseCurrency ?? "IQD"
  const followed = useMemo(() => trackedCurrencies(session), [session])
  const [amount, setAmount] = useState("100")
  const [from, setFrom] = useState<string | null>(null)
  const [to, setTo] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [showAll, setShowAll] = useState(false)
  const [picked, setPicked] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const locale = i18n.language
  const perUsd = prices.perUsd
  const codes = useMemo(() => Object.keys(perUsd), [perUsd])
  const fromCode = from ?? followed[0] ?? "USD"
  const toCode = to ?? base
  const charted = picked ?? followed.find((c) => c !== "USD") ?? "EUR"
  const history = useWorldHistory(charted === "USD" ? "EUR" : charted)
  const rate = (value: number) => formatCount(value, locale, rateOptions(value))
  const latestDay = world?.rates.reduce((latest, r) => (r.day > latest ? r.day : latest), "")

  const typed = Number(amount.replace(/[^\d.]/g, ""))
  const factor = unitRate(fromCode, toCode, perUsd)
  const result = Number.isFinite(typed) && factor !== null ? typed * factor : null

  const listed = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    const all = codes.filter((c) => c !== base)
    const matches = needle
      ? all.filter((c) => c.toLowerCase().includes(needle) || names(c).toLocaleLowerCase().includes(needle))
      : showAll ? all : followed.filter((c) => perUsd[c])
    const rank = (code: string) => {
      const at = followed.indexOf(code)
      return at === -1 ? followed.length : at
    }
    return [...matches].sort((a, b) => rank(a) - rank(b) || names(a).localeCompare(names(b), locale))
  }, [codes, base, query, showAll, followed, perUsd, names, locale])

  async function toggleFollow(code: string) {
    const next = followed.includes(code) ? followed.filter((c) => c !== code) : [...followed, code]
    setSaving(true)
    setError(null)
    try {
      await updateProfile({ trackedCurrencies: next })
    } catch (e) {
      setError(describeError(e))
    } finally {
      setSaving(false)
    }
  }

  function pick(code: string) {
    setPicked(code)
    setFrom(code)
    setTo(base)
  }

  if (!world || world.rates.length === 0) {
    return (
      <View style={styles.section}>
        <ThemedText variant="headline">{t("worldRates.title")}</ThemedText>
        <ThemedText variant="subhead">{t("worldRates.none")}</ThemedText>
      </View>
    )
  }

  const dinarNote = base === "IQD" || toCode === "IQD" || fromCode === "IQD"
  const dinar = prices.usdIqdMicros > 0
    ? t(prices.rateKind === "OFFICIAL" ? "worldRates.dinarOfficial" : "worldRates.dinarMarket", { rate: formatCount(prices.usdIqdMicros / 1e6, locale, { maximumFractionDigits: 0 }) })
    : t("worldRates.noDinar")

  return (
    <View style={styles.section}>
      <ThemedText variant="headline">{t("worldRates.title")}</ThemedText>
      <ThemedText variant="caption">{`${t("worldRates.body", { count: codes.length })}${dinarNote ? ` ${dinar}` : ""}`}</ThemedText>
      {error ? <Notice tone="error">{error}</Notice> : null}

      <ThemedText variant="subhead">{t("worldRates.convert")}</ThemedText>
      <TextField testID="world-amount" label={t("worldRates.amount")} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
      <View style={styles.pair}>
        <View style={styles.half}><CurrencyField testID="world-from" label={t("worldRates.from")} value={fromCode} onChange={setFrom} codes={codes} /></View>
        <Button testID="world-swap" variant="ghost" title="⇄" accessibilityLabel={t("worldRates.swap")} onPress={() => { setFrom(toCode); setTo(fromCode) }} style={styles.swap} />
        <View style={styles.half}><CurrencyField testID="world-to" label={t("worldRates.to")} value={toCode} onChange={setTo} codes={codes} /></View>
      </View>
      <ThemedText testID="world-result" variant="title">{result === null ? "—" : `${formatCount(typed, locale, { maximumFractionDigits: 2 })} ${fromCode} = ${rate(result)} ${toCode}`}</ThemedText>
      {latestDay ? <ThemedText variant="caption">{`${t("worldRates.asOf", { day: formatWhen(latestDay, locale, DATE) })} ${t("metals.dataCredit", { name: "Frankfurter" })}`}</ThemedText> : null}

      {charted !== "USD" ? (
        <View style={styles.section}>
          <ThemedText variant="subhead">{t("worldRates.chartTitle", { currency: `${charted} · ${names(charted)}` })}</ThemedText>
          {history.points.length < 2 ? (
            <ThemedText variant="caption">{history.loading ? t("common.loading") : t("prices.notEnough")}</ThemedText>
          ) : (
            <LineChart
              testID="world-chart"
              formatY={axisRate}
              labels={history.points.map((p) => formatWhen(p.day, locale, { month: "short", year: "2-digit" }))}
              series={[{ key: "perUsd", label: t("worldRates.perUsd", { currency: charted }), colour: brand.chart[1], values: history.points.map((p) => p.perUsd) }]}
            />
          )}
        </View>
      ) : null}

      <ThemedText variant="subhead">{query || showAll ? t("worldRates.allTitle") : t("worldRates.followedTitle")}</ThemedText>
      <ThemedText variant="caption">{t("worldRates.followHint")}</ThemedText>
      <TextField testID="world-search" label={t("worldRates.search")} value={query} onChangeText={setQuery} autoCorrect={false} autoCapitalize="none" />
      {listed.length === 0 ? (
        <ThemedText variant="subhead">{query ? t("worldRates.noMatch") : t("worldRates.noneFollowed")}</ThemedText>
      ) : (
        <Group>
          {listed.map((code, index) => {
            const inBase = unitRate(code, base, perUsd)
            const following = followed.includes(code)
            return (
              <Row
                key={code}
                testID={`world-${code}`}
                last={index === listed.length - 1}
                trailing={
                  <View style={styles.figures}>
                    <ThemedText>{inBase === null ? "—" : `${rate(inBase)} ${base}`}</ThemedText>
                    <ThemedText variant="caption">{`${rate(perUsd[code])} ${t("worldRates.perDollar")}`}</ThemedText>
                  </View>
                }
              >
                <View style={styles.currency}>
                  <Pressable
                    testID={`world-follow-${code}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: following, disabled: saving }}
                    accessibilityLabel={following ? t("worldRates.unfollow", { currency: code }) : t("worldRates.followOne", { currency: code })}
                    disabled={saving}
                    hitSlop={spacing.sm}
                    onPress={() => void toggleFollow(code)}
                  >
                    <ThemedText style={{ color: following ? brand.chart[2] : undefined }}>{following ? "★" : "☆"}</ThemedText>
                  </Pressable>
                  <Pressable testID={`world-pick-${code}`} accessibilityRole="button" onPress={() => pick(code)} style={styles.name}>
                    <ThemedText style={charted === code ? styles.chosen : null}>{code}</ThemedText>
                    <ThemedText variant="caption" numberOfLines={1}>{names(code)}</ThemedText>
                  </Pressable>
                </View>
              </Row>
            )
          })}
        </Group>
      )}
      {!query ? (
        <Button testID="world-show-all" variant="ghost" title={showAll ? t("worldRates.showFollowed") : t("worldRates.showAll", { count: codes.length - 1 })} onPress={() => setShowAll((v) => !v)} style={styles.more} />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  pair: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm },
  half: { flex: 1 },
  swap: { paddingHorizontal: spacing.sm },
  figures: { alignItems: "flex-end" },
  currency: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  name: { flex: 1 },
  chosen: { fontWeight: "600" },
  more: { alignSelf: "flex-start" },
})
