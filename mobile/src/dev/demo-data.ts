import { addValuation, createAsset } from "@mizan/core/db/assets"
import { createCashAccount } from "@mizan/core/db/cashAccounts"
import { createDebt } from "@mizan/core/db/debts"
import { createRecurringExpense } from "@mizan/core/db/expenses"
import { createGoal, recordDeposit } from "@mizan/core/db/goals"
import { createIncomeSource, RATE_SCALE, recordReceipt } from "@mizan/core/db/income"
import { createLot } from "@mizan/core/db/metals"
import { liveBucketsOf, saveBuckets } from "@mizan/core/db/plan"
import { createTransaction } from "@mizan/core/db/transactions"
import { table } from "@mizan/core/store/store"
import { monthKeyFor } from "@mizan/core/domain/calendar/month"
import { PURITIES, toMilligrams } from "@mizan/core/domain/metal/valuation"

/** Store screenshots need a believable household; this writes one through the same functions the screens use. */
type Language = "en" | "ar"

const NAMES = {
  en: {
    essentials: "Essentials", family: "Family", savings: "Savings", freedom: "Guilt-free",
    salary: "Salary", wallet: "Wallet", bank: "Rafidain Bank", home: "Cash at home",
    rent: "Rent", generator: "Generator", internet: "Internet", school: "School fees",
    car: "Car", hajj: "Hajj", emergency: "Emergency fund", loan: "Car loan", lender: "Rafidain Bank",
    payees: ["Grocery store", "Bakery", "Pharmacy", "Fuel", "Restaurant", "Clothes", "Butcher", "Taxi"],
    categories: ["Groceries", "Groceries", "Health", "Transport", "Eating out", "Clothes", "Groceries", "Transport"],
  },
  ar: {
    essentials: "الأساسيات", family: "العائلة", savings: "الادخار", freedom: "مصروف حر",
    salary: "الراتب", wallet: "المحفظة", bank: "مصرف الرافدين", home: "نقد في البيت",
    rent: "الإيجار", generator: "المولّدة", internet: "الإنترنت", school: "أقساط المدرسة",
    car: "السيارة", hajj: "الحج", emergency: "صندوق الطوارئ", loan: "قرض السيارة", lender: "مصرف الرافدين",
    payees: ["البقالة", "المخبز", "الصيدلية", "البنزين", "مطعم", "ملابس", "القصاب", "تكسي"],
    categories: ["بقالة", "بقالة", "صحة", "نقل", "مطاعم", "ملابس", "بقالة", "نقل"],
  },
} as const

const SPENDING = [
  { day: 2, payee: 0, amount: 85_000, bucket: "essentials" },
  { day: 3, payee: 1, amount: 6_000, bucket: "essentials" },
  { day: 5, payee: 3, amount: 40_000, bucket: "essentials" },
  { day: 6, payee: 4, amount: 55_000, bucket: "freedom" },
  { day: 8, payee: 2, amount: 22_000, bucket: "family" },
  { day: 9, payee: 6, amount: 48_000, bucket: "essentials" },
  { day: 11, payee: 5, amount: 120_000, bucket: "family" },
  { day: 12, payee: 0, amount: 92_000, bucket: "essentials" },
  { day: 14, payee: 7, amount: 8_000, bucket: "freedom" },
  { day: 15, payee: 3, amount: 40_000, bucket: "essentials" },
  { day: 17, payee: 4, amount: 35_000, bucket: "freedom" },
  { day: 18, payee: 1, amount: 5_000, bucket: "essentials" },
] as const

const IQD = "IQD"
const shared = { currency: IQD, fxRateMicros: RATE_SCALE, visibility: "SHARED" as const }
const sharedWithoutRate = { currency: IQD, visibility: "SHARED" as const }

function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

