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
  'co-op', // catches "co-op", "co-ops", "co-operative", "co-operatives"
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

          // Use the LAST committee recommendation (most recent referral), not the first
          const committeeRecs = detail.CommitteeRecommendations || []
          const committee = committeeRecs.length > 0
            ? committeeRecs[committeeRecs.length - 1]?.Committee?.CommitteeCode || ''
            : ''
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

/**
 * Only import hearings relevant to employee ownership or MassCEO budget tracking.
 * Uses word-boundary matching for ambiguous terms (e.g. "labor" should not match
 * "collaboration", "small business" should not match arbitrary commerce hearings).
 */

// Exact phrase matches (substring OK — very specific)
const HEARING_STRICT_KEYWORDS = [
  'ways and means',
  'economic development',
  'employee ownership',
  'employee-owned',
  'worker ownership',
  'worker-owned',
  'worker cooperative',
  'massceo',
  'mass ceo',
  'esop',
  'eot',
  'co-op', // catches "co-op", "co-ops", "co-operative", "co-operatives"
  'community development',
]

// Word-boundary matches (must be a whole word, not substring)
const HEARING_WORD_BOUNDARY_KEYWORDS = [
  'workforce',
  'cooperative',
  'cooperatives',
]

/**
 * Hearings explicitly excluded by the user despite matching the EO-relevance
 * filter (e.g. generic committee hearings without an EO-specific agenda).
 * Compared against the `eventId` parsed from the calendar listing.
 */
const HEARING_EVENT_ID_BLOCKLIST = new Set<string>([
  '5679', // Joint Committee on Labor and Workforce Development — generic
          // committee hearing, no EO-specific agenda. User-removed Apr 2026.
])

function isEORelevantHearing(title: string): boolean {
  const lower = title.toLowerCase()

  // Strict substring matches on very specific phrases
  for (const kw of HEARING_STRICT_KEYWORDS) {
    if (lower.includes(kw)) return true
  }

  // Word-boundary matches for ambiguous words
  for (const kw of HEARING_WORD_BOUNDARY_KEYWORDS) {
    const re = new RegExp(`\\b${kw}\\b`, 'i')
    if (re.test(title)) return true
  }

  return false
}

/**
 * Fetch the authoritative hearing date/time from an event's detail page.
 *
 * The calendar listing collapses a multi-day hearing into a concatenated date
 * header (e.g. "JUN 17JUN 23JUN 30"), and the adapter's "take the first MMM DD"
 * heuristic can then anchor such a hearing to the wrong day — a June 23–30
 * written-testimony-window EO hearing was showing as June 17. The detail page
 * states the real schedule, e.g. "Tuesday June 23, 2026 at 11:00AM". Returns
 * null on ANY failure (timeout, non-200, unparseable) so the caller keeps the
 * calendar-derived date: this can only correct a date, never break the sync.
 */
