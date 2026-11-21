# T-phone-parity — Bring the phone level with the web
- Status: done (2026-11-22, merged to develop and main at 23e2cde plus the fixes below)
- Context: request from the mizan session 2026-11-21; ADR cash-1, cash-2, home-1; T-cash-movements, T-home-templates.
- Notes: shared pieces moved to core `db/accountChoice.ts` (`NO_ACCOUNT`, `pickedAccount`, share rows,
  `nextShareRow`); the web imports them from there. Phone: `AccountField` on the shared `PickerField`,
  last account in the kv store, `useCashAccountsWithMovements`. Added "Paid from / Into" on transactions and
  paid bills, account transfers (`/account-transfer`, ledger rows "From → To"), "since you last set it" on Cash,
  income splits on sources and receipts (written only when changed), debt and payment accounts, the Home card
  editor (add from template, rename, pick, remove), and the removed-photo placeholder. Goals "Already saved"
  and instant sync were already on the phone. Checked on the simulator with the demo owner against the web: a transfer moves both balances, shows as
  "From → To" in the ledger and opens its editor (also one made on the web); an income split of 60 % and a
  fixed amount lands in both accounts, blocks Save when over-assigned and reloads on edit; a debt payment
  from an account moves it and the account is remembered; a web change reached the phone within 3 s.
  Then also checked: a bill's Paid from, an exchange between currencies with the amount received, picks on
  Home cards, and the removed-photo placeholder. Two fixes came out of that: the bill-paid sheet opens at
  60 % or full height (fitting to content measured it before the accounts loaded and hid Paid from), and
  editing an exchange shows the amount that arrived instead of an empty field (phone and web).
