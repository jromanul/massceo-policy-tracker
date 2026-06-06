/**
 * OpenStates API Adapter — Peer State Legislature Tracker
 *
 * Single unified interface for all 50 state legislatures via OpenStates v3.
 * OpenStates scrapes each state site on its infrastructure and exposes a
 * normalized bill model — we consume that model so Vercel doesn't have to
 * hit each state's anti-scraping-protected endpoint directly.
 *
 * RATE LIMITS (free tier):
 *   - 10 requests per minute (THE binding constraint)
 *   - 250 requests per day (easy — we're well under this)
 *
 * Because Vercel Hobby tops out at 60 s per function invocation, a full pass
 * over 17 states at 6 s/request only gets us ~10 API calls. So this adapter
 * supports two modes:
 *
 *   (1) Vercel cron: process a subset of states per invocation, rotating on
 *       `lastSyncedAt` so the full set gets covered over a few days.
 *   (2) CLI (`npm run sync:peer-states`): no 60 s limit, so we rate-limit at
 *       the OpenStates cadence and process all 17 states in ~3 minutes.
 *
 * API docs: https://docs.openstates.org/api-v3/
 * Sign up:  https://openstates.org/accounts/profile/ (free)
 */

const API_BASE = 'https://v3.openstates.org'

/**
 * Peer states covered. Easily extensible — add a new entry and the sync
 * picks it up automatically.
 */
// All 50 states + DC. Starting broader gives us a genuinely comprehensive
// national scan — the adapter's early-exit logic (stop paginating after two
// consecutive empty pages) keeps per-state API cost low for states with no
// EO activity, so the practical budget is ~4 calls per quiet state. States
// with real EO bills continue to paginate up to 3 pages per query.
export const PEER_STATES: Array<{ code: string; name: string }> = [
  { code: 'al', name: 'Alabama' },
  { code: 'ak', name: 'Alaska' },
  { code: 'az', name: 'Arizona' },
  { code: 'ar', name: 'Arkansas' },
  { code: 'ca', name: 'California' },
  { code: 'co', name: 'Colorado' },
  { code: 'ct', name: 'Connecticut' },
  { code: 'de', name: 'Delaware' },
  { code: 'fl', name: 'Florida' },
  { code: 'ga', name: 'Georgia' },
  { code: 'hi', name: 'Hawaii' },
  { code: 'id', name: 'Idaho' },
  { code: 'il', name: 'Illinois' },
  { code: 'in', name: 'Indiana' },
  { code: 'ia', name: 'Iowa' },
  { code: 'ks', name: 'Kansas' },
  { code: 'ky', name: 'Kentucky' },
  { code: 'la', name: 'Louisiana' },
  { code: 'me', name: 'Maine' },
  { code: 'md', name: 'Maryland' },
  // MA deliberately excluded — tracked on the dedicated Legislation tab.
  { code: 'mi', name: 'Michigan' },
  { code: 'mn', name: 'Minnesota' },
  { code: 'ms', name: 'Mississippi' },
  { code: 'mo', name: 'Missouri' },
  { code: 'mt', name: 'Montana' },
  { code: 'ne', name: 'Nebraska' },
  { code: 'nv', name: 'Nevada' },
  { code: 'nh', name: 'New Hampshire' },
  { code: 'nj', name: 'New Jersey' },
  { code: 'nm', name: 'New Mexico' },
  { code: 'ny', name: 'New York' },
  { code: 'nc', name: 'North Carolina' },
  { code: 'nd', name: 'North Dakota' },
  { code: 'oh', name: 'Ohio' },
  { code: 'ok', name: 'Oklahoma' },
  { code: 'or', name: 'Oregon' },
  { code: 'pa', name: 'Pennsylvania' },
  { code: 'ri', name: 'Rhode Island' },
  { code: 'sc', name: 'South Carolina' },
  { code: 'sd', name: 'South Dakota' },
  { code: 'tn', name: 'Tennessee' },
  { code: 'tx', name: 'Texas' },
  { code: 'ut', name: 'Utah' },
  { code: 'vt', name: 'Vermont' },
  { code: 'va', name: 'Virginia' },
  { code: 'wa', name: 'Washington' },
  { code: 'wv', name: 'West Virginia' },
  { code: 'wi', name: 'Wisconsin' },
  { code: 'wy', name: 'Wyoming' },
  { code: 'dc', name: 'District of Columbia' },
]

