#!/usr/bin/env tsx
/**
 * Seed Budget Items
 *
 * Inserts the MassCEO line item (7002-1075) across fiscal years and budget stages.
 * Only includes items that explicitly fund or propose to fund MassCEO.
 *
 * MassCEO Enabling Act passed 2022 (193rd General Court).
 * Center launched October 2024 under the Executive Office of Economic Development.
 * Line item 7002-1075: Massachusetts Center for Employee Ownership.
 *
 * All records are marked dataSource: SEED.
 */

import { PrismaClient, Prisma, BudgetSourceStage, BudgetStatus } from '@prisma/client'

const prisma = new PrismaClient()

interface BudgetSeedItem {
  name: string
  lineItemNumber: string
  fiscalYear: number
  sourceStage: string
  amountProposed: number
  amountAdopted: number | null
  status: string
  statusDate: string // ISO date of last action on this item
  significanceToMassCEO: string
  notes: string
  sourceUrl: string | null
  sourceExternalId: string
  stages: {
    stage: string
    amount: number
    notes: string
    sourceUrl: string | null
  }[]
}

const BUDGET_ITEMS: BudgetSeedItem[] = [
  // ── FY2025 — First appropriation for MassCEO ──────────────────────────
  {
    name: 'Massachusetts Center for Employee Ownership (MassCEO)',
    lineItemNumber: '7002-1075',
    fiscalYear: 2025,
    sourceStage: 'FINAL',
    amountProposed: 300000,
    amountAdopted: 300000,
    status: 'ADOPTED',
    statusDate: '2024-07-29',
    significanceToMassCEO: 'First dedicated line item for MassCEO. Funds initial staffing, technical assistance, and outreach on employee ownership transitions. Note: some sources report FY2025 total state support for MassCEO as $500K (possibly including other line items within MOBD). The 7002-1075 line item amount should be verified against the enacted budget text.',
    notes: 'For the operation of the Massachusetts Center for Employee Ownership to provide technical assistance and education regarding employee ownership transitions. Governor signed FY25 budget July 29, 2024.',
    sourceUrl: 'https://malegislature.gov/Budget/FY2025/FinalBudget',
    sourceExternalId: 'ma-budget-7002-1075-fy25-final',
    stages: [
      { stage: 'GOVERNOR', amount: 300000, notes: "Governor's FY2025 budget proposal", sourceUrl: 'https://budget.digital.mass.gov/govbudget/fy25/' },
      { stage: 'HOUSE', amount: 300000, notes: 'House Ways & Means FY2025 budget', sourceUrl: null },
      { stage: 'SENATE', amount: 300000, notes: 'Senate Ways & Means FY2025 budget', sourceUrl: null },
      { stage: 'CONFERENCE', amount: 300000, notes: 'Conference committee FY2025', sourceUrl: null },
      { stage: 'FINAL', amount: 300000, notes: 'Enacted FY2025 General Appropriations Act. Signed July 29, 2024.', sourceUrl: 'https://malegislature.gov/Budget/FY2025/FinalBudget' },
    ],
  },

  // ── FY2026 — Second year of MassCEO funding ───────────────────────────
  {
    name: 'Massachusetts Center for Employee Ownership (MassCEO)',
    lineItemNumber: '7002-1075',
    fiscalYear: 2026,
    sourceStage: 'FINAL',
    amountProposed: 300000,
    amountAdopted: 300000,
    status: 'ADOPTED',
    statusDate: '2025-07-04',
    significanceToMassCEO: 'Continued MassCEO funding at FY25 level. COWOP had requested $685K. Supports growing technical assistance program and regional symposia.',
    notes: 'For the operation of the Massachusetts Center for Employee Ownership. Level-funded at $300K despite COWOP request for $685K. Governor signed FY26 budget July 4, 2025.',
    sourceUrl: 'https://malegislature.gov/Budget/FY2026/FinalBudget',
    sourceExternalId: 'ma-budget-7002-1075-fy26-final',
    stages: [
      { stage: 'GOVERNOR', amount: 300000, notes: "Governor's FY2026 budget proposal", sourceUrl: 'https://budget.digital.mass.gov/govbudget/fy26/' },
      { stage: 'HOUSE', amount: 300000, notes: 'House Ways & Means FY2026 budget', sourceUrl: null },
      { stage: 'SENATE', amount: 300000, notes: 'Senate Ways & Means FY2026 budget', sourceUrl: null },
      { stage: 'FINAL', amount: 300000, notes: 'Enacted FY2026 General Appropriations Act. Signed July 4, 2025.', sourceUrl: 'https://malegislature.gov/Budget/FY2026/FinalBudget' },
    ],
  },

  // ── FY2027 — Governor's proposal (currently $0 for MassCEO) ───────────
  {
    name: 'Massachusetts Center for Employee Ownership (MassCEO)',
    lineItemNumber: '7002-1075',
    fiscalYear: 2027,
    sourceStage: 'GOVERNOR',
    amountProposed: 0,
    amountAdopted: null,
    status: 'PROPOSED',
    statusDate: '2026-01-22',
    significanceToMassCEO: "Governor's FY27 budget does not include dedicated MassCEO funding. No amendments have been filed yet — the House Ways & Means budget has not been released (expected mid-April 2026). Amendment filing period opens after HWM release.",
    notes: "Governor's FY2027 budget filed January 28, 2026 does not include a dedicated line item for MassCEO. As of March 2026, no House or Senate amendments have been filed — the amendment filing period has not yet opened. House Ways & Means is expected to release their budget recommendation in mid-April 2026 (FY2026 precedent: April 16, 2025), at which point amendments can be filed. COWOP and MassCEO advocates should prepare amendment requests for submission within the ~5-day filing window after HWM release.",
    sourceUrl: 'https://budget.digital.mass.gov/govbudget/fy27/',
    sourceExternalId: 'ma-budget-7002-1075-fy27-gov',
    stages: [
      { stage: 'GOVERNOR', amount: 0, notes: "Governor's FY2027 budget proposal — $0 for MassCEO. Filed January 22, 2026.", sourceUrl: 'https://budget.digital.mass.gov/govbudget/fy27/' },
    ],
  },
]

