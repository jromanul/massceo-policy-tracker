/**
 * Sync Log Service
 *
 * Records and retrieves sync run history.
 * Used by the orchestrator and admin UI.
 */

import { prisma } from '@/lib/db'
import type { SyncResult, AdapterSource, SyncStatus } from './types'
import { ADAPTER_REGISTRY } from './adapters'

export async function recordSyncRun(result: SyncResult): Promise<void> {
  await prisma.syncLog.create({
    data: {
      source: result.source,
      status: result.status,
      triggerType: result.triggerType,
      recordsProcessed: result.recordsProcessed,
      recordsCreated: result.recordsCreated,
      recordsUpdated: result.recordsUpdated,
      recordsSkipped: result.recordsSkipped,
      errors: result.errors.length > 0 ? JSON.stringify(result.errors) : null,
      warnings: result.warnings.length > 0 ? JSON.stringify(result.warnings) : null,
      startedAt: result.startedAt,
      completedAt: result.completedAt,
    },
  })
}

export async function getRecentSyncLogs(limit = 50) {
  return prisma.syncLog.findMany({
    orderBy: { startedAt: 'desc' },
    take: limit,
  })
}

export async function getLastSuccessfulSync(source: string) {
  return prisma.syncLog.findFirst({
    where: { source, status: 'success' },
    orderBy: { completedAt: 'desc' },
  })
}

export async function getSyncStatusForAllSources(): Promise<SyncStatus[]> {
  const statuses: SyncStatus[] = []

  for (const adapter of ADAPTER_REGISTRY) {
    const lastSync = await prisma.syncLog.findFirst({
      where: { source: adapter.source },
      orderBy: { startedAt: 'desc' },
    })

    const recordsInSystem = await prisma.legislativeItem.count({
      where: { dataSource: adapter.source.toUpperCase().replace(/-/g, '_') as any },
    })

    // Check if there's a currently running sync
    const runningSync = await prisma.syncLog.findFirst({
      where: { source: adapter.source, status: 'running' },
    })

    statuses.push({
      source: adapter.source,
      displayName: adapter.displayName,
      lastSyncAt: lastSync?.completedAt ?? lastSync?.startedAt ?? null,
      lastSyncStatus: lastSync?.status ?? null,
      recordsInSystem,
      isRunning: !!runningSync,
    })
  }

  return statuses
}

export async function getSyncLogsBySource(source: string, limit = 20) {
  return prisma.syncLog.findMany({
    where: { source },
    orderBy: { startedAt: 'desc' },
    take: limit,
  })
}