// Post-filter vocabulary, split by match strategy.
//
// Phrase keywords: lenient substring match. Catches natural variants of the
// user's keyword list — "employee ownership" also picks up "employee
// ownership plan/trust"; "employee stock ownership" is the spelled-out form
// of ESOP and surfaces bills whose titles use the full phrase (common in
// California, Indiana, North Carolina).
//
// Prior experiment: a bare "cooperative" phrase match was attempted to catch
// the user's "co-op" intent more aggressively, but it produced a flood of
// false positives — bills about electric cooperatives, boards of cooperative
// services, cooperative purchasing agreements, and uses of "to cooperate" as
// a verb. Removed. Legitimate worker-cooperative bills are captured via the
// specific phrase keywords below plus the word-boundary "co-op" match.
//
// Word-boundary keywords: \b…\b regex for short terms prone to false
// positives ("esop" must not match "aesop"; "eot" must not match random
// 3-letter substrings; "co-op" must not bleed into "co-opt").
const PHRASE_KEYWORDS = [
  'employee ownership',
  'employee owned',
  'employee-owned',
  'employee stock ownership',
  'worker cooperative',
  'worker-owned',
]
const WORD_BOUNDARY_KEYWORDS = ['esop', 'eot', 'co-op']

// Residential / housing-cooperative markers. A housing co-op is a corporation
// that owns an apartment building; residents hold shares — it has nothing to
// do with employee or worker ownership. The bare "co-op" keyword still catches
// these bills because housing co-ops are colloquially called "the co-op." When
// a bill's ONLY employee-ownership signal is the bare "co-op" token AND the
// text carries one of these housing markers, it is treated as a false positive
// and discarded (see matchedEOKeywords).
const HOUSING_COOP_MARKERS = [
  'cooperative housing',
  'housing cooperative',
  'cooperative apartment',
  'co-op apartment',
  'co-op board',
  'cooperative housing corporation',
  'mitchell-lama',
]

// Queries OpenStates issues. OpenStates `q` is a phrase search, so we fire
// one request per search term and post-filter titles/abstracts. The broader
// the query set, the better the completeness — especially for bills that
// mention "co-op" or "cooperative" but not the word "ownership". Budget:
// 4 queries × up to 3 pages × 17 states = up to 204 calls per full sync —
// within the 250/day free-tier cap when run via the CLI. The Vercel cron
// uses staleness-based rotation so each daily invocation touches only a
// subset.
const SEARCH_QUERIES = [
  'employee ownership',
  'employee owned',
  'ESOP',
  'cooperative',
]

interface OpenStatesBill {
  id: string
  session: string
  jurisdiction: { id: string; name: string; classification: string }
  identifier: string
  title: string
  classification: string[]
  subject: string[]
  openstates_url?: string
  first_action_date?: string
  latest_action_date?: string
  latest_action_description?: string
  latest_passage_date?: string
  sources?: Array<{ url: string; note?: string }>
  sponsorships?: Array<{ name: string; classification?: string; primary?: boolean }>
  abstracts?: Array<{ abstract: string; note?: string }>
}

interface OpenStatesSearchResponse {
  results: OpenStatesBill[]
  pagination: {
    per_page: number
    page: number
    max_page: number
    total_items: number
  }
}

export interface PeerStateBillResult {
  state: string
  stateName: string
  billNumber: string
  sessionIdentifier: string | null
  title: string
  shortSummary: string | null
  sponsor: string | null
  chamber: 'HOUSE' | 'SENATE' | 'JOINT' | null
  statusText: string | null
  introducedDate: Date | null
  lastActionDate: Date | null
  lastActionText: string | null
  sourceSystem: string
  sourceApiId: string
  sourceUrl: string | null
  rawSourceData: unknown
  matchedKeywords: string[]
}

function getApiKey(): string {
  return (process.env.OPENSTATES_API_KEY || '').trim()
}

