/**
 * MA Legislature Source Adapter
 *
 * Fetches bill and hearing data from the malegislature.gov JSON API
 * for the 194th General Court. Uses keyword-based filtering to find
 * EO-relevant bills from the full document list.
 */

import type {
  SourceAdapter,
  FetchParams,
  RawRecord,
  MALegislatureRawBill,
  MALegislatureRawHearing,
} from '../types'

const BASE_URL = 'https://malegislature.gov'
const API_URL = `${BASE_URL}/api/GeneralCourts`
const SESSION = '194' // 194th General Court (2025-2026)
const USER_AGENT = 'MassCEO-EOAB-Tracker/1.0 (internal policy monitoring tool)'

/**
 * Keywords used to filter bills from the full document list.
 * The API does not support server-side search, so we fetch all bill titles
 * and match locally. Grouped by priority — tier 1 keywords are most directly
 * relevant to MassCEO / EOAB scope.
 */
const SEARCH_KEYWORDS_TIER1 = [
  'employee own', 'employee-own', 'worker own', 'worker-own',
  'esop', 'employee stock ownership', 'employee ownership trust',
  'massceo', 'eot',
]

const SEARCH_KEYWORDS_TIER2 = [
  'worker cooperative', 'worker co-op', 'cooperative development',
  'ownership conversion', 'business succession', 'broad-based ownership',
  'shared ownership', 'profit sharing', 'workplace democracy',
  'ownership transition',
]

const SEARCH_KEYWORDS_TIER3 = [
  'cooperative economy', 'small business transition',
  'equity compensation', 'democratic workplace',
]

const ALL_SEARCH_KEYWORDS = [
  ...SEARCH_KEYWORDS_TIER1,
  ...SEARCH_KEYWORDS_TIER2,
  ...SEARCH_KEYWORDS_TIER3,
]

/** API response types from malegislature.gov */
interface APIBillListItem {
  BillNumber: string | null
  DocketNumber: string | null
  Title: string
  PrimarySponsor: { Id: string; Name: string; Type: number } | null
  Cosponsors: { Id: string; Name: string; Type: number }[]
  JointSponsor: { Id: string; Name: string; Type: number } | null
  GeneralCourtNumber: number
  Details: string
  IsDocketBookOnly: boolean
}

interface APIBillDetail {
  Title: string
  BillNumber: string
  DocketNumber: string | null
  GeneralCourtNumber: number
  PrimarySponsor: { Id: string; Name: string; Type: number } | null
  Cosponsors: { Id: string; Name: string; Type: number }[]
  LegislationTypeName: string
  Pinslip: string | null
  DocumentText: string | null
  BillHistory: string
  CommitteeRecommendations: {
    Action: string
    Committee: { CommitteeCode: string; GeneralCourtNumber: number; Details: string }
  }[]
  Amendments: unknown[]
}

interface APIBillAction {
  Date: string
  Branch: string
  Action: string
  IsStricken: boolean
}

async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
  })
  if (!response.ok) {
    throw new Error(`API request failed: ${url} — ${response.status} ${response.statusText}`)
  }
  return response.json() as Promise<T>
}

/** Polite delay between detail requests */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function matchesKeywords(text: string): boolean {
  const lower = text.toLowerCase()
  return ALL_SEARCH_KEYWORDS.some((kw) => lower.includes(kw))
}

export class MALegislatureAdapter implements SourceAdapter<MALegislatureRawBill> {
  readonly sourceName = 'ma_legislature' as const
  readonly displayName = 'MA Legislature (malegislature.gov)'

