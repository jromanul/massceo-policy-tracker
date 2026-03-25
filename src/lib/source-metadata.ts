/**
 * Source metadata derivation utilities.
 *
 * Centralizes all derived-field logic so the SourceMetadataCard
 * component stays declarative.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type DataOrigin = 'Seeded' | 'Imported' | 'Manual'
export type AuthoritativeStatus = 'Authoritative' | 'Non-authoritative' | 'Internal-only'

export interface SourceMetadataFields {
  dataSource: string
  sourceUrl?: string | null
  sourceExternalId?: string | null
  lastSyncedAt?: string | null
  sourceRetrievedAt?: string | null
  rawSourceStatus?: string | null
}

// ── Source system display config ──────────────────────────────────────────────

const SOURCE_SYSTEM_NAMES: Record<string, string> = {
  MANUAL: 'Manual Entry',
  SEED: 'Sample Data',
  MA_LEGISLATURE: 'Massachusetts Legislature (malegislature.gov)',
  CONGRESS_GOV: 'Congress.gov',
  CSV_IMPORT: 'CSV Import',
  JSON_IMPORT: 'JSON Import',
}

const ADAPTER_NAMES: Record<string, string> = {
  MA_LEGISLATURE: 'MA Legislature Adapter',
  CONGRESS_GOV: 'Congress.gov Adapter',
  CSV_IMPORT: 'CSV Import Adapter',
  JSON_IMPORT: 'JSON Import Adapter',
}

// ── Derivation functions ──────────────────────────────────────────────────────

export function getDataOrigin(dataSource: string): DataOrigin {
  if (dataSource === 'SEED') return 'Seeded'
  if (['MA_LEGISLATURE', 'CONGRESS_GOV', 'CSV_IMPORT', 'JSON_IMPORT'].includes(dataSource)) {
    return 'Imported'
  }
  return 'Manual'
}

export function getAuthoritativeStatus(dataSource: string): AuthoritativeStatus {
  if (['MA_LEGISLATURE', 'CONGRESS_GOV'].includes(dataSource)) return 'Authoritative'
  if (['CSV_IMPORT', 'JSON_IMPORT'].includes(dataSource)) return 'Non-authoritative'
  return 'Internal-only'
}

export function getSourcePriority(dataSource: string): number {
  const priorities: Record<string, number> = {
    MA_LEGISLATURE: 1,
    CONGRESS_GOV: 2,
    CSV_IMPORT: 3,
    JSON_IMPORT: 3,
    MANUAL: 4,
    SEED: 5,
  }
  return priorities[dataSource] ?? 4
}

export function getSourceSystemName(dataSource: string): string {
  return SOURCE_SYSTEM_NAMES[dataSource] ?? 'Unknown'
}

export function getImportAdapterName(dataSource: string): string | null {
  return ADAPTER_NAMES[dataSource] ?? null
}

export function getSourceNote(
  dataSource: string,
  jurisdiction?: string | null,
): string | null {
  if (dataSource === 'MA_LEGISLATURE') {
    return 'This record is based on Massachusetts Legislature data from malegislature.gov.'
  }
  if (dataSource === 'CONGRESS_GOV') {
    return 'This record is based on Congress.gov data via the Congress.gov API.'
  }
  if (dataSource === 'CSV_IMPORT') {
    return 'This record was imported from a CSV file.'
  }
  if (dataSource === 'JSON_IMPORT') {
    return 'This record was imported from a JSON file.'
  }
  if (dataSource === 'SEED') {
    return 'This record contains sample data for demonstration purposes.'
  }
  return null
}

/**
 * Returns a list of required source fields that are missing.
 * Only flags missing fields for imported records (not MANUAL/SEED).
 */
export function getMissingFields(meta: SourceMetadataFields): string[] {
  const origin = getDataOrigin(meta.dataSource)
  if (origin !== 'Imported') return []

  const missing: string[] = []
  if (!meta.sourceUrl) missing.push('Source URL')
  if (!meta.sourceExternalId) missing.push('Source Record ID')
  if (!meta.lastSyncedAt) missing.push('Last Successful Sync')
  return missing
}

// ── Content Classification ──────────────────────────────────────────────────

export type ContentClass = 'authoritative_external' | 'internal_manual' | 'sample_demo'

export function getContentClass(dataSource: string): ContentClass {
  if (['MA_LEGISLATURE', 'CONGRESS_GOV'].includes(dataSource)) return 'authoritative_external'
  if (dataSource === 'SEED') return 'sample_demo'
  return 'internal_manual'
}

export const CONTENT_CLASS_CONFIG: Record<ContentClass, { label: string; description: string }> = {
  authoritative_external: { label: 'Authoritative', description: 'From official government sources' },
  internal_manual: { label: 'Internal', description: 'Staff-entered or imported data' },
  sample_demo: { label: 'Sample/Demo', description: 'Demonstration data only' },
}

export const CONTENT_CLASS_DATASOURCES: Record<ContentClass, string[]> = {
  authoritative_external: ['MA_LEGISLATURE', 'CONGRESS_GOV'],
  internal_manual: ['MANUAL', 'CSV_IMPORT', 'JSON_IMPORT'],
  sample_demo: ['SEED'],
}

/** Check if a record's dataSource indicates seed/demo data */
export function isSeedData(dataSource: string): boolean {
  return dataSource === 'SEED'
}

export const CONTENT_CLASS_OPTIONS = [
  { value: 'authoritative_external', label: 'Authoritative External' },
  { value: 'internal_manual', label: 'Internal' },
  { value: 'sample_demo', label: 'Sample/Demo' },
]