// Rate-limit coordinator: OpenStates enforces 10 req/min on the free tier,
// so we throttle to 6 seconds between any two requests from this process.
// A tiny buffer (+200 ms) keeps us safely under the limit.
const MIN_REQUEST_INTERVAL_MS = 6200
let lastRequestAt = 0

async function throttle(): Promise<void> {
  const now = Date.now()
  const wait = MIN_REQUEST_INTERVAL_MS - (now - lastRequestAt)
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait))
  }
  lastRequestAt = Date.now()
}

export function isOpenStatesConfigured(): boolean {
  return getApiKey().length > 0
}

function matchedEOKeywords(text: string): string[] {
  const lower = text.toLowerCase()
  const matches: string[] = []

  // Phrase keywords: substring match (lenient)
  for (const kw of PHRASE_KEYWORDS) {
    if (lower.includes(kw)) matches.push(kw)
  }

  // Word-boundary keywords: \b boundaries, for short terms prone to false
  // positives ("esop", "eot", "co-op" — avoids "aesop", "tarpot", etc.)
  for (const kw of WORD_BOUNDARY_KEYWORDS) {
    const re = new RegExp(`\\b${kw.replace(/[-]/g, '\\-')}\\b`, 'i')
    if (re.test(text)) matches.push(kw)
  }

  // Housing-cooperative false-positive guard. If the bill's only employee-
  // ownership signal is the bare "co-op" token — no employee/worker/ESOP/EOT
  // phrase matched — and the text reads as residential housing-cooperative
  // legislation, discard it. This is what kept bills like "increases
  // transparency in cooperative housing corporations" off the tracker.
  if (matches.length > 0) {
    const strongMatches = matches.filter((m) => m !== 'co-op')
    const hasHousingMarker = HOUSING_COOP_MARKERS.some((m) => lower.includes(m))
    if (strongMatches.length === 0 && hasHousingMarker) {
      return []
    }
  }

  return matches
}

function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

function deriveChamber(identifier: string): 'HOUSE' | 'SENATE' | 'JOINT' | null {
  const p = identifier.trim().toUpperCase().replace(/[^A-Z]/g, '')
  if (p.startsWith('HB') || p.startsWith('HR') || p === 'H') return 'HOUSE'
  if (p.startsWith('SB') || p.startsWith('SR') || p === 'S') return 'SENATE'
  if (p.startsWith('HJR') || p.startsWith('SJR') || p.startsWith('HCR') || p.startsWith('SCR'))
    return 'JOINT'
  return null
}

/**
 * Fetch EO-relevant bills for a single state.
 */
