/**
 * MA Budget Bill Tracker
 *
 * Tracks the status of the House/Senate budget bills (e.g., H.5500 for FY2027
 * House Ways and Means budget) via the malegislature.gov bill API.
 *
 * This is the authoritative live source for budget stage completion — when
 * H.5500 is "passed to be engrossed" by the House, the HOUSE_DEBATE stage
 * is complete. Similarly for the Senate bill.
 *
 * Uses the same /api/GeneralCourts/{session}/Documents/{billNumber} endpoint
 * as the legislation adapter.
 */

const BASE_URL = 'https://malegislature.gov'
const API_URL = `${BASE_URL}/api/GeneralCourts`
const SESSION = '194' // 194th General Court (2025-2026)
const USER_AGENT = 'MassCEO-EOAB-Tracker/1.0 (internal policy monitoring tool)'

export interface BudgetBillStatus {
  billNumber: string
  title: string
  lastAction: string
  lastActionDate: string | null
  actions: Array<{ date: string; chamber: string; action: string }>
  sourceUrl: string
  fetchedAt: Date

  // Derived status flags
  isPassedHouse: boolean
  isPassedSenate: boolean
  isInConference: boolean
  isConferenceReportFiled: boolean
  isSignedByGovernor: boolean
  isEnacted: boolean
}

/**
 * Fetch the status of a budget bill (H.5500, S.3, etc.) from malegislature.gov.
 */
export async function fetchBudgetBillStatus(billNumber: string): Promise<BudgetBillStatus | null> {
  try {
    const [detailResp, actionsResp] = await Promise.all([
      fetch(`${API_URL}/${SESSION}/Documents/${billNumber}`, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      }),
      fetch(`${API_URL}/${SESSION}/Documents/${billNumber}/DocumentHistoryActions`, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      }),
    ])

    if (!detailResp.ok || !actionsResp.ok) {
      return null
    }

    const detail = await detailResp.json()
    const actions = (await actionsResp.json()) as Array<{ Date: string; Branch: string; Action: string }>

    const lastAction = actions.length > 0 ? actions[actions.length - 1] : null
    const normalizedActions = actions.map((a) => ({
      date: a.Date,
      chamber: a.Branch,
      action: a.Action.trim(),
    }))

    // Derive status flags from action text
    const actionTexts = normalizedActions.map((a) => `${a.chamber} ${a.action}`.toLowerCase())

    const isPassedHouse = actionTexts.some(
      (t) =>
        t.includes('house') &&
        (t.includes('passed to be engrossed') ||
          t.includes('passed to be enacted') ||
          t.includes('engrossed') ||
          t.includes('read third time')),
    )
    const isPassedSenate = actionTexts.some(
      (t) =>
        t.includes('senate') &&
        (t.includes('passed to be engrossed') ||
          t.includes('passed to be enacted') ||
          t.includes('engrossed') ||
          t.includes('read third time')),
    )
    // A conference committee is appointed once both chambers pass differing
    // versions: "Committee of conference appointed - (Michlewitz-Diggs-Smola)".
    const isInConference = actionTexts.some(
      (t) =>
        t.includes('committee of conference appointed') ||
        t.includes('conference committee appointed'),
    )
    // The conference report is filed when negotiators agree on a final version:
    // "Conference committee report ..." / "report of the committee of conference".
    const isConferenceReportFiled = actionTexts.some(
      (t) =>
        t.includes('conference committee report') ||
        t.includes('report of the committee of conference') ||
        (t.includes('committee of conference') && t.includes('report')),
    )
    const isSignedByGovernor = actionTexts.some(
      (t) => t.includes('signed by the governor') || t.includes('approved by the governor'),
    )
    const isEnacted = actionTexts.some(
      (t) => t.includes('chapter') && t.includes('act'),
    )

    return {
      billNumber,
      title: detail.Title || billNumber,
      lastAction: lastAction?.Action.trim() || '',
      lastActionDate: lastAction?.Date || null,
      actions: normalizedActions,
      sourceUrl: `${BASE_URL}/Bills/${SESSION}/${billNumber}`,
      fetchedAt: new Date(),
      isPassedHouse,
      isPassedSenate,
      isInConference,
      isConferenceReportFiled,
      isSignedByGovernor,
      isEnacted,
    }
  } catch (err) {
    console.error(`[BudgetBillTracker] Failed to fetch ${billNumber}:`, err)
    return null
  }
}
