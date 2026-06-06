import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/sync/status
 *
 * Returns a comprehensive snapshot of data freshness across every live-updating
 * source: when each source was last synced, how many records it has, and whether
 * the last sync succeeded.
 */
export async function GET() {
  try {
    // Individual counts + max(lastSyncedAt) per source.
    // Using findFirst with orderBy is more compatible across Prisma adapters than groupBy.

    const [
      maLegCount,
      maLegLatest,
      federalCount,
      federalLatest,
      maHearingCount,
      maHearingLatest,
      budgetCount,
      budgetLatest,
      amendmentCount,
      amendmentLatest,
      timelineCount,
      timelineLatest,
      peerStateCount,
      peerStateLatest,
      peerStateCountByState,
      recentSyncLogs,
    ] = await Promise.all([
      prisma.legislativeItem.count({
        where: { archived: false, dataSource: 'MA_LEGISLATURE' },
      }),
      prisma.legislativeItem.findFirst({
        where: { archived: false, dataSource: 'MA_LEGISLATURE' },
        orderBy: { lastSyncedAt: 'desc' },
        select: { lastSyncedAt: true },
      }),
      prisma.legislativeItem.count({
        where: { archived: false, dataSource: 'CONGRESS_GOV' },
      }),
      prisma.legislativeItem.findFirst({
        where: { archived: false, dataSource: 'CONGRESS_GOV' },
        orderBy: { lastSyncedAt: 'desc' },
        select: { lastSyncedAt: true },
      }),
      prisma.hearing.count({ where: { dataSource: 'MA_LEGISLATURE' } }),
      prisma.hearing.findFirst({
        where: { dataSource: 'MA_LEGISLATURE' },
        orderBy: { lastSyncedAt: 'desc' },
        select: { lastSyncedAt: true },
      }),
      prisma.budgetItem.count({ where: { archived: false } }),
      prisma.budgetItem.findFirst({
        where: { archived: false },
        orderBy: { lastSyncedAt: 'desc' },
        select: { lastSyncedAt: true },
      }),
      prisma.amendment.count({ where: { archived: false, dataSource: 'MA_LEGISLATURE' } }),
      prisma.amendment.findFirst({
        where: { archived: false, dataSource: 'MA_LEGISLATURE' },
        orderBy: { lastSyncedAt: 'desc' },
        select: { lastSyncedAt: true },
      }),
      prisma.budgetProcessStage.count({ where: { fiscalYear: 2027 } }),
      prisma.budgetProcessStage.findFirst({
        where: { fiscalYear: 2027 },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true, sourceRetrievedAt: true },
      }),
      prisma.peerStateBill.count({ where: { archived: false } }),
      prisma.peerStateBill.findFirst({
        where: { archived: false },
        orderBy: { lastSyncedAt: 'desc' },
        select: { lastSyncedAt: true },
      }),
      prisma.peerStateBill.findMany({
        where: { archived: false },
        select: { state: true },
        distinct: ['state'],
      }),
      prisma.syncLog.findMany({
        orderBy: { startedAt: 'desc' },
        take: 20,
        select: {
          id: true,
          source: true,
          status: true,
          triggerType: true,
          recordsProcessed: true,
          recordsCreated: true,
          recordsUpdated: true,
          recordsSkipped: true,
          startedAt: true,
          completedAt: true,
        },
      }),
    ])

    // Find last successful sync per source-category from sync_log
    async function lastSuccessfulSync(sourcePattern: string): Promise<string | null> {
      const log = await prisma.syncLog.findFirst({
        where: { source: { contains: sourcePattern }, status: { in: ['success', 'partial'] } },
        orderBy: { startedAt: 'desc' },
        select: { completedAt: true, startedAt: true },
      })
      return (log?.completedAt || log?.startedAt)?.toISOString() || null
    }

    const [
      maLegLastAttempt,
      federalLastAttempt,
      maHearingLastAttempt,
      budgetLastAttempt,
      amendmentLastAttempt,
      timelineLastAttempt,
      peerStateLastAttempt,
    ] = await Promise.all([
      lastSuccessfulSync('ma_legislature'),
      lastSuccessfulSync('congress_gov'),
      lastSuccessfulSync('ma_legislature_hearings'),
      lastSuccessfulSync('ma_budget'),
      lastSuccessfulSync('amendments'),
      lastSuccessfulSync('budget_bill'),
      lastSuccessfulSync('openstates_peer_state_bills'),
    ])

    const sources = [
      {
        id: 'ma_legislature_bills',
        label: 'MA Legislature (Bills)',
        description: 'EO-relevant MA bills, auto-filtered via malegislature.gov JSON API',
        liveSource: 'https://malegislature.gov/api/GeneralCourts/194/Documents',
        autoSync: 'Daily 2 AM ET + manual',
        recordCount: maLegCount,
        lastRecordUpdate: maLegLatest?.lastSyncedAt?.toISOString() || null,
        lastSourceCheck: maLegLastAttempt,
      },
      {
        id: 'congress_gov',
        label: 'Congress.gov (Federal Bills)',
        description: 'Federal EO legislation via Congress.gov API v3 (119th Congress)',
        liveSource: 'https://api.congress.gov/v3',
        autoSync: 'Daily 2 AM ET + manual',
        recordCount: federalCount,
        lastRecordUpdate: federalLatest?.lastSyncedAt?.toISOString() || null,
        lastSourceCheck: federalLastAttempt,
      },
      {
        id: 'ma_legislature_hearings',
        label: 'MA Legislature (Hearings)',
        description:
          'Strict filter on hearing calendar for Ways and Means, Economic Development, and EO-specific terms',
        liveSource: 'https://malegislature.gov/Events/Hearings/Calendar',
        autoSync: 'Daily 2 AM ET + manual',
        recordCount: maHearingCount,
        lastRecordUpdate: maHearingLatest?.lastSyncedAt?.toISOString() || null,
        lastSourceCheck: maHearingLastAttempt,
      },
      {
        id: 'ma_budget',
        label: 'MA Budget Items',
        description:
          'MassCEO (7002-1075) + related line items tracked across Governor/House/Senate/Conference stages',
        liveSource: 'https://malegislature.gov/Bills/194/H5500 (+ other FY bills)',
        autoSync: 'Daily 2 AM ET + manual',
        recordCount: budgetCount,
        lastRecordUpdate: budgetLatest?.lastSyncedAt?.toISOString() || null,
        lastSourceCheck: budgetLastAttempt,
      },
      {
        id: 'ma_budget_amendments',
        label: 'EO-Relevant Budget Amendments',
        description:
          'Filters 561+ amendments per chamber for employee ownership / MassCEO keywords',
        liveSource: 'https://malegislature.gov/Budget/FY2027/{HouseDebate,SenateDebate}/Amendments',
        autoSync: 'Daily 2 AM ET + manual',
        recordCount: amendmentCount,
        lastRecordUpdate: amendmentLatest?.lastSyncedAt?.toISOString() || null,
        lastSourceCheck: amendmentLastAttempt,
      },
      {
        id: 'ma_budget_timeline',
        label: 'FY2027 Budget Process Timeline',
        description:
          'Auto-advances based on H.5500 bill status (HWM filed, House passed, etc.)',
        liveSource: 'https://malegislature.gov/api/GeneralCourts/194/Documents/H5500',
        autoSync: 'Daily 2 AM ET + manual',
        recordCount: timelineCount,
        lastRecordUpdate:
          timelineLatest?.sourceRetrievedAt?.toISOString() ||
          timelineLatest?.updatedAt?.toISOString() ||
          null,
        lastSourceCheck: timelineLastAttempt,
      },
      {
        id: 'peer_state_bills',
        label: 'Peer State Legislation (OpenStates)',
        description: `Live EO bills across all 50 states + DC since Jan 2025 — filtered for "employee ownership", "employee owned", "ESOP", "EOT", "co-op", "worker cooperative". Currently surfaces bills from ${peerStateCountByState.length} states.`,
        liveSource: 'https://v3.openstates.org/bills',
        autoSync:
          'Daily 2:30 AM ET (staleness rotation, ~2 states per cron run due to OpenStates 10/min rate limit) + CLI `npm run sync:peer-states` for one-shot full refresh',
        recordCount: peerStateCount,
        lastRecordUpdate: peerStateLatest?.lastSyncedAt?.toISOString() || null,
        lastSourceCheck: peerStateLastAttempt,
      },
    ]

    return NextResponse.json({
      sources,
      recentSyncs: recentSyncLogs.map((l) => ({
        ...l,
        startedAt: l.startedAt.toISOString(),
        completedAt: l.completedAt?.toISOString() || null,
      })),
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[GET /api/sync/status]', error)
    return NextResponse.json(
      { error: 'Internal server error', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
