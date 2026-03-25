/**
 * Manual Import Adapter
 *
 * Supports importing legislative data from CSV or JSON files.
 * Used for bulk data entry or migration from other systems.
 */

import type {
  SourceAdapter,
  FetchParams,
  RawRecord,
  CSVImportRow,
  JSONImportRecord,
  ImportMapping,
} from '../types'

export class CSVImportAdapter implements SourceAdapter<CSVImportRow> {
  readonly sourceName = 'csv_import' as const
  readonly displayName = 'CSV File Import'

  private rows: CSVImportRow[] = []
  private mapping: ImportMapping | null = null

  /**
   * Load CSV data. Call this before fetch().
   * Expects pre-parsed rows (use a CSV parser like papaparse upstream).
   */
  loadData(rows: CSVImportRow[], mapping: ImportMapping): void {
    this.rows = rows
    this.mapping = mapping
  }

  async fetch(params: FetchParams): Promise<RawRecord<CSVImportRow>[]> {
    if (!this.mapping) {
      throw new Error('No data loaded. Call loadData() before fetch().')
    }

    const limit = params.limit ?? this.rows.length
    const offset = params.offset ?? 0

    return this.rows.slice(offset, offset + limit).map((row, index) => ({
      externalId: `csv-import-${Date.now()}-${offset + index}`,
      source: 'csv_import' as const,
      fetchedAt: new Date(),
      data: row,
    }))
  }

  async validateConnection(): Promise<{ ok: boolean; message: string }> {
    if (this.rows.length === 0) {
      return { ok: false, message: 'No CSV data loaded' }
    }
    return { ok: true, message: `${this.rows.length} rows loaded` }
  }

  getMapping(): ImportMapping | null {
    return this.mapping
  }
}

export class JSONImportAdapter implements SourceAdapter<JSONImportRecord> {
  readonly sourceName = 'json_import' as const
  readonly displayName = 'JSON File Import'

  private records: JSONImportRecord[] = []
  private mapping: ImportMapping | null = null

  loadData(records: JSONImportRecord[], mapping: ImportMapping): void {
    this.records = records
    this.mapping = mapping
  }

  async fetch(params: FetchParams): Promise<RawRecord<JSONImportRecord>[]> {
    if (!this.mapping) {
      throw new Error('No data loaded. Call loadData() before fetch().')
    }

    const limit = params.limit ?? this.records.length
    const offset = params.offset ?? 0

    return this.records.slice(offset, offset + limit).map((record, index) => ({
      externalId: `json-import-${Date.now()}-${offset + index}`,
      source: 'json_import' as const,
      fetchedAt: new Date(),
      data: record,
    }))
  }

  async validateConnection(): Promise<{ ok: boolean; message: string }> {
    if (this.records.length === 0) {
      return { ok: false, message: 'No JSON data loaded' }
    }
    return { ok: true, message: `${this.records.length} records loaded` }
  }

  getMapping(): ImportMapping | null {
    return this.mapping
  }
}