export async function fetchPeerStateBills(
  stateCode: string,
  stateName: string,
  options: { minDate?: Date; perPage?: number; deadline?: number } = {},
): Promise<PeerStateBillResult[]> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error(
      'OPENSTATES_API_KEY not set. Sign up at https://openstates.org/accounts/profile/ and add the key to env.',
    )
  }

  const minDate = options.minDate ?? new Date('2025-01-01T00:00:00Z')
  const perPage = Math.min(options.perPage ?? 20, 20)

  const results: PeerStateBillResult[] = []
  const seenIds = new Set<string>()

  // OpenStates `q` is a fuzzy full-text search: for PA "employee ownership"
  // returns 321 results sorted by recent activity. The actual EO-titled bills
  // (SB 478, HB 1751, HB 1790, SB 1340) are on pages 2-4, not page 1. So we
  // paginate up to MAX_PAGES per query. With 17 states × 3 queries × 3 pages
  // = 153 API calls/sync, we stay well under the 250/day free-tier limit.
  const MAX_PAGES = 3

  for (const kw of SEARCH_QUERIES) {
    let pagesWithNoMatches = 0

    for (let page = 1; page <= MAX_PAGES; page++) {
      // Stop gracefully at the caller's deadline. Each request costs a 6.2 s
      // throttle wait, and a single state can need up to 9 requests (~56 s) —
      // longer than the whole Vercel cron budget. Without a mid-state check the
      // function gets killed by Vercel's 60 s timeout partway through, leaving
      // the SyncLog row stuck in "running" forever. Returning the partial
      // results lets the orchestrator persist what we have and mark the run
      // complete; the staleness rotation picks the state up again next cron.
      if (options.deadline && Date.now() >= options.deadline) {
        return results
      }

      const url = new URL(`${API_BASE}/bills`)
      url.searchParams.set('jurisdiction', stateCode)
      url.searchParams.set('q', kw)
      url.searchParams.set('sort', 'updated_desc')
      url.searchParams.set('per_page', String(perPage))
      url.searchParams.set('page', String(page))
      url.searchParams.append('include', 'sponsorships')
      url.searchParams.append('include', 'abstracts')
      url.searchParams.set('apikey', apiKey)

      await throttle()

      try {
        const resp = await fetch(url.toString(), {
          headers: { Accept: 'application/json' },
        })

        if (!resp.ok) {
          const body = await resp.text().catch(() => '')
          console.warn(
            `[OpenStates] ${stateCode} q="${kw}" p${page} → ${resp.status} ${resp.statusText} ${body.slice(0, 150)}`,
          )
          break
        }

        const data = (await resp.json()) as OpenStatesSearchResponse
        const rows = data.results ?? []

        // If upstream has fewer pages than we're asking for, stop.
        if (rows.length === 0) break

        let matchesOnThisPage = 0
        for (const b of rows) {
          if (seenIds.has(b.id)) continue

          // Strict post-filter — only keep bills whose title or abstract
          // literally contains one of our EO keywords. This weeds out the
          // tangential matches from OpenStates' broader full-text search.
          const abstractText = (b.abstracts ?? []).map((a) => a.abstract).join(' ')
          const searchText = `${b.title} ${abstractText}`
          const matched = matchedEOKeywords(searchText)
          if (matched.length === 0) continue

          // Date filter: most recent activity must be on/after minDate.
          const introduced = parseDate(b.first_action_date)
          const latest = parseDate(b.latest_action_date)
          const reference = latest || introduced
          if (!reference || reference < minDate) continue

          seenIds.add(b.id)
          matchesOnThisPage++

          const primarySponsor =
            (b.sponsorships ?? []).find((s) => s.primary) ?? (b.sponsorships ?? [])[0]
          // Prefer the state legislature's own URL over OpenStates' canonical
          // page when both are available — keeps users anchored to primary
          // sources for citation / verification.
          const preferredSource =
            (b.sources ?? []).find(
              (s) => s.url && !s.url.includes('openstates.org'),
            )?.url ?? (b.sources ?? [])[0]?.url

          results.push({
            state: stateCode.toLowerCase(),
            stateName,
            billNumber: b.identifier,
            sessionIdentifier: b.session || null,
            title: b.title,
            shortSummary: b.abstracts?.[0]?.abstract ?? null,
            sponsor: primarySponsor?.name ?? null,
            chamber: deriveChamber(b.identifier),
            statusText: b.latest_action_description ?? null,
            introducedDate: introduced,
            lastActionDate: latest,
            lastActionText: b.latest_action_description ?? null,
            sourceSystem: 'OPENSTATES',
            sourceApiId: b.id,
            sourceUrl: preferredSource ?? b.openstates_url ?? null,
            rawSourceData: b,
            matchedKeywords: matched,
          })
        }

        // Early-exit: if two consecutive pages yield zero strict matches, we
        // stop paginating this query (the deeper results are unlikely to be
        // relevant and we'd rather save our rate-limit budget).
        if (matchesOnThisPage === 0) {
          pagesWithNoMatches++
          if (pagesWithNoMatches >= 2) break
        } else {
          pagesWithNoMatches = 0
        }

        // Stop early if this is the last page upstream reports
        if (page >= (data.pagination?.max_page ?? MAX_PAGES)) break
      } catch (err) {
        console.warn(`[OpenStates] ${stateCode} q="${kw}" p${page} fetch failed:`, err)
        break
      }

    }
  }

  return results
}

/**
 * Fetch EO bills across peer states. Supports:
 *   - `only`: restrict to specific state codes (for manual focus)
 *   - `timeBudgetMs`: stop gracefully before exceeding (use for Vercel's 60 s
 *     function limit so we don't get killed mid-state with unsaved work)
 *   - `stateOrder`: explicit processing order (pass the output of
 *     `pickStatesByStaleness` to rotate through the peer list over multiple
 *     cron invocations)
 */
