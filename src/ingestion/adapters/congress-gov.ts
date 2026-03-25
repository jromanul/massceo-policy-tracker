/**
 * Congress.gov API Source Adapter
 *
 * Uses the official Congress.gov API (https://api.congress.gov/) to fetch
 * federal legislation data relevant to employee ownership.
 *
 * The API does NOT support keyword search — it only lists bills by congress
 * and type. This adapter fetches specific known EO-relevant bills by number.
 *
 * Requires a CONGRESS_GOV_API_KEY environment variable.
 */

import type {
  SourceAdapter,
  FetchParams,
  RawRecord,
  CongressGovRawBill,
} from '../types'

const API_BASE = 'https://api.congress.gov/v3'
const CURRENT_CONGRESS = 119 // 119th Congress (2025-2027)

function getApiKey(): string {
  return process.env.CONGRESS_GOV_API_KEY || ''
}

interface CongressApiResponse {
  bills?: CongressApiBill[]
  bill?: CongressApiBill
  pagination?: { count: number; next?: string }
}

interface CongressApiBill {
  congress: number
  type: string
  number: number
  title: string
  originChamber: string
  originChamberCode: string
  introducedDate: string
  latestAction: {
    text: string
    actionDate: string
  }
  sponsors?: Array<{
    bioguideId: string
    fullName: string
    firstName: string
    lastName: string
    party: string
    state: string
  }>
  cosponsors?: { count: number; url?: string }
  committees?: { url?: string }
  policyArea?: { name: string }
  subjects?: { url?: string }
  url: string
}

