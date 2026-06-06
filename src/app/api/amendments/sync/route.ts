import { NextRequest, NextResponse } from 'next/server'
import { syncBudgetAmendments } from '@/ingestion'

export const maxDuration = 60

/**
 * POST /api/amendments/sync
 * Body: { fiscalYear?: number, chamber?: 'HOUSE' | 'SENATE' | 'BOTH' }
 *
 * Scrapes the MA Legislature amendment pages for EO-relevant amendments
 * and upserts them into the DB. Defaults to FY2027 + both chambers.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const {
      fiscalYear = 2027,
      chamber = 'BOTH',
    } = body as { fiscalYear?: number; chamber?: 'HOUSE' | 'SENATE' | 'BOTH' }

    const chambers: Array<'HOUSE' | 'SENATE'> =
      chamber === 'BOTH' ? ['HOUSE', 'SENATE'] : [chamber]

    const results = []
    for (const c of chambers) {
      const result = await syncBudgetAmendments(fiscalYear, c, 'manual')
      results.push({
        chamber: c,
        fiscalYear,
        status: result.status,
        recordsCreated: result.recordsCreated,
        recordsUpdated: result.recordsUpdated,
        recordsSkipped: result.recordsSkipped,
        errors: result.errors.length,
      })
    }

    return NextResponse.json({ ok: true, results })
  } catch (err) {
    console.error('[API /amendments/sync] Error:', err)
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    )
  }
}
