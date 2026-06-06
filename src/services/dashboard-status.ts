import { prisma } from '@/lib/db'
import { CONTENT_CLASS_DATASOURCES } from '@/lib/source-metadata'

export interface SourceHealthEntry {
  source: string
  displayName: string
  status: 'healthy' | 'warning' | 'error' | 'not_configured'
  lastSyncAt: string | null
  lastSyncStatus: string | null
  recordCount: number
  isRunning: boolean
}

export interface DashboardStatusData {
  contentCounts: {
    external: number
    internal: number
    sampleDemo: number
    total: number
  }
  sourceHealth: SourceHealthEntry[]
  lastSuccessfulSync: string | null
}

/**
 * A "running" SyncLog row older than this is treated as STUCK (Vercel killed
 * the function mid-run before it could write a terminal status), not actually
 * in progress. Without this guard a single timed-out run renders as a perpetual
 * blue "running" badge and — worse — hides the source's real last result.
 */
const RUNNING_STALE_MS = 10 * 60 * 1000

/**
 * Per-feed health descriptor. Critically, each feed counts its OWN entity table
 * and reads its OWN SyncLog `source` key. The previous implementation mapped
 * both `ma_legislature` and `ma_budget` to the single `MA_LEGISLATURE`
 * DataSource enum, so every MA row printed the same inflated aggregate
 * (bills + hearings + budget) and the OpenStates feed was omitted entirely.
 */
interface FeedDef {
  key: string
  displayName: string
  /** SyncLog.source value this feed's cron actually writes. */
  logSource: string
  /** Warn if the last completed sync is older than this many hours. */
  maxAgeHours: number
  count: () => Promise<number>
}

const FEEDS: FeedDef[] = [
  {
    key: 'ma_legislature',
    displayName: 'MA Legislature (Bills)',
    logSource: 'ma_legislature',
    maxAgeHours: 36,
    count: () => prisma.legislativeItem.count({ where: { dataSource: 'MA_LEGISLATURE' as never } }),
  },
  {
    key: 'ma_legislature_hearings',
    displayName: 'MA Legislature (Hearings)',
    logSource: 'ma_legislature_hearings',
    maxAgeHours: 36,
    count: () => prisma.hearing.count({ where: { dataSource: 'MA_LEGISLATURE' as never } }),
  },
  {
    key: 'congress_gov',
    displayName: 'Congress.gov (Federal)',
    logSource: 'congress_gov',
    maxAgeHours: 36,
    count: () => prisma.legislativeItem.count({ where: { dataSource: 'CONGRESS_GOV' as never } }),
  },
  {
    key: 'ma_budget',
    displayName: 'MA Budget',
    logSource: 'ma_budget_budget',
    maxAgeHours: 36,
    count: () => prisma.budgetItem.count(),
  },
  {
    key: 'openstates_peer_state_bills',
    displayName: 'Peer States (OpenStates)',
    // OpenStates rotates ~2 states/day through 51 jurisdictions, so any single
    // state legitimately goes a couple of weeks between refreshes. Use a much
    // looser staleness window than the daily MA/federal crons.
    logSource: 'openstates_peer_state_bills',
    maxAgeHours: 60,
    count: () =>
      prisma.peerStateBill.count({
        where: { archived: false, NOT: { billNumber: '__CHECKPOINT__' } },
      }),
  },
]

async function countByDataSource(): Promise<Record<string, number>> {
  const [legCounts, budgetCounts, hearingCounts, policyCounts] = await Promise.all([
    prisma.legislativeItem.groupBy({ by: ['dataSource'], _count: true }),
    prisma.budgetItem.groupBy({ by: ['dataSource'], _count: true }),
    prisma.hearing.groupBy({ by: ['dataSource'], _count: true }),
    prisma.policyIdea.groupBy({ by: ['dataSource'], _count: true }),
  ])

  const totals: Record<string, number> = {}
  for (const group of [...legCounts, ...budgetCounts, ...hearingCounts, ...policyCounts]) {
    totals[group.dataSource] = (totals[group.dataSource] || 0) + group._count
  }
  return totals
}