export async function loadDemoData(language: Language, startDay: number, today = new Date()) {
  const n = NAMES[language]
  const year = today.getFullYear()
  const month = today.getMonth() + 1
  const todayIso = isoDate(year, month, today.getDate())
  const monthKey = monthKeyFor(todayIso, startDay)
  const firstOfMonth = isoDate(year, month, 1)

  const planId = await saveBuckets(monthKey, [
    { name: n.essentials, colour: "#88aaee", shareBasisPoints: 6000, fixedAmount: null, carryOver: false },
    { name: n.family, colour: "#ffdc58", shareBasisPoints: 1000, fixedAmount: null, carryOver: true },
    { name: n.savings, colour: "#a3e635", shareBasisPoints: 2000, fixedAmount: null, carryOver: true },
    { name: n.freedom, colour: "#c4a1ff", shareBasisPoints: 1000, fixedAmount: null, carryOver: false },
  ])
  const buckets = await liveBucketsOf(planId)
  const bucketId = (key: keyof typeof n) => buckets.find((b) => b.name === n[key])?.id ?? null

  const salaryId = await createIncomeSource({
    ...shared, name: n.salary, amount: 1_750_000, frequency: "MONTHLY", payDay: 1,
    anchorDate: null, activeFrom: "2026-01-01", activeTo: null, note: null,
  })
  await recordReceipt({ ...shared, incomeSourceId: salaryId, monthKey, receivedOn: firstOfMonth, amount: 1_750_000, note: null })

  for (const spend of SPENDING.filter((s) => s.day <= today.getDate())) {
    await createTransaction({
      ...shared, type: "EXPENSE", occurredOn: isoDate(year, month, spend.day), monthKey, amount: spend.amount,
      bucketId: bucketId(spend.bucket), category: n.categories[spend.payee], payee: n.payees[spend.payee],
      note: null, counterpartyType: null, counterpartyId: null, attachmentId: null, assetId: null,
    })
  }

  const bill = { ...shared, isEstimate: false, anchorDate: null, intervalDays: null, activeFrom: "2026-01-01", activeTo: null, note: null, reminderDays: 3 }
  await createRecurringExpense({ ...bill, name: n.rent, bucketId: bucketId("essentials"), amount: 400_000, frequency: "MONTHLY", dueDay: 25, category: null })
  await createRecurringExpense({ ...bill, name: n.generator, bucketId: bucketId("essentials"), amount: 60_000, isEstimate: true, frequency: "MONTHLY", dueDay: 28, category: null })
  await createRecurringExpense({ ...bill, name: n.internet, bucketId: bucketId("essentials"), amount: 35_000, frequency: "MONTHLY", dueDay: 22, category: null })
  await createRecurringExpense({ ...bill, name: n.school, bucketId: bucketId("family"), amount: 750_000, frequency: "QUARTERLY", dueDay: 10, anchorDate: "2026-09-10", category: null })

  await createCashAccount({ ...sharedWithoutRate, name: n.wallet, kind: "WALLET", institution: null, balance: 210_000 })
  await createCashAccount({ ...sharedWithoutRate, name: n.bank, kind: "BANK", institution: n.bank, balance: 3_400_000 })
  await createCashAccount({ ...sharedWithoutRate, name: n.home, kind: "CASH_AT_HOME", institution: null, balance: 1_500_000 })

  const lot = { ...shared, makingCharge: 0, fees: 0, location: null, serial: null, heldFor: null, note: null }
  await createLot({
    ...lot, metal: "GOLD", purityLabel: PURITIES["21k"].label, purityBasisPoints: PURITIES["21k"].basisPoints,
    weightMg: toMilligrams(40, "GRAM"), weightUnitEntered: "GRAM", quantityEntered: "40", purchaseDate: "2025-03-14",
    metalCost: 3_600_000, makingCharge: 150_000, form: "JEWELLERY", dealer: null,
  })
  await createLot({
    ...lot, metal: "GOLD", purityLabel: PURITIES["24k"].label, purityBasisPoints: PURITIES["24k"].basisPoints,
    weightMg: toMilligrams(20, "GRAM"), weightUnitEntered: "GRAM", quantityEntered: "20", purchaseDate: "2026-02-02",
    metalCost: 2_200_000, form: "BAR", dealer: null,
  })

  const carId = await createAsset({
    ...shared, type: "VEHICLE", name: n.car, purchaseDate: "2023-06-01", purchasePrice: 24_000_000, liquidity: "ILLIQUID",
    depreciationMethod: "DECLINING_BALANCE", annualRateBasisPoints: 1500, salvageValue: 6_000_000, attributes: {}, note: null,
  })

  const car = await table("assets").get(carId)
  if (car) await addValuation(car, isoDate(year, month, 1), 19_500_000, null)

  await createDebt({
    ...shared, name: n.loan, counterparty: n.lender, direction: "OWING", principal: 9_000_000, annualRateBasisPoints: 700,
    termMonths: 36, monthlyPayment: 280_000, bucketId: null, startDate: "2025-06-01", note: null,
  })

  const goalBase = { ...sharedWithoutRate, targetDate: null, backingAssetId: null, note: null }
  const hajjId = await createGoal({ ...goalBase, name: n.hajj, targetAmount: 12_000_000, targetDate: "2028-05-01", monthlyContribution: 250_000, bucketId: bucketId("savings") })
  await createGoal({ ...goalBase, name: n.emergency, targetAmount: 6_000_000, monthlyContribution: 100_000, bucketId: bucketId("savings") })
  const hajj = await table("goals").get(hajjId)
  if (hajj) await recordDeposit(hajj, [], 3_600_000, "DEPOSIT", "2026-06-15", monthKeyFor("2026-06-15", startDay), null)
}