  async fetch(params: FetchParams): Promise<RawRecord<MALegislatureRawBill>[]> {
    const results: RawRecord<MALegislatureRawBill>[] = []
    const limit = params.limit ?? 50

    try {
      // Fetch the full document list (the API doesn't support server-side filtering)
      console.log('[MALegislatureAdapter] Fetching document list from API...')
      const allDocs = await fetchJSON<APIBillListItem[]>(
        `${API_URL}/${SESSION}/Documents`
      )
      console.log(`[MALegislatureAdapter] Received ${allDocs.length} documents`)

      // Filter to actual bills with bill numbers that match our keywords
      const matchingBills = allDocs.filter((doc) => {
        if (!doc.BillNumber) return false
        if (doc.IsDocketBookOnly) return false
        // Match against title — the list endpoint doesn't include full text
        if (params.query) {
          return doc.Title.toLowerCase().includes(params.query.toLowerCase())
        }
        return matchesKeywords(doc.Title)
      })

      console.log(`[MALegislatureAdapter] Found ${matchingBills.length} matching bills`)

      // Fetch detail + actions for each matching bill
      for (const doc of matchingBills.slice(0, limit)) {
        const billNumber = doc.BillNumber!
        try {
          await delay(300) // Polite delay

          const [detail, actions] = await Promise.all([
            fetchJSON<APIBillDetail>(`${API_URL}/${SESSION}/Documents/${billNumber}`),
            fetchJSON<APIBillAction[]>(
              `${API_URL}/${SESSION}/Documents/${billNumber}/DocumentHistoryActions`
            ),
          ])

          const committee = detail.CommitteeRecommendations?.[0]?.Committee?.CommitteeCode || ''
          const lastAction = actions.length > 0 ? actions[actions.length - 1] : null
          const chamber: 'House' | 'Senate' = billNumber.startsWith('S') ? 'Senate' : 'House'

          const coSponsors = detail.Cosponsors
            ?.filter((c) => c.Name !== detail.PrimarySponsor?.Name)
            .map((c) => c.Name) || []

          // Build raw bill with action history embedded for BillAction extraction
          const rawBill: MALegislatureRawBill & { actions?: unknown[] } = {
            billNumber,
            title: detail.Title,
            session: `${SESSION}th General Court`,
            chamber,
            primarySponsor: detail.PrimarySponsor?.Name || '',
            coSponsors,
            committee,
            statusText: lastAction?.Action?.trim() || 'Filed',
            lastAction: lastAction?.Action?.trim() || '',
            lastActionDate: lastAction?.Date || '',
            url: `${BASE_URL}/Bills/${SESSION}/${billNumber}`,
            // Actions embedded for orchestrator's extractAndUpsertBillActions
            actions: actions.map((a) => ({
              actionText: a.Action.trim(),
              actionDate: a.Date,
              chamber: a.Branch,
            })),
          }

          results.push({
            externalId: `ma-${SESSION}-${billNumber.replace(/[\s.]/g, '')}`,
            source: 'ma_legislature',
            sourceUrl: `${BASE_URL}/Bills/${SESSION}/${billNumber}`,
            fetchedAt: new Date(),
            data: rawBill,
          })
        } catch (err) {
          console.warn(`[MALegislatureAdapter] Failed to fetch detail for ${doc.BillNumber}:`, err)
        }
      }
    } catch (err) {
      console.error('[MALegislatureAdapter] Fetch failed:', err)
      throw err
    }

    console.log(`[MALegislatureAdapter] Returning ${results.length} bills`)
    return results
  }

  async validateConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const response = await fetch(`${API_URL}/${SESSION}/Documents?$top=1`, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      })
      if (response.ok) {
        return { ok: true, message: 'Connected to malegislature.gov API' }
      }
      return { ok: false, message: `HTTP ${response.status}` }
    } catch (err) {
      return { ok: false, message: `Connection failed: ${err instanceof Error ? err.message : String(err)}` }
    }
  }
}

export class MALegislatureHearingAdapter implements SourceAdapter<MALegislatureRawHearing> {
  readonly sourceName = 'ma_legislature' as const
  readonly displayName = 'MA Legislature Hearings'

  async fetch(params: FetchParams): Promise<RawRecord<MALegislatureRawHearing>[]> {
    const results: RawRecord<MALegislatureRawHearing>[] = []

    try {
      const eventsUrl = `${BASE_URL}/Events`
      const response = await fetch(eventsUrl, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
      })
      if (!response.ok) {
        throw new Error(`Failed to fetch ${eventsUrl}: ${response.status}`)
      }

      // The events page requires HTML scraping as there's no JSON API for hearings
      const cheerio = await import('cheerio')
      const html = await response.text()
      const $ = cheerio.load(html)

      $('.eventListing, .event-item, table.eventsTable tbody tr, .eventRow').each((_i, el) => {
        const $el = $(el)
        const titleEl = $el.find('a[href*="/Events/"], h3, .eventTitle').first()
        const title = titleEl.text().trim()
        const href = titleEl.attr('href') || $el.find('a').first().attr('href')

        const dateText = $el.find('.eventDate, td:first-child, time').first().text().trim()
        const timeText = $el.find('.eventTime, td:nth-child(2)').first().text().trim()
        const location = $el.find('.eventLocation, td:nth-child(3)').first().text().trim()
        const committee = $el.find('.eventCommittee, td:nth-child(4)').first().text().trim()

        if (title && dateText) {
          const eventUrl = href
            ? (href.startsWith('http') ? href : `${BASE_URL}${href}`)
            : `${BASE_URL}/Events`

          const eventId = href?.match(/\/Events\/(\d+)/)?.[1] || `${dateText}-${title}`.replace(/\W+/g, '-')

          results.push({
            externalId: `ma-hearing-${eventId}`,
            source: 'ma_legislature',
            sourceUrl: eventUrl,
            fetchedAt: new Date(),
            data: {
              eventId,
              title,
              committee: committee || '',
              date: dateText,
              time: timeText || '',
              location: location || '',
              relatedBills: [],
              url: eventUrl,
            },
          })
        }
      })
    } catch (err) {
      console.error('[MALegislatureHearingAdapter] Fetch failed:', err)
      throw err
    }

    return results.slice(0, params.limit ?? 100)
  }

  async validateConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const response = await fetch(`${BASE_URL}/Events`, {
        method: 'HEAD',
        headers: { 'User-Agent': USER_AGENT },
      })
      return response.ok || response.status === 405
        ? { ok: true, message: 'Connected to malegislature.gov/Events' }
        : { ok: false, message: `HTTP ${response.status}` }
    } catch (err) {
      return { ok: false, message: `Connection failed: ${err instanceof Error ? err.message : String(err)}` }
    }
  }
}
