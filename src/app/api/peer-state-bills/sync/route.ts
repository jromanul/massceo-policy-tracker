import { NextRequest, NextResponse } from 'next/server'
import { syncPeerStateBills } from '@/ingestion'

export const maxDuration = 60

/**
 * POST /api/peer-state-bills/sync
 * Body: { since?: string, only?: string[] }
 *
 * Runs per-state scrapers (PA, WA, CO, OR) against their official legislature
 * websites, filters to EO keyword matches with activity on/after `since`
 * (default 2025-01-01), and upserts into PeerStateBill.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const sinceStr = (body as { since?: string }).since
    const only = (body as { only?: string[] }).only
    const minDate = sinceStr ? new Date(sinceStr) : new Date('2025-01-01T00:00:00Z')

    // 45s budget leaves 15s for DB writes + the HTTP response on a 60s
    // Vercel Hobby function limit. OpenStates' 10-req/min throttle means one
    // run covers ~5 states — daily rotation fills in the rest over a few days.
    // For a full one-shot sync across all 17 states, use `npm run sync:peer-states`.
    const result = await syncPeerStateBills('manual', {
      minDate,
      only,
      timeBudgetMs: 45000,
    })
    return NextResponse.json({
      ok: true,
      result: {
        status: result.status,
        recordsProcessed: result.recordsProcessed,
        recordsCreated: result.recordsCreated,
        recordsUpdated: result.recordsUpdated,
        recordsSkipped: result.recordsSkipped,
        errors: result.errors.length,
        errorDetails: result.errors,
        warnings: result.warnings,
      },
    })
  } catch (err) {
    console.error('[POST /api/peer-state-bills/sync]', err)
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    )
  }
}