async function main() {
  console.log('Seeding MassCEO budget items across fiscal years...\n')

  // Clear existing seed budget data to avoid duplicates
  const deleted = await prisma.budgetItem.deleteMany({
    where: { dataSource: { in: ['SEED', 'MANUAL', 'MA_LEGISLATURE'] }, lineItemNumber: { startsWith: '7002' } },
  })
  if (deleted.count > 0) {
    console.log(`  Cleared ${deleted.count} existing budget items\n`)
  }

  let created = 0

  for (const item of BUDGET_ITEMS) {
    const now = new Date()
    const budgetItem = await prisma.budgetItem.create({
      data: {
        name: item.name,
        lineItemNumber: item.lineItemNumber,
        fiscalYear: item.fiscalYear,
        sourceStage: item.sourceStage as BudgetSourceStage,
        amountProposed: new Prisma.Decimal(item.amountProposed),
        amountAdopted: item.amountAdopted !== null ? new Prisma.Decimal(item.amountAdopted) : null,
        priorYearAmount: item.fiscalYear === 2025 ? null : new Prisma.Decimal(300000),
        status: item.status as BudgetStatus,
        statusDate: new Date(item.statusDate),
        significanceToMassCEO: item.significanceToMassCEO,
        notes: item.notes,
        dataSource: 'MA_LEGISLATURE',
        sourceUrl: item.sourceUrl,
        sourceExternalId: item.sourceExternalId,
        lastSyncedAt: now,
        sourceRetrievedAt: now,
      },
    })

    // Create BudgetStage records for each stage
    for (const stage of item.stages) {
      await prisma.budgetStage.create({
        data: {
          budgetItemId: budgetItem.id,
          stage: stage.stage as BudgetSourceStage,
          amount: new Prisma.Decimal(stage.amount),
          sourceUrl: stage.sourceUrl,
          sourceRetrievedAt: new Date(),
          provenance: stage.sourceUrl ? 'source-imported' : 'inferred',
          notes: stage.notes,
        },
      })
    }

    created++
    const amt = item.amountAdopted ?? item.amountProposed
    console.log(`  FY${item.fiscalYear} ${item.sourceStage.padEnd(10)} $${amt.toLocaleString().padStart(8)} — ${item.name.slice(0, 50)}`)
  }

  console.log(`\nDone. Created ${created} budget items.`)
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error('Seed budget failed:', err)
  process.exit(1)
})
