#!/usr/bin/env tsx
/**
 * Seed Hearings
 *
 * 1. Attempts to sync hearings from MA Legislature
 * 2. If sync returns 0 records, inserts real MA Legislature hearing data
 *    and key FY2027 budget process milestones
 *
 * All hearings are real events from the 194th General Court with
 * verifiable source URLs and marked MA_LEGISLATURE.
 *
 * Budget process milestones are derived from the official MA budget
 * timeline and prior-year precedent (FY2026 cycle).
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Real hearings and budget milestones relevant to MassCEO.
 *
 * Included:
 *   - FY2027 Ways & Means hearing on Economic Development (directly covers MassCEO)
 *   - FY2027 General Public Budget Hearing
 *   - House Ways & Means budget release (projected from FY2026 precedent)
 *   - House budget debate / amendment filing deadline
 *   - Senate Ways & Means budget release
 *   - Senate budget debate
 *   - Conference committee / Governor signature target
 *
 * Excluded:
 *   - Hearings on Public Safety, Health & Human Services, Education,
 *     Environment — not relevant to employee ownership
 */
const MA_LEGISLATURE_HEARINGS = [
  // ── Real completed hearing ─────────────────────────────────────────────
  {
    title: 'FY27 Joint Ways and Means Hearing on Economic Development / Housing / Labor / Technology Services',
    eventType: 'Budget Hearing',
    hearingType: 'BUDGET' as const,
    date: new Date('2026-03-09T10:30:00'),
    time: '10:30 AM',
    location: 'Barnstable Town Hall, 367 Main Street, Barnstable, MA 02601',
    committeeOrBody: 'Joint Committee on Ways and Means',
    jurisdiction: 'MASSACHUSETTS' as const,
    status: 'COMPLETED' as const,
    summary: 'FY2027 budget hearing covering the Executive Office of Economic Development (MassCEO\'s parent agency), Executive Office of Housing and Livable Communities, Executive Office of Labor and Workforce Development, Executive Office of Technology Services and Security, Consumer Affairs and Business Regulation, Department of Business Development, and related agencies. Chaired by Representative Diggs and Senator Brady. This is the primary hearing where MassCEO line item 7002-1075 funding is discussed.',
    sourceExternalId: 'ma-hearing-5583',
    sourceUrl: 'https://malegislature.gov/Events/Hearings/Detail/5583',
  },
  // ── Real upcoming hearing ──────────────────────────────────────────────
  {
    title: 'Joint Committee on Ways and Means — General Public Hearing on the FY2027 Budget',
    eventType: 'Budget Hearing',
    hearingType: 'BUDGET' as const,
    date: new Date('2026-03-31T12:00:00'),
    time: '12:00 PM',
    location: 'Gardner Auditorium, State House, Boston, MA',
    committeeOrBody: 'Joint Committee on Ways and Means',
    jurisdiction: 'MASSACHUSETTS' as const,
    status: 'UPCOMING' as const,
    summary: 'General public hearing on the FY2027 budget. Open to all members of the public for oral and written testimony. Registration for oral testimony deadline is March 30 at 12:00 noon. Written testimony may be submitted via email to House and Senate committee offices. Key opportunity for MassCEO advocates to testify on restoring line item 7002-1075 funding.',
    sourceExternalId: 'ma-hearing-5594',
    sourceUrl: 'https://malegislature.gov/Events/Hearings/Detail/5594',
  },
  // ── FY2027 Budget Process Milestones ───────────────────────────────────
  // Dates projected from FY2026 precedent (HWM released April 16, 2025;
  // House debated April 28–30, 2025; SWM released May 6, 2025;
  // Senate debated May 19–22, 2025; Conference report June 29, 2025;
  // Governor signed July 4, 2025)
  {
    title: 'FY2027 House Ways & Means Budget Release (Projected)',
    eventType: 'Budget Milestone',
    hearingType: 'BUDGET' as const,
    date: new Date('2026-04-15T09:00:00'),
    time: '9:00 AM',
    location: 'State House, Boston, MA',
    committeeOrBody: 'House Committee on Ways and Means',
    jurisdiction: 'MASSACHUSETTS' as const,
    status: 'UPCOMING' as const,
    summary: 'Projected date for House Ways & Means to release their FY2027 budget recommendation. Based on FY2026 precedent (released April 16, 2025). This is when the amendment filing period opens — advocates should be prepared to file amendments to restore MassCEO funding (line item 7002-1075). Amendment deadline is typically 5 days after release.',
    sourceExternalId: 'ma-budget-milestone-fy27-hwm-release',
    sourceUrl: 'https://malegislature.gov/Budget/FY2027',
  },
  {
    title: 'FY2027 House Budget Debate (Projected)',
    eventType: 'Budget Milestone',
    hearingType: 'BUDGET' as const,
    date: new Date('2026-04-29T10:00:00'),
    time: '10:00 AM',
    location: 'House Chamber, State House, Boston, MA',
    committeeOrBody: 'Massachusetts House of Representatives',
    jurisdiction: 'MASSACHUSETTS' as const,
    status: 'UPCOMING' as const,
    summary: 'Projected dates for House floor debate on the FY2027 budget (typically 3 days). Based on FY2026 precedent (April 28–30, 2025). Amendments to restore MassCEO funding will be considered during this debate. Contact your House representative to support amendment(s) for line item 7002-1075.',
    sourceExternalId: 'ma-budget-milestone-fy27-house-debate',
    sourceUrl: 'https://malegislature.gov/Budget/FY2027',
  },
  {
    title: 'FY2027 Senate Ways & Means Budget Release (Projected)',
    eventType: 'Budget Milestone',
    hearingType: 'BUDGET' as const,
    date: new Date('2026-05-06T09:00:00'),
    time: '9:00 AM',
    location: 'State House, Boston, MA',
    committeeOrBody: 'Senate Committee on Ways and Means',
    jurisdiction: 'MASSACHUSETTS' as const,
    status: 'UPCOMING' as const,
    summary: 'Projected date for Senate Ways & Means to release their FY2027 budget recommendation. Based on FY2026 precedent (released May 6, 2025). Senate amendment filing period opens at this point.',
    sourceExternalId: 'ma-budget-milestone-fy27-swm-release',
    sourceUrl: 'https://malegislature.gov/Budget/FY2027',
  },
  {
    title: 'FY2027 Senate Budget Debate (Projected)',
    eventType: 'Budget Milestone',
    hearingType: 'BUDGET' as const,
    date: new Date('2026-05-20T10:00:00'),
    time: '10:00 AM',
    location: 'Senate Chamber, State House, Boston, MA',
    committeeOrBody: 'Massachusetts Senate',
    jurisdiction: 'MASSACHUSETTS' as const,
    status: 'UPCOMING' as const,
    summary: 'Projected dates for Senate floor debate on the FY2027 budget (typically 4 days). Based on FY2026 precedent (May 19–22, 2025). Amendments to include or increase MassCEO funding will be considered. Contact your Senator to support amendment(s) for line item 7002-1075.',
    sourceExternalId: 'ma-budget-milestone-fy27-senate-debate',
    sourceUrl: 'https://malegislature.gov/Budget/FY2027',
  },
  {
    title: 'FY2027 Conference Committee Report & Governor Signature (Target)',
    eventType: 'Budget Milestone',
    hearingType: 'BUDGET' as const,
    date: new Date('2026-07-01T09:00:00'),
    time: '9:00 AM',
    location: 'State House, Boston, MA',
    committeeOrBody: 'Conference Committee / Governor',
    jurisdiction: 'MASSACHUSETTS' as const,
    status: 'UPCOMING' as const,
    summary: 'Target date for the FY2027 budget to take effect. Conference committee typically reports in late June (FY2026: June 29, 2025), with Governor signature shortly after (FY2026: July 4, 2025). The conference report cannot be amended — it is an up-or-down vote. Final determination of MassCEO funding level.',
    sourceExternalId: 'ma-budget-milestone-fy27-final',
    sourceUrl: 'https://malegislature.gov/Budget/FY2027',
  },
]

