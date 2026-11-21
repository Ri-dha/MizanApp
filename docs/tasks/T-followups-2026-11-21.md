# T-followups-2026-11-21 — Debt accounts, card name, report photo display, instant sync (clients)
- Status: done (0806f2a)
- Context: user request 2026-11-21 (plan "five follow-ups"); server half in Ri-dha/mizan (same task id,
  ADR sync-4, ADR support-2). ADR cash-2 here.
- Notes:
  - T-debt-accounts: `Debt.cashAccountId`; `recordPayment(..., cashAccountId)`; `movementsOf` takes debts
    (kind DEBT). `AccountPicker` and `lastAccount.ts` shared with Quick add. Manual 07-debts.
  - Card template `homeLayout.kinds.dollar` is now "Exchange rates" / "أسعار الصرف".
  - Report photos: `ReportImage` shows a placeholder when `removedAt` is set. Manual 22-support.
  - T-instant-sync: `packages/core/src/sync/watch.ts` long-polls `/api/v1/sync/wait` while the lifecycle
    reports the app in the foreground (`PlatformLifecycle.isForeground`); the 5-minute sync stays as a fallback.
  - Verified in the browser: lend from Wallet −200,000, repayment into Bank +50,000, net worth unchanged;
    a pending wait answered about 1 s after a change.
  - Phone screens for debt accounts still to do (brief sent to the phone session).