export async function fetchAllPeerStateBills(
  options: {
    minDate?: Date
    only?: string[]
    timeBudgetMs?: number
    stateOrder?: Array<{ code: string; name: string }>
    /**
     * Fires once per state after its bills are fetched but before moving on
     * to the next state. Lets the orchestrator persist bills incrementally
     * so the DB populates progressively during a multi-minute sync — crucial
     * because OpenStates rate-limits us to 10 req/min, pushing a full 17-state
     * sync to ~15 minutes wall time.
     */
    onStateComplete?: (stateCode: string, bills: PeerStateBillResult[]) => Promise<void>
  } = {},
): Promise<{
  bills: PeerStateBillResult[]
  errorsPerState: Record<string, string>
  statesProcessed: string[]
  statesSkipped: string[]
}> {
  if (!isOpenStatesConfigured()) {
    throw new Error('OPENSTATES_API_KEY not configured')
  }

  const baseList = options.stateOrder ?? PEER_STATES
  const states = options.only
    ? baseList.filter((s) => options.only!.includes(s.code))
    : baseList

  const bills: PeerStateBillResult[] = []
  const errorsPerState: Record<string, string> = {}
  const statesProcessed: string[] = []
  const statesSkipped: string[] = []

  const start = Date.now()
  const budget = options.timeBudgetMs ?? Infinity
  // Absolute wall-clock deadline. Threaded into fetchPeerStateBills so a state
  // can bail out *between requests* rather than getting killed mid-request by
  // Vercel's function timeout. Undefined when no budget is set (CLI full sync).
  const deadline = budget === Infinity ? undefined : start + budget

  for (const s of states) {
    // Don't start a new state inside the final 8 s of the budget: reserve that
    // window for the in-flight request to finish and for the orchestrator's
    // per-state DB writes (onStateComplete) to commit. Mid-state cutoff is
    // handled by the `deadline` passed into fetchPeerStateBills below.
    if (deadline && Date.now() >= deadline - 8000) {
      statesSkipped.push(s.code)
      continue
    }

    try {
      const stateBills = await fetchPeerStateBills(s.code, s.name, {
        minDate: options.minDate,
        deadline,
      })
      bills.push(...stateBills)
      statesProcessed.push(s.code)
      console.log(`[OpenStates] ${s.code}: ${stateBills.length} EO bills`)
      if (options.onStateComplete) {
        try {
          await options.onStateComplete(s.code, stateBills)
        } catch (hookErr) {
          console.error(`[OpenStates] onStateComplete(${s.code}) threw:`, hookErr)
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[OpenStates] ${s.code} failed:`, msg)
      errorsPerState[s.code] = msg
      statesProcessed.push(s.code) // count as processed even if errored
    }
  }

  return { bills, errorsPerState, statesProcessed, statesSkipped }
}

/**
 * Rank peer states by staleness so the cron rotates across the roster sensibly.
 *
 * Priority rules:
 *   1. States with REAL bills sort first, oldest-bill-sync-first. This ensures
 *      the lastActionDate on actually-tracked legislation gets refreshed
 *      regularly.
 *   2. States without bills sort last, oldest-checkpoint-first. They get
 *      rescanned periodically (~once a month or two) in case new EO bills
 *      surface in a state we haven't tracked before.
 *
 * The earlier version put null-lastSyncedAt states FIRST (treating null as
 * `0` = oldest), which caused the cron to repeatedly scan empty states like
 * Alabama / Alaska / Arizona daily and never advance to bill-bearing states
 * like New York / Rhode Island / Wisconsin where the action actually happens.
 */
export function sortStatesByStaleness(
  stateInfo: Record<
    string,
    { hasBills: boolean; lastSyncedAt: Date | null }
  >,
): Array<{ code: string; name: string }> {
  return [...PEER_STATES].sort((a, b) => {
    const ai = stateInfo[a.code]
    const bi = stateInfo[b.code]
    // Bill-bearing states first
    if (ai?.hasBills && !bi?.hasBills) return -1
    if (!ai?.hasBills && bi?.hasBills) return 1
    // Within each group, oldest-sync-first
    const ta = ai?.lastSyncedAt?.getTime() ?? 0
    const tb = bi?.lastSyncedAt?.getTime() ?? 0
    return ta - tb
  })
}