function deriveStatus(
  lastSyncStatus: string | null,
  lastSyncAt: Date | null,
  recordCount: number,
  maxAgeHours: number,
): 'healthy' | 'warning' | 'error' | 'not_configured' {
  if (!lastSyncStatus && recordCount === 0) return 'not_configured'
  if (lastSyncStatus === 'failed') return 'error'
  if (lastSyncStatus === 'partial') return 'warning'

  if (lastSyncAt) {
    const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000)
    if (lastSyncAt < cutoff) return 'warning'
  }

  if (lastSyncStatus === 'success' && recordCount === 0) return 'warning'
  if (lastSyncStatus === 'success' && recordCount > 0) return 'healthy'

  // Has records but no sync history (e.g. manual records counted against a feed)
  if (recordCount > 0) return 'healthy'

  return 'not_configured'
}

async function feedHealth(feed: FeedDef): Promise<SourceHealthEntry> {
  const [recordCount, lastSync, runningSync] = await Promise.all([
    feed.count(),
    // Last COMPLETED sync drives status + timestamp. Excluding "running" rows
    // means a stuck/timed-out run never masks the source's real last result.
    prisma.syncLog.findFirst({
      where: { source: feed.logSource, status: { not: 'running' } },
      orderBy: { startedAt: 'desc' },
    }),
    // Only a recently-started "running" row counts as genuinely in-progress.
    prisma.syncLog.findFirst({
      where: {
        source: feed.logSource,
        status: 'running',
        startedAt: { gte: new Date(Date.now() - RUNNING_STALE_MS) },
      },
    }),
  ])

  const lastSyncAt = lastSync?.completedAt ?? lastSync?.startedAt ?? null
  return {
    source: feed.key,
    displayName: feed.displayName,
    status: deriveStatus(lastSync?.status ?? null, lastSyncAt, recordCount, feed.maxAgeHours),
    lastSyncAt: lastSyncAt?.toISOString() ?? null,
    lastSyncStatus: lastSync?.status ?? null,
    recordCount,
    isRunning: !!runningSync,
  }
}

export async function getDashboardStatusData(): Promise<DashboardStatusData> {
  const [byDataSource, lastGlobalSync, feedHealthEntries] = await Promise.all([
    countByDataSource(),
    prisma.syncLog.findFirst({
      where: { status: 'success' },
      orderBy: { completedAt: 'desc' },
    }),
    Promise.all(FEEDS.map(feedHealth)),
  ])

  // Bucket into content classes
  const external = CONTENT_CLASS_DATASOURCES.authoritative_external.reduce(
    (sum, ds) => sum + (byDataSource[ds] || 0), 0,
  )
  const internal = CONTENT_CLASS_DATASOURCES.internal_manual.reduce(
    (sum, ds) => sum + (byDataSource[ds] || 0), 0,
  )
  const sampleDemo = CONTENT_CLASS_DATASOURCES.sample_demo.reduce(
    (sum, ds) => sum + (byDataSource[ds] || 0), 0,
  )

  const sourceHealth: SourceHealthEntry[] = [...feedHealthEntries]

  // Synthetic "Manual Entry" source
  const manualCount = byDataSource['MANUAL'] || 0
  sourceHealth.push({
    source: 'manual',
    displayName: 'Manual Entries',
    status: manualCount > 0 ? 'healthy' : 'not_configured',
    lastSyncAt: null,
    lastSyncStatus: null,
    recordCount: manualCount,
    isRunning: false,
  })

  return {
    contentCounts: {
      external,
      internal,
      sampleDemo,
      total: external + internal + sampleDemo,
    },
    sourceHealth,
    lastSuccessfulSync: lastGlobalSync?.completedAt?.toISOString() ?? null,
  }
}
