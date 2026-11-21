# T-any-base-currency — Any main currency, country at sign-up, followed rates
- Status: in review
- Context: user request 2026-11-21; base change re-expresses everything at the day's rate (user's choice). Server and ADR currency-1 in Ri-dha/mizan.
- Notes: `market/currency.ts` (catalogue, perUsd table, `marketFxRateMicros`, `inBase`, `trackedCurrencies`); `ResolvedPrices`
  gains `base`, `perUsd`, `usdBaseMicros`; `minorUnitsPerMajor` follows Intl (dinar whole); `rateToMicros` takes the base;
  `db/rebase.ts` converts records in one local transaction with a retry marker; write listeners now fire after the
  transaction (a loop of writes in one transaction ended it early). Web: sign-up country and currency, Settings card,
  `CurrencySelect` in every money form with today's rate, assets at today's rate, Iraq-only screens behind `useIraqi`,
  followed currencies on Prices and home, and a per-device "show amounts in" switch applied in `app/money.ts`
  (rates from `DisplayRatesSync`, a badge in the shell turns it off). Phone: rate helpers and conversions fixed; its screens still offer IQD/USD only.
