/**
 * Adapter Registry
 *
 * Central registry of all available source adapters.
 */

import { MALegislatureAdapter, MALegislatureHearingAdapter } from './malegislature'
import { CongressGovAdapter } from './congress-gov'
import { CSVImportAdapter, JSONImportAdapter } from './manual-import'
import { MABudgetAdapter } from './malegislature-budget'
import type { AdapterSource } from '../types'

export interface AdapterInfo {
  source: AdapterSource
  displayName: string
  description: string
  entityTypes: ('legislation' | 'hearing' | 'budget')[]
  requiresApiKey: boolean
}

export const ADAPTER_REGISTRY: AdapterInfo[] = [
  {
    source: 'ma_legislature',
    displayName: 'MA Legislature',
    description: 'Bills and hearings from malegislature.gov (194th General Court)',
    entityTypes: ['legislation', 'hearing'],
    requiresApiKey: false,
  },
  {
    source: 'congress_gov',
    displayName: 'Congress.gov',
    description: 'Federal legislation from Congress.gov API (119th Congress)',
    entityTypes: ['legislation'],
    requiresApiKey: true,
  },
  {
    source: 'csv_import',
    displayName: 'CSV Import',
    description: 'Import legislation data from CSV files',
    entityTypes: ['legislation'],
    requiresApiKey: false,
  },
  {
    source: 'json_import',
    displayName: 'JSON Import',
    description: 'Import legislation data from JSON files',
    entityTypes: ['legislation'],
    requiresApiKey: false,
  },
  {
    source: 'ma_budget',
    displayName: 'MA Budget',
    description: 'Massachusetts budget data from budget.digital.mass.gov',
    entityTypes: ['budget'],
    requiresApiKey: false,
  },
]

export function createBillAdapter(source: AdapterSource) {
  switch (source) {
    case 'ma_legislature':
      return new MALegislatureAdapter()
    case 'congress_gov':
      return new CongressGovAdapter()
    case 'csv_import':
      return new CSVImportAdapter()
    case 'json_import':
      return new JSONImportAdapter()
    default:
      throw new Error(`Unknown adapter source: ${source}`)
  }
}

export function createHearingAdapter(source: AdapterSource) {
  switch (source) {
    case 'ma_legislature':
      return new MALegislatureHearingAdapter()
    default:
      throw new Error(`No hearing adapter available for source: ${source}`)
  }
}

export function createBudgetAdapter(source: AdapterSource) {
  switch (source) {
    case 'ma_budget':
      return new MABudgetAdapter()
    default:
      throw new Error(`No budget adapter available for source: ${source}`)
  }
}

export {
  MALegislatureAdapter,
  MALegislatureHearingAdapter,
  CongressGovAdapter,
  CSVImportAdapter,
  JSONImportAdapter,
  MABudgetAdapter,
}
