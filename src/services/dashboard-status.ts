import { prisma } from '@/lib/db'
import { CONTENT_CLASS_DATASOURCES } from '@/lib/source-metadata'
import { ADAPTER_REGISTRY } from '@/ingestion/adapters'

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

/** Map adapter source key to DataSource enum values used in entity tables */
const ADAPTER_TO_DATASOURCE: Record<string, string> = {
  ma_legislature: 'MA_LEGISLATURE',
  ma_budget: 'MA_LEGISLATURE',
  congress_gov: 'CONGRESS_GOV',
  csv_import: 'CSV_IMPORT',
  json_import: 'JSON_IMPORT',
}

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
): 'healthy' | 'warning' | 'error' | 'not_configured' {
  if (!lastSyncStatus && recordCount === 0) return 'not_configured'
  if (lastSyncStatus === 'failed') return 'error'
  if (lastSyncStatus === 'partial') return 'warning'

  if (lastSyncAt) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    if (lastSyncAt < sevenDaysAgo) return 'warning'
  }

  if (lastSyncStatus === 'success' && recordCount === 0) return 'warning'
  if (lastSyncStatus === 'success' && recordCount > 0) return 'healthy'

  // Has records but no sync history (e.g. manual records counted against an adapter)
  if (recordCount > 0) return 'healthy'

  return 'not_configured'
}

export async function getDashboardStatusData(): Promise<DashboardStatusData> {
  const [byDataSource, lastGlobalSync] = await Promise.all([
    countByDataSource(),
    prisma.syncLog.findFirst({
      where: { status: 'success' },
      orderBy: { completedAt: 'desc' },
    }),
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

  // Source health for each adapter
  const sourceHealth: SourceHealthEntry[] = []

  for (const adapter of ADAPTER_REGISTRY) {
    const dsKey = ADAPTER_TO_DATASOURCE[adapter.source]
    const recordCount = dsKey ? (byDataSource[dsKey] || 0) : 0

    const lastSync = await prisma.syncLog.findFirst({
      where: { source: adapter.source },
      orderBy: { startedAt: 'desc' },
    })

    const runningSync = await prisma.syncLog.findFirst({
      where: { source: adapter.source, status: 'running' },
    })

    sourceHealth.push({
      source: adapter.source,
      displayName: adapter.displayName,
      status: deriveStatus(
        lastSync?.status ?? null,
        lastSync?.completedAt ?? lastSync?.startedAt ?? null,
        recordCount,
      ),
      lastSyncAt: lastSync?.completedAt?.toISOString() ?? lastSync?.startedAt?.toISOString() ?? null,
      lastSyncStatus: lastSync?.status ?? null,
      recordCount,
      isRunning: !!runningSync,
    })
  }

  // Add synthetic "Manual Entry" source
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
