/**
 * Ingestion Module — Public API
 *
 * Entry point for all sync operations.
 */

export { syncLegislation, syncHearings, syncBudget, syncBudgetFromAdapter, syncAll } from './orchestrator'
export { recordSyncRun, getRecentSyncLogs, getLastSuccessfulSync, getSyncStatusForAllSources, getSyncLogsBySource } from './sync-log'
export { ADAPTER_REGISTRY, createBillAdapter, createHearingAdapter } from './adapters'
export type { AdapterSource, SyncResult, SyncStatus, SyncError, FetchParams } from './types'
