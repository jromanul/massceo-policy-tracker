/**
 * MA Legislature Budget Amendments Scraper
 *
 * Scrapes EO-relevant amendments from malegislature.gov budget debate pages.
 * URL patterns:
 *   - https://malegislature.gov/Budget/FY{YY}/HouseDebate/Amendments
 *   - https://malegislature.gov/Budget/FY{YY}/SenateDebate/Amendments
 *
 * The House budget bill is typically H5500 (FY2027), Senate is S3.
 */

const BASE_URL = 'https://malegislature.gov'
const USER_AGENT = 'MassCEO-EOAB-Tracker/1.0 (internal policy monitoring tool)'

/**
 * Keywords used to filter amendments. Only amendments matching one of these
 * keywords in their title will be imported.
 */
// Intentionally excludes bare "co-op" — too noisy in budget amendments
// (e.g. "Dorchester Food Co-Op", which is a real but EO-unrelated amendment).
// The narrower "worker co-op" is retained. Bills + hearings still match bare
// co-op since their context is usually self-narrowing.
const EO_AMENDMENT_KEYWORDS = [
  'employee own', 'employee-own', 'worker own', 'worker-own',
  'esop', 'eot', 'employee stock',
  'mass ceo', 'massceo', 'eoab',
  'worker cooperative', 'worker co-op', 'cooperative development',
  'ownership conversion', 'business succession',
  'broad-based ownership', 'ownership transition',
  'employee ownership',
]

function matchesEOKeywords(text: string): boolean {
  const lower = text.toLowerCase()
  return EO_AMENDMENT_KEYWORDS.some((kw) => lower.includes(kw))
}

/**
 * Fetch with a hard timeout. The budget-debate amendment listings are large
 * (560+ amendments per chamber) and malegislature.gov occasionally stalls on
 * them. A bare fetch() has no timeout, so a stalled response hangs until
 * Vercel kills the whole function at its 60 s cap — which leaves the SyncLog
 * row stuck in "running" forever (it never reaches the completion write). An
 * AbortController timeout makes a slow page fail FAST with a terminal error so
 * the sync is logged as `failed` and simply retried on the next cron, instead
 * of hanging and going stale.
 */
async function fetchWithTimeout(
  url: string,
  opts: RequestInit,
  timeoutMs = 25000,
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...opts, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

export interface AmendmentScrapeResult {
  amendmentNumber: string
  sponsor: string
  sponsorId?: string
  title: string
  subject?: string
  action?: string
  sourceUrl: string
  chamber: 'HOUSE' | 'SENATE'
  billNumber: string
  fiscalYear: number
}

export interface AmendmentScrapeParams {
  fiscalYear: number // e.g. 2027
  chamber: 'HOUSE' | 'SENATE'
}

/**
 * Scrape the amendments listing page and return EO-relevant amendments.
 */
export async function scrapeAmendments(
  params: AmendmentScrapeParams,
): Promise<AmendmentScrapeResult[]> {
  const { fiscalYear, chamber } = params
  const debateSegment = chamber === 'HOUSE' ? 'HouseDebate' : 'SenateDebate'
  const url = `${BASE_URL}/Budget/FY${fiscalYear}/${debateSegment}/Amendments`

  console.log(`[AmendmentScraper] Fetching ${url}`)

  const response = await fetchWithTimeout(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }

  const html = await response.text()
  const cheerio = await import('cheerio')
  const $ = cheerio.load(html)

  const results: AmendmentScrapeResult[] = []
  let billNumber = chamber === 'HOUSE' ? 'H5500' : 'S3' // will be extracted from links

  // Parse each amendment row. Structure:
  // <tr>
  //   <td class="text-center"><div><a href="/Bills/GetAmendmentContent/194/H5500/{num}/House/Preview">{num}</a></div></td>
  //   <td><a href="/Legislators/Profile/{id}">{sponsor name}</a></td>
  //   <td>{title}</td>
  //   <td>{subject}</td>
  //   <td>{action}</td>
  // </tr>
  $('tr').each((_i, row) => {
    const $row = $(row)
    const amendmentLink = $row.find('a[href*="/GetAmendmentContent/"]').first()
    if (!amendmentLink.length) return

    const href = amendmentLink.attr('href') || ''
    const numberMatch = href.match(/\/GetAmendmentContent\/(\d+)\/(\w+)\/(\d+)\//)
    if (!numberMatch) return

    const [, , extractedBill, amendmentNumber] = numberMatch
    if (extractedBill) billNumber = extractedBill

    const tds = $row.find('td')
    if (tds.length < 3) return

    const sponsorLink = $(tds[1]).find('a[href*="/Legislators/Profile/"]').first()
    const sponsor = sponsorLink.text().trim() || $(tds[1]).text().trim()
    const sponsorHref = sponsorLink.attr('href') || ''
    const sponsorId = sponsorHref.match(/\/Profile\/([^/]+)/)?.[1]

    const title = $(tds[2]).text().trim()
    const subject = tds.length > 3 ? $(tds[3]).text().trim() : undefined
    const action = tds.length > 4 ? $(tds[4]).text().trim() : undefined

    if (title && amendmentNumber && matchesEOKeywords(title)) {
      results.push({
        amendmentNumber,
        sponsor,
        sponsorId,
        title,
        subject: subject || undefined,
        action: action || undefined,
        sourceUrl: `${BASE_URL}${href}`,
        chamber,
        billNumber,
        fiscalYear,
      })
    }
  })

  console.log(`[AmendmentScraper] Found ${results.length} EO-relevant amendments on ${url}`)
  return results
}
