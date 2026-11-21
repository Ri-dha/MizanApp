# T-any-base-currency — Any main currency, country at sign-up, followed rates
- Status: done (2026-11-21, c6df925 on develop and main)
- Context: user request 2026-11-21; base change re-expresses everything at the day's rate (user's choice). Server and ADR currency-1 in Ri-dha/mizan.
- Notes: `market/currency.ts` (catalogue, perUsd table, `marketFxRateMicros`, `inBase`, `trackedCurrencies`); `ResolvedPrices`
  gains `base`, `perUsd`, `usdBaseMicros`; `minorUnitsPerMajor` follows Intl (dinar whole); `rateToMicros` takes the base;
  `db/rebase.ts` converts records in one local transaction with a retry marker; write listeners now fire after the
  transaction (a loop of writes in one transaction ended it early). Web: sign-up country and currency, Settings card,
  `CurrencySelect` in every money form with today's rate, assets at today's rate, Iraq-only screens behind `useIraqi`,
  followed currencies on Prices and home, and a per-device "show amounts in" switch applied in `app/money.ts`
  (rates from `DisplayRatesSync`, a badge in the shell turns it off). Phone (`feat/mobile-any-currency`): the same screens. A searchable `CurrencyField`/`CountryField`
  (`components/currency-field.tsx`) in sign-up and every money editor, which prefill today's rate (`useTodayRate`);
  Settings "Country and currency" with the owner's change (native confirm) and the device's "show amounts in";
  `utils/display-rates.ts` + `utils/money.ts` with a badge on Home; Iraq-only gating via `useIraqi`; a followed-rates
  home card and `screens/prices/world-rates.tsx`. Hermes has no `Intl.DisplayNames`, so country and currency names
  are bundled by `scripts/bundle-names.mjs`. The navigator remounts when the display currency or digits change, so
  open screens redraw. After each sync the phone refreshes world rates and finishes or claims a pending rebase.
