import { NextRequest, NextResponse } from 'next/server'
import { syncAll } from '@/ingestion'

export const maxDuration = 60 // Max for Vercel Hobby plan

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized triggers
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Reserve 10 s for response serialization + DB log writes; pass 50 s to
    // syncAll. Peer-state sync now has its own dedicated /api/cron/peer-state-
    // sync route that runs at 6:30 AM UTC, so this route's budget can focus
    // entirely on the fast MA + federal pipelines.
    const results = await syncAll('scheduled', { totalBudgetMs: 50000, skipPeerStates: true })
    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      results: results.map((r) => ({
        source: r.source,
        status: r.status,
        recordsCreated: r.recordsCreated,
        recordsUpdated: r.recordsUpdated,
        recordsSkipped: r.recordsSkipped,
        errors: r.errors.length,
      })),
    })
  } catch (err) {
    console.error('[Cron Sync] Error:', err)
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    )
  }
}
