import { router, Stack } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { DEFAULT_SETTING, saveSetting } from "@mizan/core/market/prices"
import type { DisposalMethod, Metal, PriceSource, RateKind, ValuationBasis } from "@mizan/core/schema"
import { Button } from "@/components/button"
import { Chips } from "@/components/chips"
import { Screen } from "@/components/screen"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { ToggleRow } from "@/components/toggle-row"
import { useMetals } from "@/hooks/use-views"
import { spacing } from "@/theme"
import { useSession } from "@/hooks/use-core"

const METHODS: DisposalMethod[] = ["FIFO", "SPECIFIC", "WEIGHTED_AVERAGE"]
const RATE_KINDS: RateKind[] = ["PARALLEL", "OFFICIAL"]
const PRICE_SOURCES: PriceSource[] = ["WORLD", "LOCAL"]
const METALS: Metal[] = ["GOLD", "SILVER"]
const BASIS_POINTS_PER_PERCENT = 100

type PerMetal<T> = Record<Metal, T>
const percentOf = (basisPoints: number | undefined) => String((basisPoints ?? 0) / BASIS_POINTS_PER_PERCENT)
const basisPointsOf = (percent: string) => Math.round(Number(percent || "0") * BASIS_POINTS_PER_PERCENT)

export function MarketSettings() {
  const { t } = useTranslation()
  const { setting } = useMetals()
  const [rateKind, setRateKind] = useState<RateKind>(DEFAULT_SETTING.rateKind)
  const [priceSource, setPriceSource] = useState<PriceSource>("WORLD")
  const [premium, setPremium] = useState<PerMetal<string>>({ GOLD: "0", SILVER: "0" })
  const [method, setMethod] = useState<PerMetal<DisposalMethod>>({ GOLD: "FIFO", SILVER: "FIFO" })
  const [basis, setBasis] = useState<ValuationBasis>("MARKET")
  const [buyback, setBuyback] = useState<PerMetal<string>>({ GOLD: "0", SILVER: "0" })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (loaded || !setting) return
    setRateKind(setting.rateKind)
    setPriceSource(setting.priceSource ?? "WORLD")
    setPremium({ GOLD: percentOf(setting.goldPremiumBasisPoints), SILVER: percentOf(setting.silverPremiumBasisPoints) })
    setMethod({ GOLD: setting.goldMethod, SILVER: setting.silverMethod })
    setBasis(setting.valuationBasis ?? "MARKET")
    setBuyback({ GOLD: percentOf(setting.goldBuybackBasisPoints), SILVER: percentOf(setting.silverBuybackBasisPoints) })
    setLoaded(true)
  }, [setting, loaded])

  async function save() {
    await saveSetting({
      rateKind,
      goldPremiumBasisPoints: basisPointsOf(premium.GOLD),
      silverPremiumBasisPoints: basisPointsOf(premium.SILVER),
      goldMethod: method.GOLD,
      silverMethod: method.SILVER,
      valuationBasis: basis,
      priceSource,
      goldBuybackBasisPoints: basisPointsOf(buyback.GOLD),
      silverBuybackBasisPoints: basisPointsOf(buyback.SILVER),
    })
    router.back()
  }

  const name = (metal: Metal) => t(`metals.metal.${metal}`)
  const dinar = (useSession()?.baseCurrency ?? "IQD") === "IQD"
  return (
    <Screen sheet>
      <Stack.Screen options={{ title: t("metals.settings"), headerRight: () => <Button testID="save-market-settings" variant="ghost" title={t("accounts.save")} onPress={() => void save()} /> }} />
      {/* The dollar kind and the Baghdad dealer only mean something to a household counting in dinars. */}
      {dinar ? (
        <>
          <View style={styles.field}>
            <ThemedText variant="subhead">{t("metals.rateKind")}</ThemedText>
            <Chips options={RATE_KINDS.map((k) => ({ value: k, label: t(`metals.rateKinds.${k}`) }))} value={rateKind} onChange={(next) => next && setRateKind(next as RateKind)} />
            <ThemedText variant="caption">{t("metals.rateKindHint")}</ThemedText>
          </View>
          <View style={styles.field}>
            <ThemedText variant="subhead">{t("metals.priceSource")}</ThemedText>
            <Chips options={PRICE_SOURCES.map((k) => ({ value: k, label: t(`metals.priceSources.${k}`) }))} value={priceSource} onChange={(next) => next && setPriceSource(next as PriceSource)} />
            <ThemedText variant="caption">{t("metals.priceSourceHint")}</ThemedText>
          </View>
        </>
      ) : null}
      <View style={styles.pair}>
        {METALS.map((metal) => (
          <View key={metal} style={styles.half}>
            <TextField testID={`premium-${metal}`} label={t("metals.premium", { metal: name(metal) })} keyboardType="decimal-pad" value={premium[metal]} onChangeText={(v) => setPremium({ ...premium, [metal]: v })} />
          </View>
        ))}
      </View>
      <ThemedText variant="caption">{t("metals.premiumHint")}</ThemedText>
      {METALS.map((metal) => (
        <View key={metal} style={styles.field}>
          <ThemedText variant="subhead">{t("metals.defaultMethod", { metal: name(metal) })}</ThemedText>
          <Chips options={METHODS.map((m) => ({ value: m, label: t(`metals.methods.${m}`) }))} value={method[metal]} onChange={(next) => next && setMethod({ ...method, [metal]: next as DisposalMethod })} />
        </View>
      ))}
      <ThemedText variant="caption">{t("metals.methodLocked")}</ThemedText>
      <ToggleRow label={t("metals.buybackBasis")} value={basis === "BUYBACK"} onChange={(on) => setBasis(on ? "BUYBACK" : "MARKET")} />
      <View style={styles.pair}>
        {METALS.map((metal) => (
          <View key={metal} style={styles.half}>
            <TextField label={t("metals.buybackSpread", { metal: name(metal) })} keyboardType="decimal-pad" value={buyback[metal]} onChangeText={(v) => setBuyback({ ...buyback, [metal]: v })} />
          </View>
        ))}
      </View>
      <ThemedText variant="caption">{t("metals.buybackHint")}</ThemedText>
    </Screen>
  )
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  pair: { flexDirection: "row", gap: spacing.md, alignItems: "flex-end" },
  half: { flex: 1 },
})
