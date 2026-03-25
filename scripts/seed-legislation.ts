#!/usr/bin/env tsx
/**
 * Seed Historical / Enacted Legislation
 *
 * Inserts the founding legislation for MassCEO and the Employee Ownership
 * Advisory Board, plus key historical bills from prior sessions.
 * These are marked as ENACTED/ARCHIVED with MA_LEGISLATURE dataSource.
 *
 * Sources: malegislature.gov session laws, NCEO, Mass.gov
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const HISTORICAL_LEGISLATION = [
  // ── 192nd General Court (2021-2022) ────────────────────────────────────
  {
    jurisdiction: 'MASSACHUSETTS' as const,
    billNumber: 'H.5374',
    sessionNumber: '192nd General Court',
    title: 'An Act relating to economic growth and relief for the Commonwealth',
    shortSummary: 'Omnibus economic development bill ($3.76B) that established the Massachusetts Center for Employee Ownership (MassCEO) and the Advisory Board on Employee Ownership. Codified in M.G.L. Chapter 23D, Sections 16-20 and Chapter 6, Section 204.',
    detailedNotes: 'Enacted as Chapter 268 of the Acts of 2022. Signed by Governor Baker on November 10, 2022. Includes provisions originally filed as H.511/S.261 ("An Act enabling the Massachusetts center for employee ownership"). Establishes MassCEO within the Massachusetts Office of Business Development (MOBD) with duties including technical assistance, education, research, and outreach on employee ownership transitions. Creates a 19-member Advisory Board on Employee Ownership.',
    chamber: 'HOUSE' as const,
    primarySponsor: 'House Committee on Ways and Means',
    coSponsors: JSON.stringify([]),
    status: 'ENACTED' as const,
    statusDate: new Date('2022-11-10'),
    relevanceToMassCEO: 'Founding legislation for MassCEO. Established the center, its mission, and the Employee Ownership Advisory Board.',
    relevanceToEOAB: 'Creates the Advisory Board on Employee Ownership (M.G.L. Ch. 6, §204) with 19 members including government officials, labor representatives, ESOP company reps, and worker cooperative reps.',
    issueCategory: 'Worker Ownership',
    eoRelevanceScore: 100,
    archived: true,
    trackingTier: 'ACTIVELY_TRACKED' as const,
    dataSource: 'MA_LEGISLATURE' as const,
    sourceUrl: 'https://malegislature.gov/Bills/192/H5374',
    sourceExternalId: 'ma-192-H5374',
  },
  {
    jurisdiction: 'MASSACHUSETTS' as const,
    billNumber: 'H.511',
    sessionNumber: '192nd General Court',
    title: 'An Act enabling the Massachusetts center for employee ownership',
    shortSummary: 'Original standalone bill to establish MassCEO. Provisions were incorporated into the omnibus economic development bill H.5374 (Chapter 268 of the Acts of 2022).',
    detailedNotes: 'Filed February 19, 2021 by Rep. Carmine Lawrence Gentile (13th Middlesex) and Rep. Paul W. Mark (2nd Berkshire). Referred to the Joint Committee on Economic Development and Emerging Technologies. The bill\'s substance was folded into H.5374 rather than passing independently. Senate companion was S.261 (Sen. Julian Cyr).',
    chamber: 'HOUSE' as const,
    primarySponsor: 'Rep. Carmine Lawrence Gentile',
    coSponsors: JSON.stringify(['Rep. Paul W. Mark', 'Sen. Julian Cyr']),
    status: 'ENACTED' as const,
    statusDate: new Date('2022-11-10'),
    relevanceToMassCEO: 'Original enabling legislation for MassCEO. Substance enacted via H.5374.',
    issueCategory: 'Worker Ownership',
    eoRelevanceScore: 100,
    archived: true,
    trackingTier: 'ACTIVELY_TRACKED' as const,
    dataSource: 'MA_LEGISLATURE' as const,
    sourceUrl: 'https://malegislature.gov/Bills/192/H511',
    sourceExternalId: 'ma-192-H511',
  },
  // ── 193rd General Court (2023-2024) ────────────────────────────────────
  {
    jurisdiction: 'MASSACHUSETTS' as const,
    billNumber: 'H.2769',
    sessionNumber: '193rd General Court',
    title: 'An Act to promote employee ownership',
    shortSummary: 'Would exempt capital gains from sales of MA businesses with 500 or fewer employees to employee ownership structures from state capital gains tax.',
    detailedNotes: 'Filed by Rep. Kip A. Diggs. Senate companion S.1783 (Sen. Julian Cyr). Referred to House Ways and Means on March 21, 2024. Did not pass the 193rd session. Refiled as S.1950/H.3079 in the 194th General Court.',
    chamber: 'HOUSE' as const,
    primarySponsor: 'Rep. Kip A. Diggs',
    coSponsors: JSON.stringify(['Sen. Julian Cyr']),
    status: 'DEAD' as const,
    statusDate: new Date('2024-03-21'),
    relevanceToMassCEO: 'Tax incentive to encourage employee ownership conversions — directly supports MassCEO mission.',
    issueCategory: 'Tax Policy',
    eoRelevanceScore: 80,
    archived: true,
    trackingTier: 'ACTIVELY_TRACKED' as const,
    dataSource: 'MA_LEGISLATURE' as const,
    sourceUrl: 'https://malegislature.gov/Bills/193/H2769',
    sourceExternalId: 'ma-193-H2769',
  },
  // ── Acts of 2024 ──────────────────────────────────────────────────────
  {
    jurisdiction: 'MASSACHUSETTS' as const,
    billNumber: 'Ch. 238',
    sessionNumber: '193rd General Court',
    title: 'An Act relative to strengthening Massachusetts\' economic leadership',
    shortSummary: 'Economic development legislation that amended the Employee-Ownership Revolving Loan Fund (M.G.L. Ch. 23D, §16) and repealed §20. Signed November 20, 2024.',
    detailedNotes: 'Chapter 238 of the Acts of 2024. Section 48 amended Chapter 23D, Section 16 (Employee-Ownership Revolving Loan Fund), effective February 18, 2025. Section 49 repealed Chapter 23D, Section 20 (Assistance for applicants, outreach). Signed by Governor Healey on November 20, 2024.',
    chamber: 'HOUSE' as const,
    primarySponsor: 'House Committee on Ways and Means',
    coSponsors: JSON.stringify([]),
    status: 'ENACTED' as const,
    statusDate: new Date('2024-11-20'),
    relevanceToMassCEO: 'Amended the Employee-Ownership Revolving Loan Fund and streamlined MassCEO\'s statutory framework.',
    issueCategory: 'Worker Ownership',
    eoRelevanceScore: 70,
    archived: true,
    trackingTier: 'ACTIVELY_TRACKED' as const,
    dataSource: 'MA_LEGISLATURE' as const,
    sourceUrl: 'https://malegislature.gov/Laws/SessionLaws/Acts/2024/Chapter238',
    sourceExternalId: 'ma-193-Ch238',
  },
]

async function main() {
  console.log('Seeding historical/enacted employee ownership legislation...\n')

  let created = 0
  let skipped = 0

  for (const item of HISTORICAL_LEGISLATION) {
    const existing = await prisma.legislativeItem.findFirst({
      where: { sourceExternalId: item.sourceExternalId },
    })

    if (existing) {
      console.log(`  Skip (exists): ${item.billNumber} — ${item.title.slice(0, 50)}`)
      skipped++
      continue
    }

    const now = new Date()
    await prisma.legislativeItem.create({
      data: {
        ...item,
        lastSyncedAt: now,
        sourceRetrievedAt: now,
      },
    })
    created++
    console.log(`  Created: ${item.billNumber} — ${item.title.slice(0, 50)}`)
  }

  console.log(`\nDone. Created ${created} historical records, skipped ${skipped}.`)
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error('Seed legislation failed:', err)
  process.exit(1)
})