async function fetchHearingSchedule(
  eventId: string,
): Promise<{ date: string; time?: string } | null> {
  const url = `${BASE_URL}/Events/Hearings/Detail/${eventId}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
      signal: controller.signal,
    })
    if (!resp.ok) return null
    const html = await resp.text()
    // First "Weekday Month DD, YYYY at HH:MM AM/PM" is the hearing's start.
    const m = html.match(
      /(?:Sun|Mon|Tues|Wednes|Thurs|Fri|Satur)day,?\s+([A-Z][a-z]+\s+\d{1,2}),?\s+(\d{4})\s+at\s+(\d{1,2}:\d{2})\s*([AP]M)/i,
    )
    if (!m) return null
    return { date: `${m[1].replace(/\s+/g, ' ').trim()}, ${m[2]}`, time: `${m[3]} ${m[4].toUpperCase()}` }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

export class MALegislatureHearingAdapter implements SourceAdapter<MALegislatureRawHearing> {
  readonly sourceName = 'ma_legislature' as const
  readonly displayName = 'MA Legislature Hearings'

  async fetch(params: FetchParams): Promise<RawRecord<MALegislatureRawHearing>[]> {
    const results: RawRecord<MALegislatureRawHearing>[] = []
    const cheerio = await import('cheerio')

    // Fetch a 2-month forward window: current month + next month. The MA
    // Legislature calendar URL pattern is /Events/Hearings/Calendar/MM-01-YYYY.
    // Without forward visibility, the dashboard only sees hearings in the
    // current month — which obscures upcoming Senate floor debates, conference
    // committee sessions, and post-passage hearings during a budget cycle.
    // Two months keeps the daily cron well within Vercel's 60s function cap
    // while still surfacing hearings 4–6 weeks out (which is as far ahead as
    // the MA Legislature typically posts events anyway).
    const today = new Date()
    const monthsToFetch: { year: number; month: number }[] = []
    for (let offset = 0; offset < 2; offset++) {
      const target = new Date(today.getFullYear(), today.getMonth() + offset, 1)
      monthsToFetch.push({ year: target.getFullYear(), month: target.getMonth() + 1 })
    }

    for (const { year, month } of monthsToFetch) {
      const monthStr = `${String(month).padStart(2, '0')}-01-${year}`
      const eventsUrl = `${BASE_URL}/Events/Hearings/Calendar/${monthStr}`
      console.log(`[MALegislatureHearingAdapter] Fetching ${eventsUrl}`)

      try {
        const response = await fetch(eventsUrl, {
          headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
        })
        if (!response.ok) {
          console.warn(
            `[MALegislatureHearingAdapter] ${monthStr}: HTTP ${response.status} — skipping month`,
          )
          continue
        }

        const html = await response.text()
        const $ = cheerio.load(html)

        // .calendarRow > .calendarHeader (date) + dl.dateList (events).
        let currentDate = ''

        $('.calendarRow').each((_i, row) => {
          const $row = $(row)
          const dateEl = $row.find('.calendarHeader .date')
          if (dateEl.length) {
            // Defensive: when the calendar lists a hearing on multiple days,
            // .calendarHeader .date can collapse every date into one
            // concatenated string (e.g. "APR 23APR 27APR 29APR 30") because
            // cheerio's .text() joins child nodes without separators. Take
            // only the first MMM DD pair so we always anchor to the first
            // hearing day.
            const rawDate = dateEl.text().trim()
            const firstDateMatch = rawDate.match(/[A-Z]{3,}\s*\d{1,2}/)
            currentDate = firstDateMatch ? firstDateMatch[0].replace(/\s+/g, ' ') : ''
          }

          $row.find('dl.dateList .row').each((_j, eventRow) => {
            const $event = $(eventRow)
            const timeText = $event.find('dt').first().text().trim().split('\n')[0].trim()
            const titleEl = $event
              .find('a[href*="/Events/"][href*="/Detail/"] strong')
              .first()
            const title = titleEl.text().trim()
            const href = titleEl.closest('a').attr('href') || ''
            const statusMatch = $event.find('small').text().match(/Status:\s*(\w+)/)
            const status = statusMatch ? statusMatch[1] : ''

            const ddText = $event.find('dd').text()
            const locationMatch = ddText.replace(title, '').replace(/Status:.*/, '').trim()
            const location = locationMatch.replace(/\s+/g, ' ').trim()

            if (title && currentDate && isEORelevantHearing(title)) {
              const eventId =
                href.match(/\/Detail\/(\d+)/)?.[1] ||
                `${currentDate}-${title}`.replace(/\W+/g, '-')

              // Skip explicitly blocklisted hearings (user-removed)
              if (HEARING_EVENT_ID_BLOCKLIST.has(eventId)) {
                return
              }

              const eventUrl = href ? `${BASE_URL}${href}` : `${BASE_URL}/Events`
              // Use the calendar page's year — not today's year — so a hearing
              // shown on the September calendar correctly resolves to that
              // September even if we cross a year boundary in the 3-month
              // window.
              const parsedDate = `${currentDate} ${year}`

              results.push({
                externalId: `ma-hearing-${eventId}`,
                source: 'ma_legislature',
                sourceUrl: eventUrl,
                fetchedAt: new Date(),
                data: {
                  eventId,
                  title,
                  committee: title,
                  date: parsedDate,
                  time: timeText,
                  location: location || '',
                  relatedBills: [],
                  url: eventUrl,
                  status,
                },
              })
            }
          })
        })
      } catch (err) {
        console.error(
          `[MALegislatureHearingAdapter] ${monthStr} fetch failed:`,
          err,
        )
        // Keep going — partial month coverage is better than failing the whole sync
      }
    }

    // De-dup by externalId — if a multi-day hearing appears on two calendar
    // pages we only want one record.
    const seen = new Set<string>()
    const deduped = results.filter((r) => {
      if (seen.has(r.externalId)) return false
      seen.add(r.externalId)
      return true
    })

    // Override each hearing's calendar-derived date with the authoritative
    // date/time from its detail page. Done in parallel (bounded by each fetch's
    // 15 s timeout) so the extra requests don't blow the cron's time budget;
    // any fetch that fails leaves the calendar date untouched.
    await Promise.all(
      deduped.map(async (r) => {
        const eid = r.data.eventId
        if (!eid || !/^\d+$/.test(eid)) return
        const sched = await fetchHearingSchedule(eid)
        if (sched) {
          r.data.date = sched.date
          if (sched.time) r.data.time = sched.time
        }
      }),
    )

    console.log(
      `[MALegislatureHearingAdapter] Found ${deduped.length} hearings across ${monthsToFetch.length} months`,
    )
    return deduped.slice(0, params.limit ?? 100)
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
