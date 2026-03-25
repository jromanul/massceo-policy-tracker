/**
 * Legislation Normalizer
 *
 * Transforms raw bill data from MA Legislature and Congress.gov
 * into the canonical LegislativeItem input format.
 */

import type {
  Normalizer,
  NormalizeResult,
  MALegislatureRawBill,
  CongressGovRawBill,
  CSVImportRow,
  CanonicalLegislationInput,
  ImportMapping,
} from '../types'

/** Map raw MA Legislature status text to internal LegislativeStatus enum values */
const MA_STATUS_MAP: Record<string, string> = {
  // Common status texts from malegislature.gov
  'referred to committee': 'IN_COMMITTEE',
  'in committee': 'IN_COMMITTEE',
  'referred to the committee': 'IN_COMMITTEE',
  'reported favorably': 'REPORTED_OUT',
  'reported out': 'REPORTED_OUT',
  'reported out favorably': 'REPORTED_OUT',
  'passed to be engrossed': 'PASSED_ONE_CHAMBER',
  'passed to be enacted': 'PASSED_BOTH_CHAMBERS',
  'enacted': 'ENACTED',
  'signed by the governor': 'ENACTED',
  'vetoed': 'VETOED',
  'filed': 'FILED',
  'accompanied a study order': 'DEAD',
  'no further action': 'DEAD',
  'new draft': 'IN_COMMITTEE',
  'new draft substituted': 'IN_COMMITTEE',
  'discharged to the committee': 'IN_COMMITTEE',
  'hearing scheduled': 'IN_COMMITTEE',
  'recommitted': 'IN_COMMITTEE',
  'read second': 'PASSED_ONE_CHAMBER',
  'read third and passed': 'PASSED_ONE_CHAMBER',
  'senate concurred': 'PASSED_BOTH_CHAMBERS',
  'house concurred': 'PASSED_BOTH_CHAMBERS',
}

function normalizeMAStatus(rawStatus: string): string {
  const lower = rawStatus.toLowerCase().trim()

  // Check direct matches first
  if (MA_STATUS_MAP[lower]) return MA_STATUS_MAP[lower]

  // Check partial matches
  for (const [pattern, mapped] of Object.entries(MA_STATUS_MAP)) {
    if (lower.includes(pattern)) return mapped
  }

  return 'MONITORING'
}

function parseDateSafe(dateStr: string | undefined): Date | undefined {
  if (!dateStr) return undefined
  const parsed = new Date(dateStr)
  return isNaN(parsed.getTime()) ? undefined : parsed
}

function normalizeMAChamber(chamber: string): 'HOUSE' | 'SENATE' | 'JOINT' {
  const lower = chamber.toLowerCase()
  if (lower === 'senate' || lower === 's') return 'SENATE'
  if (lower === 'joint') return 'JOINT'
  return 'HOUSE'
}

export class MALegislatureNormalizer
  implements Normalizer<MALegislatureRawBill, CanonicalLegislationInput>
{
  normalize(raw: MALegislatureRawBill): NormalizeResult<CanonicalLegislationInput> {
    const warnings: string[] = []
    const unmappedFields: string[] = []

    const normalizedStatus = normalizeMAStatus(raw.statusText)
    if (normalizedStatus === 'MONITORING' && raw.statusText) {
      warnings.push(`Unknown MA status "${raw.statusText}" — mapped to MONITORING`)
    }

    const statusDate = parseDateSafe(raw.lastActionDate)
    if (raw.lastActionDate && !statusDate) {
      warnings.push(`Could not parse date "${raw.lastActionDate}"`)
    }

    return {
      normalized: {
        jurisdiction: 'MASSACHUSETTS',
        billNumber: raw.billNumber,
        sessionNumber: raw.session,
        title: raw.title,
        shortSummary: raw.lastAction || undefined,
        chamber: normalizeMAChamber(raw.chamber),
        primarySponsor: raw.primarySponsor || undefined,
        coSponsors: raw.coSponsors,
        assignedCommittee: raw.committee || undefined,
        status: normalizedStatus,
        rawSourceStatus: raw.statusText,
        statusDate,
        externalLinks: [raw.url, raw.fullTextUrl].filter(Boolean) as string[],
        dataSource: 'MA_LEGISLATURE',
        sourceUrl: raw.url,
        sourceExternalId: `ma-194-${raw.billNumber.replace(/[\s.]/g, '')}`,
        rawSourceData: raw,
      },
      warnings,
      unmappedFields,
      rawSourceStatus: raw.statusText,
    }
  }
}

/** Map Congress.gov latest action text to internal status */
const CONGRESS_STATUS_MAP: Record<string, string> = {
  'introduced': 'FILED',
  'referred to': 'IN_COMMITTEE',
  'reported by': 'REPORTED_OUT',
  'reported (amended)': 'REPORTED_OUT',
  'placed on the union calendar': 'REPORTED_OUT',
  'placed on senate legislative calendar': 'REPORTED_OUT',
  'held at the desk': 'PASSED_ONE_CHAMBER',
  'received in the senate': 'PASSED_ONE_CHAMBER',
  'received in the house': 'PASSED_ONE_CHAMBER',
  'passed house': 'PASSED_ONE_CHAMBER',
  'passed senate': 'PASSED_ONE_CHAMBER',
  'resolving differences': 'PASSED_ONE_CHAMBER',
  'passed/agreed to in': 'PASSED_ONE_CHAMBER',
  'motion to reconsider laid on the table': 'PASSED_ONE_CHAMBER',
  'sent to president': 'PASSED_BOTH_CHAMBERS',
  'presented to president': 'PASSED_BOTH_CHAMBERS',
  'became public law': 'ENACTED',
  'signed by president': 'ENACTED',
  'vetoed by president': 'VETOED',
  'pocket vetoed': 'VETOED',
}

