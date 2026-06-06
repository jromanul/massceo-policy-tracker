import { NextRequest, NextResponse } from 'next/server'
import { syncPeerStateBills } from '@/ingestion'

export const maxDuration = 60 // Max for Vercel Hobby plan

/**
 * Dedicated peer-state cron — runs separately from the main /api/cron/sync so
 * it gets its own 60 s budget rather than competing with the MA pipelines for
 * leftover time. Without this, the staleness rotation only got ~10-15 s after
 * the MA scrapers finished, which at OpenStates' 10-req/min rate limit was
 * effectively zero state coverage per run, and every cron log ended in a
 * "running" state killed by Vercel's function timeout.
 *
 * Schedule: daily at 6:30 AM UTC (30 min after the main sync). Even if the
 * sync rotates only 4-6 states per run before timing out, 51 jurisdictions
 * cycle through every ~10 days.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Reserve 10 s for response + log writes; pass 50 s to the sync.
    const result = await syncPeerStateBills('scheduled', { timeBudgetMs: 50000 })
    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      result: {
        source: result.source,
        status: result.status,
        recordsCreated: result.recordsCreated,
        recordsUpdated: result.recordsUpdated,
        recordsSkipped: result.recordsSkipped,
        errors: result.errors.length,
      },
    })
  } catch (err) {
    console.error('[Cron Peer-State Sync] Error:', err)
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    )
  }
}
