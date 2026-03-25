/**
 * MA Budget Adapter
 *
 * Scrapes Massachusetts budget data from budget.digital.mass.gov
 * to find EO-relevant line items (MassCEO, cooperative programs, SBDC).
 *
 * Target sources:
 *   - https://budget.digital.mass.gov/govbudget/fy27/  (Governor's budget)
 *   - https://budget.digital.mass.gov/summary/fy27     (Summary)
 *   - https://malegislature.gov/Budget                  (House/Senate/Conference)
 *
 * Strategy: Fetch the budget API for known EO-relevant line items
 * and any matching keyword searches.
 */

import type { SourceAdapter, RawRecord, FetchParams, MABudgetRawItem } from '../types'

/** Line items we always check for */
const TRACKED_LINE_ITEMS = [
  '7002-1075', // MassCEO
  '7002-0100', // MOBD (parent agency)
  '7002-1508', // Small Business Development Center
]

/** Keywords to search budget descriptions for additional relevant items */
const EO_KEYWORDS = [
  'employee ownership',
  'employee-owned',
  'worker cooperative',
  'worker-owned',
  'massceo',
  'center for employee ownership',
  'esop',
]

const BUDGET_API_BASE = 'https://budget.digital.mass.gov'

export class MABudgetAdapter implements SourceAdapter<MABudgetRawItem> {
  readonly sourceName = 'ma_budget' as const
  readonly displayName = 'MA Budget (budget.digital.mass.gov)'

  async fetch(params: FetchParams): Promise<RawRecord<MABudgetRawItem>[]> {
    const results: RawRecord<MABudgetRawItem>[] = []
    const now = new Date()

    // Determine which fiscal years to check
    const currentFY = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear()
    const fiscalYears = [currentFY, currentFY + 1]

    for (const fy of fiscalYears) {
      const fyShort = `fy${String(fy).slice(2)}`

      // Try the budget.digital.mass.gov API for each tracked line item
      for (const lineItem of TRACKED_LINE_ITEMS) {
        try {
          const record = await this.fetchLineItem(lineItem, fy, fyShort)
          if (record) {
            results.push(record)
          }
        } catch (err) {
          console.warn(`[MABudgetAdapter] Failed to fetch ${lineItem} for FY${fy}:`, err instanceof Error ? err.message : err)
        }
      }

      // Also try to fetch the summary/appropriation page for keyword matches
      try {
        const keywordResults = await this.fetchByKeywords(fy, fyShort)
        // Deduplicate against already-found line items
        const existingIds = new Set(results.map((r) => r.externalId))
        for (const record of keywordResults) {
          if (!existingIds.has(record.externalId)) {
            results.push(record)
            existingIds.add(record.externalId)
          }
        }
      } catch (err) {
        console.warn(`[MABudgetAdapter] Keyword search failed for FY${fy}:`, err instanceof Error ? err.message : err)
      }

      if (params.limit && results.length >= params.limit) break
    }

    console.log(`[MABudgetAdapter] Fetched ${results.length} budget records`)
    return results
  }

  private async fetchLineItem(
    lineItemNumber: string,
    fiscalYear: number,
    fyShort: string,
  ): Promise<RawRecord<MABudgetRawItem> | null> {
    // Try the budget.digital.mass.gov API endpoint
    // The API structure: /api/fy27/governor/appropriation/{lineItem}
    const stages = ['governor', 'house', 'senate', 'conference', 'final']

    for (const stage of stages) {
      try {
        const url = `${BUDGET_API_BASE}/api/${fyShort}/${stage}/appropriation/${lineItemNumber}`
        const response = await fetch(url, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(10000),
        })

        if (!response.ok) continue

        const data = await response.json()
        if (!data || (Array.isArray(data) && data.length === 0)) continue

        const item = Array.isArray(data) ? data[0] : data
        const amount = Number(item.amount ?? item.appropriation ?? item.total ?? 0)

        return {
          externalId: `ma-budget-${lineItemNumber}-${fyShort}-${stage}`,
          source: 'ma_budget',
          sourceUrl: `${BUDGET_API_BASE}/govbudget/${fyShort}/`,
          fetchedAt: new Date(),
          data: {
            lineItemNumber,
            name: item.name ?? item.description ?? item.title ?? lineItemNumber,
            fiscalYear,
            stage: stage.toUpperCase(),
            amount,
            description: item.description ?? item.name ?? undefined,
            url: `${BUDGET_API_BASE}/govbudget/${fyShort}/`,
          },
        }
      } catch {
        // This stage endpoint doesn't exist or isn't available yet
        continue
      }
    }