function normalizeCongressStatus(latestActionText: string): string {
  const lower = latestActionText.toLowerCase()

  for (const [pattern, mapped] of Object.entries(CONGRESS_STATUS_MAP)) {
    if (lower.includes(pattern)) return mapped
  }

  return 'MONITORING'
}

function normalizeCongressChamber(billType: string): 'HOUSE' | 'SENATE' | 'JOINT' {
  const lower = billType.toLowerCase()
  if (lower.startsWith('s') || lower === 'sres' || lower === 'sconres' || lower === 'sjres') return 'SENATE'
  if (lower.includes('jres') || lower.includes('conres')) return 'JOINT'
  return 'HOUSE'
}

export class CongressGovNormalizer
  implements Normalizer<CongressGovRawBill, CanonicalLegislationInput>
{
  normalize(raw: CongressGovRawBill): NormalizeResult<CanonicalLegislationInput> {
    const warnings: string[] = []
    const unmappedFields: string[] = []

    const actionText = raw.latestAction?.text || ''
    const normalizedStatus = normalizeCongressStatus(actionText)
    if (normalizedStatus === 'MONITORING' && actionText) {
      warnings.push(`Unknown Congress status "${actionText}" — mapped to MONITORING`)
    }

    const billNumberStr = `${raw.billType.toUpperCase()} ${raw.billNumber}`

    return {
      normalized: {
        jurisdiction: 'FEDERAL',
        billNumber: billNumberStr,
        sessionNumber: String(raw.congress),
        title: raw.title,
        shortSummary: raw.shortTitle || (actionText ? `Latest: ${actionText}` : undefined),
        chamber: normalizeCongressChamber(raw.billType),
        primarySponsor: raw.sponsor?.name,
        coSponsors: raw.cosponsors?.map((c) => c.name) || [],
        assignedCommittee: raw.committees?.[0]?.name,
        status: normalizedStatus,
        rawSourceStatus: actionText,
        statusDate: parseDateSafe(raw.latestAction?.actionDate),
        externalLinks: [raw.congressGovUrl, raw.url].filter(Boolean),
        issueCategory: raw.policyArea || undefined,
        dataSource: 'CONGRESS_GOV',
        sourceUrl: raw.congressGovUrl,
        sourceExternalId: `congress_gov-${raw.congress}-${raw.billType.toLowerCase()}-${raw.billNumber}`,
        rawSourceData: raw,
      },
      warnings,
      unmappedFields,
      rawSourceStatus: actionText,
    }
  }
}

/**
 * CSV Import Normalizer — maps CSV rows to canonical legislation input
 * using a user-provided field mapping.
 */
export class CSVLegislationNormalizer
  implements Normalizer<CSVImportRow, CanonicalLegislationInput>
{
  constructor(private mapping: ImportMapping) {}

  normalize(raw: CSVImportRow): NormalizeResult<CanonicalLegislationInput> {
    const warnings: string[] = []
    const unmappedFields: string[] = []
    const m = this.mapping.fieldMap

    const getValue = (canonicalField: string): string | undefined => {
      const sourceField = m[canonicalField]
      if (!sourceField) return undefined
      return raw[sourceField]?.trim() || undefined
    }

    const title = getValue('title') || 'Untitled Import'
    const billNumber = getValue('billNumber') || `IMPORT-${Date.now()}`

    // Track unmapped columns
    const mappedSourceFields = new Set(Object.values(m))
    for (const col of Object.keys(raw)) {
      if (!mappedSourceFields.has(col)) {
        unmappedFields.push(col)
      }
    }

    const rawStatus = getValue('status') || ''
    const normalizedStatus = normalizeMAStatus(rawStatus) || 'MONITORING'

    const coSponsorsRaw = getValue('coSponsors')
    const coSponsors = coSponsorsRaw
      ? coSponsorsRaw.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
      : []

    return {
      normalized: {
        jurisdiction: this.mapping.jurisdiction,
        billNumber,
        sessionNumber: getValue('sessionNumber'),
        title,
        shortSummary: getValue('shortSummary'),
        primarySponsor: getValue('primarySponsor'),
        coSponsors,
        assignedCommittee: getValue('assignedCommittee'),
        status: normalizedStatus,
        rawSourceStatus: rawStatus || undefined,
        statusDate: parseDateSafe(getValue('statusDate')),
        externalLinks: getValue('externalLink') ? [getValue('externalLink')!] : [],
        issueCategory: getValue('issueCategory'),
        dataSource: 'CSV_IMPORT',
        sourceExternalId: `csv-${billNumber}-${Date.now()}`,
        rawSourceData: raw,
      },
      warnings,
      unmappedFields,
    }
  }
}
