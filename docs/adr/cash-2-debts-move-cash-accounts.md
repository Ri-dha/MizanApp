# ADR cash-2 — Debts move cash accounts

- Date: 2026-11-21
- Status: accepted
- Task: T-followups-2026-11-21

## Context
ADR cash-1 left debts out: lending 200,000 from a wallet raised net worth by the amount owed to
you while the wallet kept its old balance, and a repayment arrived nowhere. The person chose that
both the loan itself and each payment move an account.

## Decision
- A debt can carry `cashAccountId`, the account the borrowed money went into or the lent money
  came from. Borrowing (OWING) adds the principal to that account; lending (OWED) takes it out.
- A debt payment passes its account to the TRANSFER transaction it already creates
  (`counterpartyType` DEBT). Paying what you owe takes money out; a repayment to you puts it in.
- Both follow ADR cash-1: they count when their link field clock is later than the account's
  balance clock, amounts in another currency count at today's rate, and the link is written only
  when it changes.

## Consequences
Recording a debt with an account leaves net worth unchanged, as it should. Debts recorded before
this have no account and move nothing. Goal deposits still do not move balances.