    // If no API endpoint worked, try the HTML summary page
    try {
      const summaryUrl = `${BUDGET_API_BASE}/summary/${fyShort}/line-item/${lineItemNumber}`
      const response = await fetch(summaryUrl, {
        headers: { Accept: 'text/html' },
        signal: AbortSignal.timeout(10000),
      })

      if (response.ok) {
        const html = await response.text()
        // Extract amount from the summary page (look for dollar amounts)
        const amountMatch = html.match(/\$([0-9,]+)/)
        const amount = amountMatch ? Number(amountMatch[1].replace(/,/g, '')) : 0

        return {
          externalId: `ma-budget-${lineItemNumber}-${fyShort}-summary`,
          source: 'ma_budget',
          sourceUrl: summaryUrl,
          fetchedAt: new Date(),
          data: {
            lineItemNumber,
            name: `Line Item ${lineItemNumber}`,
            fiscalYear,
            stage: 'GOVERNOR',
            amount,
            url: summaryUrl,
          },
        }
      }
    } catch {
      // Summary page not available
    }

    return null
  }

  private async fetchByKeywords(
    fiscalYear: number,
    fyShort: string,
  ): Promise<RawRecord<MABudgetRawItem>[]> {
    const results: RawRecord<MABudgetRawItem>[] = []

    // Try searching the budget API for EO-relevant keywords
    for (const keyword of EO_KEYWORDS.slice(0, 3)) {
      try {
        const searchUrl = `${BUDGET_API_BASE}/api/${fyShort}/governor/search?q=${encodeURIComponent(keyword)}`
        const response = await fetch(searchUrl, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(10000),
        })

        if (!response.ok) continue

        const data = await response.json()
        if (!Array.isArray(data)) continue

        for (const item of data) {
          const lineItem = item.lineItemNumber ?? item.line_item ?? item.id
          if (!lineItem) continue

          results.push({
            externalId: `ma-budget-${lineItem}-${fyShort}-governor`,
            source: 'ma_budget',
            sourceUrl: `${BUDGET_API_BASE}/govbudget/${fyShort}/`,
            fetchedAt: new Date(),
            data: {
              lineItemNumber: lineItem,
              name: item.name ?? item.description ?? lineItem,
              fiscalYear,
              stage: 'GOVERNOR',
              amount: Number(item.amount ?? item.appropriation ?? 0),
              description: item.description,
              url: `${BUDGET_API_BASE}/govbudget/${fyShort}/`,
            },
          })
        }
      } catch {
        // Search endpoint not available for this keyword
        continue
      }
    }

    return results
  }

  async validateConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      // Check if the budget.digital.mass.gov site is reachable
      const response = await fetch(`${BUDGET_API_BASE}/summary/fy27`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000),
      })

      if (response.ok || response.status === 301 || response.status === 302) {
        return { ok: true, message: 'Connected to budget.digital.mass.gov' }
      }

      return { ok: false, message: `budget.digital.mass.gov returned ${response.status}` }
    } catch (err) {
      return {
        ok: false,
        message: `Cannot reach budget.digital.mass.gov: ${err instanceof Error ? err.message : String(err)}`,
      }
    }
  }
}
