# ADR cash-1 — Cash balances follow linked income and spending

- Date: 2026-11-21
- Status: accepted
- Task: T-cash-movements

## Context
Cash balances were numbers people typed, so a received salary or a purchase did not change net
worth until the person also edited the account. Records sync between devices with per-field
last-write-wins, so adding to the stored balance from two devices at once would lose one of the
two changes.

## Decision
- An income receipt can carry `intoAccounts`: shares of the payment, each a fixed amount (minor
  units of the payment's currency) or a percentage (basis points). An income source can carry the
  usual split, which fills in each receipt. Shares may not add up to more than the payment; what
  is left goes into no account.
- An expense or income transaction can carry `cashAccountId`; a paid bill passes its account to
  the transaction it creates. Transfers do not move balances.
- The stored balance is never rewritten by these. An account's balance is the balance last set
  plus the linked records whose link field was written after the balance field (comparing the
  hybrid logical clocks the fields already carry). Setting a balance by hand takes everything
  before it in. Shares in another currency count at today's rate.
- A transfer between accounts is a TRANSFER transaction with no bucket: `cashAccountId` is the
  source, `counterpartyId` (CASH_ACCOUNT) the destination, and `counterAmount` what arrived when
  the currencies differ (the rate actually received). It moves both balances and nothing else.
- A record's link is written only when it changes, so editing an old record after a balance was
  set does not count it again.

## Consequences
Net worth, Home and the Cash screen move with recorded income and spending, and the Cash screen
says what moved an account since it was last set. Debt payments and goal deposits do not move
balances yet. Changing a share after setting a balance counts that share again, by design.
