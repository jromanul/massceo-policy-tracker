#!/usr/bin/env tsx
/**
 * Seed FY2027 Budget Process Timeline
 *
 * Populates the BudgetProcessStage table with the 9 stages of the
 * Massachusetts FY2027 operating budget process.
 *
 * Sources:
 *   - Governor's budget: budget.digital.mass.gov/govbudget/fy27/
 *   - Budget process: malegislature.gov/Budget
 *   - Estimated dates based on FY2026 actual precedent
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const FY = 2027

const STAGES = [
  {
    stageKey: 'GOVERNOR_RECOMMENDATION',
    stageOrder: 1,
    stageLabel: "Governor's Budget Recommendation",
    stageDescription:
      'The Governor files a recommended budget with the Legislature. This is the starting point for the annual budget process.',
    stageStatus: 'COMPLETED' as const,
    stageDate: new Date('2026-01-22'),
    stageDateIsEstimate: false,
    sourceSystem: 'MA_BUDGET_OFFICE',
    sourceUrl: 'https://budget.digital.mass.gov/govbudget/fy27/',
    isAuthoritative: true,
    massceoNote:
      "Governor's budget did not include funding for MassCEO.",
    isCurrent: false,
  },
  {
    stageKey: 'HWM_BUDGET',
    stageOrder: 2,
    stageLabel: 'House Ways and Means Budget',
    stageDescription:
      'House Ways and Means Committee releases its budget recommendation, which may differ significantly from the Governor\'s proposal.',
    stageStatus: 'CURRENT' as const,
    stageDate: new Date('2026-04-16'),
    stageDateIsEstimate: true,
    sourceSystem: null,
    sourceUrl: null,
    isAuthoritative: false,
    massceoNote: null,
    isCurrent: true,
  },
  {
    stageKey: 'HOUSE_DEBATE',
    stageOrder: 3,
    stageLabel: 'House Debate',
    stageDescription:
      'The full House debates and votes on the budget. Members may file floor amendments during this period.',
    stageStatus: 'UPCOMING' as const,
    stageDate: new Date('2026-04-29'),
    stageDateIsEstimate: true,
    sourceSystem: null,
    sourceUrl: null,
    isAuthoritative: false,
    massceoNote: null,
    isCurrent: false,
  },
  {
    stageKey: 'HOUSE_BUDGET',
    stageOrder: 4,
    stageLabel: 'House Budget',
    stageDescription:
      'The engrossed House budget — the version of the budget bill passed by the full House after floor debate and amendment adoption. This is what gets sent to the Senate.',
    stageStatus: 'UPCOMING' as const,
    stageDate: new Date('2026-05-01'),
    stageDateIsEstimate: true,
    sourceSystem: null,
    sourceUrl: 'https://malegislature.gov/Budget/FY2027/HouseBudget',
    isAuthoritative: false,
    massceoNote:
      'House-passed FY27 budget. Reflects amendments adopted on the floor — the first opportunity to confirm whether MassCEO funding survived House action.',
    isCurrent: false,
  },
  {
    stageKey: 'SWM_BUDGET',
    stageOrder: 5,
    stageLabel: 'Senate Ways and Means Budget',
    stageDescription:
      'Senate Ways and Means Committee releases its budget recommendation after the House passes its version.',
    stageStatus: 'UPCOMING' as const,
    stageDate: new Date('2026-05-20'),
    stageDateIsEstimate: true,
    sourceSystem: null,
    sourceUrl: 'https://malegislature.gov/Budget/FY2027/SenateWaysMeansBudget',
    isAuthoritative: false,
    massceoNote:
      'SWM typically releases 3-4 weeks after House passage.',
    isCurrent: false,
  },
  {
    stageKey: 'SENATE_DEBATE',
    stageOrder: 6,
    stageLabel: 'Senate Debate',
    stageDescription:
      'The full Senate debates and votes on the budget. Senators may file amendments.',
    stageStatus: 'UPCOMING' as const,
    stageDate: new Date('2026-05-19'),
    stageDateIsEstimate: false,
    sourceSystem: null,
    sourceUrl: 'https://malegislature.gov/Bills/194/S4',
    isAuthoritative: true,
    massceoNote: null,
    isCurrent: false,
  },
  {
    stageKey: 'SENATE_BUDGET',
    stageOrder: 7,
    stageLabel: 'Senate Budget',
    stageDescription:
      'The engrossed Senate budget — the version of the budget bill passed by the full Senate after floor debate and amendment adoption. Sent to a conference committee with the House version.',
    stageStatus: 'UPCOMING' as const,
    stageDate: new Date('2026-05-29'),
    stageDateIsEstimate: true,
    sourceSystem: null,
    sourceUrl: 'https://malegislature.gov/Budget/FY2027/SenateBudget',
    isAuthoritative: false,
    massceoNote:
      'Senate-passed FY27 budget. Reflects amendments adopted on the floor — the basis for conference negotiation with the House version.',
    isCurrent: false,
  },
  {
    stageKey: 'CONFERENCE_COMMITTEE',
    stageOrder: 8,
    stageLabel: 'Conference Committee',
    stageDescription:
      'A six-member conference committee reconciles the House and Senate budget versions into a single bill.',
    stageStatus: 'UPCOMING' as const,
    stageDate: null,
    stageDateIsEstimate: true,
    sourceSystem: null,
    sourceUrl: null,
    isAuthoritative: false,
    massceoNote:
      'Reconciles House and Senate versions. Duration varies; typically completed by late June.',
    isCurrent: false,
  },
  {
    stageKey: 'FINAL_TO_GOVERNOR',
    stageOrder: 9,
    stageLabel: 'Final Budget to Governor',
    stageDescription:
      'The conference committee report is voted on by both chambers and sent to the Governor for signature.',
    stageStatus: 'UPCOMING' as const,
    stageDate: null,
    stageDateIsEstimate: true,
    sourceSystem: null,
    sourceUrl: null,
    isAuthoritative: false,
    massceoNote: null,
    isCurrent: false,
  },
  {
    stageKey: 'GOVERNOR_REVIEW',
    stageOrder: 10,
    stageLabel: 'Governor Review / Vetoes',
    stageDescription:
      'The Governor has 10 days to sign the budget, veto it, or exercise line-item vetoes on specific appropriations.',
    stageStatus: 'UPCOMING' as const,
    stageDate: null,
    stageDateIsEstimate: true,
    sourceSystem: null,
    sourceUrl: null,
    isAuthoritative: false,
    massceoNote:
      'Governor has 10 days to sign or exercise line-item vetoes.',
    isCurrent: false,
  },
  {
    stageKey: 'OVERRIDE_PERIOD',
    stageOrder: 11,
    stageLabel: 'Override Period',
    stageDescription:
      'The Legislature may override gubernatorial vetoes with a two-thirds vote in each chamber.',
    stageStatus: 'UPCOMING' as const,
    stageDate: null,
    stageDateIsEstimate: true,
    sourceSystem: null,
    sourceUrl: null,
    isAuthoritative: false,
    massceoNote: null,
    isCurrent: false,
  },
]

async function main() {
  console.log(`Seeding FY${FY} budget process timeline...\n`)

  // Look up the FY27 MassCEO budget item for linking
  const massceoItem = await prisma.budgetItem.findFirst({
    where: { fiscalYear: FY, lineItemNumber: '7002-1075' },
    select: { id: true },
  })

  let created = 0
  let updated = 0

  for (const stage of STAGES) {
    const data = {
      fiscalYear: FY,
      ...stage,
      sourceRetrievedAt: stage.isAuthoritative ? new Date() : null,
      relatedBudgetItemId:
        stage.stageKey === 'GOVERNOR_RECOMMENDATION' && massceoItem
          ? massceoItem.id
          : null,
    }

    const existing = await prisma.budgetProcessStage.findUnique({
      where: { fiscalYear_stageKey: { fiscalYear: FY, stageKey: stage.stageKey } },
    })

    if (existing) {
      await prisma.budgetProcessStage.update({
        where: { id: existing.id },
        data,
      })
      console.log(`  Updated: ${stage.stageLabel}`)
      updated++
    } else {
      await prisma.budgetProcessStage.create({ data })
      console.log(`  Created: ${stage.stageLabel}`)
      created++
    }
  }

  console.log(
    `\nDone. Created ${created}, updated ${updated} process stages for FY${FY}.`
  )
  if (massceoItem) {
    console.log(`  Linked Governor stage to BudgetItem #${massceoItem.id} (7002-1075)`)
  } else {
    console.log('  Note: No FY27 BudgetItem with lineItemNumber 7002-1075 found to link.')
  }

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error('Seed budget process failed:', err)
  process.exit(1)
})
