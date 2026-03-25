/**
 * Ingestion Architecture Types
 *
 * Defines contracts for source adapters, normalizers, and sync orchestration.
 */

export type AdapterSource = 'ma_legislature' | 'congress_gov' | 'csv_import' | 'json_import' | 'ma_budget'

export interface FetchParams {
  since?: Date
  limit?: number
  offset?: number
  filters?: Record<string, string>
  /** For MA Legislature: search query or bill numbers */
  query?: string
  /** For Congress.gov: specific congress number */
  congress?: number
  /** For Congress.gov: fetch specific bills by type+number (e.g. ['s/2461', 'hr/3105']) */
  billNumbers?: string[]
}

export interface RawRecord<T = unknown> {
  externalId: string
  source: AdapterSource
  sourceUrl?: string
  fetchedAt: Date
  data: T
}

export interface SourceAdapter<T = unknown> {
  readonly sourceName: AdapterSource
  readonly displayName: string
  fetch(params: FetchParams): Promise<RawRecord<T>[]>
  fetchOne?(externalId: string): Promise<RawRecord<T> | null>
  validateConnection(): Promise<{ ok: boolean; message: string }>
}

export interface NormalizeResult<T> {
  normalized: T
  warnings: string[]
  unmappedFields: string[]
  /** Raw source status text preserved for display */
  rawSourceStatus?: string
}

export interface Normalizer<TRaw, TCanonical> {
  normalize(raw: TRaw): NormalizeResult<TCanonical>
}

export interface SyncResult {
  source: AdapterSource
  triggerType: 'manual' | 'scheduled' | 'cli'
  status: 'success' | 'partial' | 'failed'
  recordsProcessed: number
  recordsCreated: number
  recordsUpdated: number
  recordsSkipped: number
  errors: SyncError[]
  warnings: string[]
  startedAt: Date
  completedAt: Date
}

export interface SyncError {
  externalId: string
  message: string
  details?: unknown
}

export interface SyncStatus {
  source: AdapterSource
  displayName: string
  lastSyncAt: Date | null
  lastSyncStatus: string | null
  recordsInSystem: number
  isRunning: boolean
}

// ─── MA Legislature Raw Types ──────────────────────────────────────

export interface MALegislatureRawBill {
  billNumber: string
  title: string
  session: string
  chamber: 'House' | 'Senate'
  primarySponsor: string
  coSponsors: string[]
  committee: string
  statusText: string
  lastAction: string
  lastActionDate: string
  filingDate?: string
  url: string
  fullTextUrl?: string
}

export interface MALegislatureRawHearing {
  eventId: string
  title: string
  committee: string
  date: string
  time: string
  location: string
  relatedBills: string[]
  url: string
  status?: string
}

// ─── Congress.gov Raw Types ────────────────────────────────────────

export interface CongressGovRawBill {
  congress: number
  billType: string
  billNumber: number
  title: string
  shortTitle?: string
  sponsor: {
    name: string
    party: string
    state: string
    bioguideId?: string
  }
  cosponsors: Array<{ name: string; party: string; state: string }>
  committees: Array<{ name: string; chamber: string }>
  latestAction: {
    text: string
    actionDate: string
  }
  introducedDate: string
  policyArea?: string
  subjects?: string[]
  url: string
  congressGovUrl: string
}

// ─── Canonical Input Types (for upsert into DB) ───────────────────

export interface CanonicalLegislationInput {
  jurisdiction: 'MASSACHUSETTS' | 'FEDERAL'
  billNumber: string
  sessionNumber?: string
  title: string
  shortSummary?: string
  chamber?: 'HOUSE' | 'SENATE' | 'JOINT'
  primarySponsor?: string
  coSponsors?: string[]
  assignedCommittee?: string
  status: string
  rawSourceStatus?: string
  statusDate?: Date
  externalLinks: string[]
  issueCategory?: string
  /** Source tracking */
  dataSource: 'MA_LEGISLATURE' | 'CONGRESS_GOV' | 'CSV_IMPORT' | 'JSON_IMPORT'
  sourceUrl?: string
  sourceExternalId: string
  rawSourceData?: unknown
}

export interface CanonicalHearingInput {
  title: string
  eventType?: string
  date: Date
  time?: string
  location?: string
  committeeOrBody?: string
  jurisdiction?: 'MASSACHUSETTS' | 'FEDERAL'
  summary?: string
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELED' | 'MONITORING_ONLY'
  /** Source tracking */
  dataSource: 'MA_LEGISLATURE' | 'CONGRESS_GOV' | 'CSV_IMPORT' | 'JSON_IMPORT'
  sourceUrl?: string
  sourceExternalId: string
  rawSourceData?: unknown
  /** External IDs of related bills to link */
  relatedBillExternalIds?: string[]
}

// ─── Manual Import Types ───────────────────────────────────────────

export interface CSVImportRow {
  [key: string]: string
}

export interface JSONImportRecord {
  [key: string]: unknown
}

export interface ImportMapping {
  /** Maps source column/field to canonical field */
  fieldMap: Record<string, string>
  /** Default values for unmapped required fields */
  defaults?: Record<string, unknown>
  /** Source jurisdiction */
  jurisdiction: 'MASSACHUSETTS' | 'FEDERAL'
}

// ─── MA Budget Raw Types ─────────────────────────────────────────

export interface MABudgetRawItem {
  lineItemNumber: string
  name: string
  fiscalYear: number
  stage: string
  amount: number
  description?: string
  url: string
}

// ─── Canonical Budget Input ──────────────────────────────────────

export interface CanonicalBudgetInput {
  name: string
  lineItemNumber: string
  fiscalYear: number
  sourceStage: 'GOVERNOR' | 'HOUSE' | 'SENATE' | 'CONFERENCE' | 'FINAL' | 'SUPPLEMENTAL'
  amountProposed?: number
  status?: string
  significanceToMassCEO?: string
  notes?: string
  /** Source tracking */
  dataSource: 'MA_BUDGET' | 'CSV_IMPORT' | 'JSON_IMPORT'
  sourceUrl?: string
  sourceExternalId: string
  rawSourceData?: unknown
}