async function apiRequest(path: string, params: Record<string, string> = {}): Promise<CongressApiResponse> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('CONGRESS_GOV_API_KEY environment variable is not set. Sign up at https://api.congress.gov/sign-up/')
  }

  const url = new URL(`${API_BASE}${path}`)
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('format', 'json')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Congress.gov API error: ${response.status} ${response.statusText} - ${body.slice(0, 200)}`)
  }

  return response.json()
}

export class CongressGovAdapter implements SourceAdapter<CongressGovRawBill> {
  readonly sourceName = 'congress_gov' as const
  readonly displayName = 'Congress.gov (Federal Legislation)'

  /**
   * Known EO-relevant federal bills to track.
   * Format: { congress, type, number }
   *
   * The Congress.gov API does not support keyword search, so we maintain
   * an explicit list of bills to fetch. This list is curated from NCEO
   * and ESOP Association legislative trackers.
   *
   * Sources:
   *   - https://www.nceo.org/what-is-employee-ownership/federal-legislation-on-employee-ownership
   *   - https://www.esopassociation.org/advocacy/federal-legislation
   */
  private static readonly TRACKED_BILLS: Array<{ congress: number; type: string; number: number }> = [
    // ── 119th Congress (2025-2027) ─────────────────────────────────────
    // Promotion and Expansion of Private Employee Ownership Act of 2025
    { congress: 119, type: 's', number: 2461 },
    { congress: 119, type: 'hr', number: 3105 },
    // Employee Ownership Representation Act of 2025
    { congress: 119, type: 's', number: 1728 },
    // Employee Ownership Fairness Act of 2025
    { congress: 119, type: 's', number: 1727 },
    // Employee Ownership Financing Act
    { congress: 119, type: 's', number: 2458 },
    // Retire Through Ownership Act
    { congress: 119, type: 's', number: 2403 },
    { congress: 119, type: 'hr', number: 5169 },
    // SHARE Plan Act
    { congress: 119, type: 's', number: 1101 },
    // Advocate for Employee Ownership Act
    { congress: 119, type: 's', number: 2474 },
    // Improving SBA Engagement on Employee Ownership Act
    { congress: 119, type: 'hr', number: 5778 },
    // American Ownership and Resilience Act (if bill numbers available)
    // Consolidated Appropriations Act, 2026 (includes $2M WORK Act funding)
    { congress: 119, type: 'hr', number: 7148 },
  ]

  async fetch(params: FetchParams): Promise<RawRecord<CongressGovRawBill>[]> {
    const results: RawRecord<CongressGovRawBill>[] = []
    const seenIds = new Set<string>()

    try {
      // If specific bill numbers provided, fetch those
      const billsToFetch = params.billNumbers
        ? params.billNumbers.map((bn) => {
            const [type, num] = bn.split('/')
            return { congress: params.congress ?? CURRENT_CONGRESS, type, number: parseInt(num) }
          })
        : CongressGovAdapter.TRACKED_BILLS

      for (const bill of billsToFetch) {
        const id = `${bill.congress}-${bill.type}-${bill.number}`
        if (seenIds.has(id)) continue
        seenIds.add(id)

        console.log(`[CongressGovAdapter] Fetching: ${bill.type.toUpperCase()} ${bill.number} (${bill.congress}th Congress)`)

        try {
          const data = await apiRequest(`/bill/${bill.congress}/${bill.type}/${bill.number}`)
          if (data.bill) {
            const rawBill = this.mapToBillRecord(data.bill)
            if (rawBill) {
              results.push(rawBill)
            }
          }
        } catch (err) {
          console.warn(`[CongressGovAdapter] Failed to fetch ${bill.type.toUpperCase()} ${bill.number}: ${err instanceof Error ? err.message : String(err)}`)
        }
      }
    } catch (err) {
      console.error('[CongressGovAdapter] Fetch failed:', err)
      throw err
    }

    console.log(`[CongressGovAdapter] Returning ${results.length} EO-relevant bills`)
    return results
  }

  async fetchOne(externalId: string): Promise<RawRecord<CongressGovRawBill> | null> {
    // Parse external ID format: "congress_gov-119-hr-1234"
    const match = externalId.match(/congress_gov-(\d+)-(\w+)-(\d+)/)
    if (!match) return null

    const [, congress, type, number] = match
    try {
      const data = await apiRequest(`/bill/${congress}/${type}/${number}`)
      if (data.bill) {
        return this.mapToBillRecord(data.bill)
      }
    } catch {
      return null
    }
    return null
  }

  private mapToBillRecord(bill: CongressApiBill): RawRecord<CongressGovRawBill> | null {
    const billType = bill.type?.toLowerCase() || 'hr'
    const congressGovUrl = `https://www.congress.gov/bill/${bill.congress}th-congress/${this.getFullChamberName(billType)}-bill/${bill.number}`

    const sponsor = bill.sponsors?.[0]

    return {
      externalId: `congress_gov-${bill.congress}-${billType}-${bill.number}`,
      source: 'congress_gov',
      sourceUrl: congressGovUrl,
      fetchedAt: new Date(),
      data: {
        congress: bill.congress,
        billType,
        billNumber: bill.number,
        title: bill.title,
        shortTitle: bill.title.length > 120 ? bill.title.slice(0, 117) + '...' : undefined,
        sponsor: sponsor ? {
          name: sponsor.fullName || `${sponsor.firstName} ${sponsor.lastName}`,
          party: sponsor.party || '',
          state: sponsor.state || '',
          bioguideId: sponsor.bioguideId,
        } : { name: 'Unknown', party: '', state: '' },
        cosponsors: [],
        committees: [],
        latestAction: bill.latestAction || { text: 'No action recorded', actionDate: '' },
        introducedDate: bill.introducedDate || '',
        policyArea: bill.policyArea?.name,
        url: bill.url,
        congressGovUrl,
      },
    }
  }

  private getFullChamberName(billType: string): string {
    if (billType.startsWith('s')) return 'senate'
    return 'house'
  }

  async validateConnection(): Promise<{ ok: boolean; message: string }> {
    const apiKey = getApiKey()
    if (!apiKey) {
      return {
        ok: false,
        message: 'CONGRESS_GOV_API_KEY not set. Sign up at https://api.congress.gov/sign-up/',
      }
    }
    try {
      await apiRequest('/bill', { limit: '1' })
      return { ok: true, message: 'Connected to Congress.gov API' }
    } catch (err) {
      return {
        ok: false,
        message: `Connection failed: ${err instanceof Error ? err.message : String(err)}`,
      }
    }
  }
}
