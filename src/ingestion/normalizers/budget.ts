/**
 * Budget Normalizer
 *
 * Transforms raw budget data from external sources into the canonical BudgetItem format.
 * Currently supports CSV/JSON import of budget data.
 * Can be extended for automated budget source integration.
 */

import type { Normalizer, NormalizeResult, CSVImportRow, ImportMapping } from '../types'

interface CanonicalBudgetInput {
  fiscalYear: number
  name: string
  lineItemNumber?: string
  sourceStage: string
  amountProposed?: number
  amountAdopted?: number
  priorYearAmount?: number
  status: string
  significanceToMassCEO?: string
  notes?: string
}

const STAGE_MAP: Record<string, string> = {
  governor: 'GOVERNOR',
  "governor's": 'GOVERNOR',
  "gov": 'GOVERNOR',
  house: 'HOUSE',
  senate: 'SENATE',
  conference: 'CONFERENCE',
  final: 'FINAL',
  enacted: 'FINAL',
  supplemental: 'SUPPLEMENTAL',
  supp: 'SUPPLEMENTAL',
}

function normalizeStage(raw: string): string {
  const lower = raw.toLowerCase().trim()
  for (const [pattern, mapped] of Object.entries(STAGE_MAP)) {
    if (lower.includes(pattern)) return mapped
  }
  return 'GOVERNOR'
}

function parseCurrency(raw: string | undefined): number | undefined {
  if (!raw) return undefined
  const cleaned = raw.replace(/[$,\s]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? undefined : num
}

export class BudgetNormalizer implements Normalizer<CSVImportRow, CanonicalBudgetInput> {
  constructor(private mapping?: ImportMapping) {}

  normalize(raw: CSVImportRow): NormalizeResult<CanonicalBudgetInput> {
    const warnings: string[] = []
    const unmappedFields: string[] = []
    const m = this.mapping?.fieldMap ?? {}

    const getValue = (field: string): string | undefined => {
      const sourceField = m[field] || field
      return raw[sourceField]?.trim() || undefined
    }

    const stageRaw = getValue('sourceStage') || getValue('stage') || ''
    const mappedStage = normalizeStage(stageRaw)
    if (mappedStage === 'GOVERNOR' && stageRaw && !stageRaw.toLowerCase().includes('governor')) {
      warnings.push(`Unknown stage "${stageRaw}" — defaulting to GOVERNOR`)
    }

    const fyRaw = getValue('fiscalYear') || getValue('fy') || ''
    const fiscalYear = parseInt(fyRaw) || new Date().getFullYear()

    return {
      normalized: {
        fiscalYear,
        name: getValue('name') || getValue('description') || 'Unnamed Budget Item',
        lineItemNumber: getValue('lineItemNumber') || getValue('lineItem'),
        sourceStage: mappedStage,
        amountProposed: parseCurrency(getValue('amountProposed') || getValue('amount')),
        amountAdopted: parseCurrency(getValue('amountAdopted')),
        priorYearAmount: parseCurrency(getValue('priorYearAmount')),
        status: 'PROPOSED',
        significanceToMassCEO: getValue('significanceToMassCEO') || getValue('significance'),
        notes: getValue('notes'),
      },
      warnings,
      unmappedFields,
    }
  }
}