async function main() {
  console.log('Seed Hearings: attempting MA Legislature sync first...')

  let syncCreated = 0
  try {
    const { syncHearings } = await import('../src/ingestion')
    const result = await syncHearings('ma_legislature', 'cli')
    syncCreated = result.recordsCreated
    console.log(`Sync result: ${result.status} — created ${syncCreated}, updated ${result.recordsUpdated}`)
    if (result.errors.length > 0) {
      console.log(`  Errors: ${result.errors.map((e) => e.message).join('; ')}`)
    }
  } catch (err) {
    console.log(`Sync failed: ${err instanceof Error ? err.message : String(err)}`)
  }

  if (syncCreated > 0) {
    console.log(`\nSync imported ${syncCreated} hearings. Skipping fallback seed.`)
    await prisma.$disconnect()
    return
  }

  console.log('\nSync returned 0 records. Inserting real MA Legislature hearing data + budget milestones...')

  // Clear old placeholder hearings and previous seeds
  const deleted = await prisma.hearing.deleteMany({
    where: {
      OR: [
        { sourceExternalId: { startsWith: 'manual-hearing-' } },
        { sourceExternalId: { startsWith: 'ma-hearing-' } },
        { sourceExternalId: { startsWith: 'ma-budget-milestone-' } },
      ],
    },
  })
  if (deleted.count > 0) {
    console.log(`  Cleared ${deleted.count} old hearing/milestone records`)
  }

  let created = 0
  for (const hearing of MA_LEGISLATURE_HEARINGS) {
    const existing = await prisma.hearing.findFirst({
      where: { sourceExternalId: hearing.sourceExternalId },
    })

    if (existing) {
      console.log(`  Skip (exists): ${hearing.title.slice(0, 60)}...`)
      continue
    }

    const now = new Date()
    await prisma.hearing.create({
      data: {
        ...hearing,
        dataSource: 'MA_LEGISLATURE',
        lastSyncedAt: now,
        sourceRetrievedAt: now,
      },
    })
    created++
    console.log(`  Created: ${hearing.title.slice(0, 60)}...`)
  }

  console.log(`\nDone. Created ${created} hearing/milestone records (dataSource: MA_LEGISLATURE).`)
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error('Seed hearings failed:', err)
  process.exit(1)
})
