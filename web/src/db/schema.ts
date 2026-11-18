import Dexie, { type EntityTable } from "dexie"
import type {
  AnnualReport, Asset, AssetValuation, Attachment, Bucket, BucketMove, CashAccount, CashAdjustment, Debt, DebtPayment, ExpenseOccurrence, Goal, GoalDeposit, IncomeReceipt, IncomeSource, IncomeSourceAmount, LedgerTransaction, LocalBlob, LocalConflict, MarketOverride, MarketSetting, MemberContribution, MetaEntry, MetalDisposal, MetalDisposalLot, MetalLot, MonthClose, NetWorthSnapshot, NotificationSetting, OutboxOp, Plan, PrivacySetting, RecurringExpense, SealedRecord, SyncTableName, Syncable,
} from "@mizan/core/schema"
import { SYNC_TABLES } from "@mizan/core/schema"

export * from "@mizan/core/schema"

export class MizanDatabase extends Dexie {
  cashAccounts!: EntityTable<CashAccount, "id">
  incomeSources!: EntityTable<IncomeSource, "id">
  incomeSourceAmounts!: EntityTable<IncomeSourceAmount, "id">
  incomeReceipts!: EntityTable<IncomeReceipt, "id">
  plans!: EntityTable<Plan, "id">
  buckets!: EntityTable<Bucket, "id">
  recurringExpenses!: EntityTable<RecurringExpense, "id">
  expenseOccurrences!: EntityTable<ExpenseOccurrence, "id">
  transactions!: EntityTable<LedgerTransaction, "id">
  attachments!: EntityTable<Attachment, "id">
  blobs!: EntityTable<LocalBlob, "id">
  debts!: EntityTable<Debt, "id">
  debtPayments!: EntityTable<DebtPayment, "id">
  goals!: EntityTable<Goal, "id">
  goalDeposits!: EntityTable<GoalDeposit, "id">
  metalLots!: EntityTable<MetalLot, "id">
  metalDisposals!: EntityTable<MetalDisposal, "id">
  metalDisposalLots!: EntityTable<MetalDisposalLot, "id">
  marketOverrides!: EntityTable<MarketOverride, "id">
  marketSettings!: EntityTable<MarketSetting, "id">
  cashAdjustments!: EntityTable<CashAdjustment, "id">
  netWorthSnapshots!: EntityTable<NetWorthSnapshot, "id">
  monthCloses!: EntityTable<MonthClose, "id">
  assets!: EntityTable<Asset, "id">
  assetValuations!: EntityTable<AssetValuation, "id">
  bucketMoves!: EntityTable<BucketMove, "id">
  privacySettings!: EntityTable<PrivacySetting, "id">
  notificationSettings!: EntityTable<NotificationSetting, "id">
  memberContributions!: EntityTable<MemberContribution, "id">
  annualReports!: EntityTable<AnnualReport, "id">
  sealedInbox!: EntityTable<SealedRecord, "key">
  outbox!: EntityTable<OutboxOp, "opId">
  conflicts!: EntityTable<LocalConflict, "id">
  meta!: EntityTable<MetaEntry, "key">

  constructor(name = "mizan") {
    super(name)
    this.version(1).stores({
      cashAccounts: "id, deletedAt, sortOrder, currency",
      outbox: "opId, createdAt, rowId",
      conflicts: "id, detectedAt, dismissed",
      meta: "key",
    })
    this.version(2).stores({
      incomeSources: "id, deletedAt, sortOrder",
      incomeReceipts: "id, deletedAt, monthKey, incomeSourceId",
      plans: "id, deletedAt, effectiveFrom",
      buckets: "id, deletedAt, planId, sortOrder",
    })
    this.version(3).stores({
      recurringExpenses: "id, deletedAt, sortOrder",
      expenseOccurrences: "id, deletedAt, monthKey, recurringExpenseId, [recurringExpenseId+dueDate]",
      transactions: "id, deletedAt, monthKey, occurredOn, bucketId, type, [monthKey+bucketId]",
      attachments: "id, deletedAt, ownerRecordId",
      blobs: "id, uploaded",
      debts: "id, deletedAt, status",
      debtPayments: "id, deletedAt, debtId, monthKey",
      goals: "id, deletedAt, status, sortOrder",
      goalDeposits: "id, deletedAt, goalId, monthKey",
    })
    this.version(4).stores({
      metalLots: "id, deletedAt, metal, purchaseDate",
      metalDisposals: "id, deletedAt, metal, soldOn",
      metalDisposalLots: "id, deletedAt, disposalId, lotId",
      marketOverrides: "id, deletedAt, instrument, effectiveFrom",
      marketSettings: "id, deletedAt",
    })
    this.version(5).stores({
      incomeSourceAmounts: "id, deletedAt, incomeSourceId, effectiveFrom",
    })
    this.version(6).stores({
      cashAdjustments: "id, deletedAt, cashAccountId, adjustedOn",
      netWorthSnapshots: "id, deletedAt, monthKey, takenAt",
      monthCloses: "id, deletedAt, monthKey",
    })
    this.version(7).stores({
      assets: "id, deletedAt, type, status, sortOrder",
      assetValuations: "id, deletedAt, assetId, valuedOn",
    })
    this.version(8).stores({
      bucketMoves: "id, deletedAt, monthKey",
    })
    this.version(9).stores({
      privacySettings: "id, deletedAt",
    })
    this.version(10).stores({
      notificationSettings: "id, deletedAt",
    })
    this.version(11).stores({
      transactions: "id, deletedAt, monthKey, occurredOn, bucketId, type, [monthKey+bucketId], splitGroupId, assetId",
    })
    this.version(12).stores({
      memberContributions: "id, deletedAt, memberId",
      annualReports: "id, deletedAt, year",
      sealedInbox: "key",
    })
  }
}

export const db = new MizanDatabase()

export function localTableFor(table: SyncTableName) {
  return db.table<Syncable, string>(SYNC_TABLES[table])
}
