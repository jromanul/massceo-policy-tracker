import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/peer-state-bills
 *
 * List peer state bills, filtered to 2025+ action/introduction dates.
 * Supports:
 *   ?state=pa (2-letter lowercase)
 *   ?since=2025-01-01 (ISO date)
 *   ?lever=capital-gains
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const state = searchParams.get('state')
    const sinceParam = searchParams.get('since')
    const lever = searchParams.get('lever')

    const minDate = sinceParam ? new Date(sinceParam) : new Date('2025-01-01T00:00:00Z')

    // Include a bill if ANY of these are true:
    //   (a) lastActionDate ≥ minDate, OR
    //   (b) introducedDate ≥ minDate, OR
    //   (c) both are null (e.g. PA search results where we don't enrich detail
    //       — we trust the upstream session filter, which already restricts
    //       to 2025+).
    const where: {
      archived: boolean
      state?: string
      lever?: string
      OR: Array<{
        lastActionDate?: { gte: Date } | null
        introducedDate?: { gte: Date } | null
        AND?: Array<{ lastActionDate: null } | { introducedDate: null }>
      }>
    } = {
      archived: false,
      OR: [
        { lastActionDate: { gte: minDate } },
        { introducedDate: { gte: minDate } },
        {
          AND: [{ lastActionDate: null }, { introducedDate: null }],
        },
      ],
    }
    if (state) where.state = state.toLowerCase()
    if (lever) where.lever = lever

    const bills = await prisma.peerStateBill.findMany({
      where,
      orderBy: [{ lastActionDate: 'desc' }, { introducedDate: 'desc' }],
    })

    // Group by state, counting and serializing dates
    const byState: Record<string, { stateName: string; count: number }> = {}
    for (const b of bills) {
      if (!byState[b.state]) byState[b.state] = { stateName: b.stateName, count: 0 }
      byState[b.state].count++
    }

    return NextResponse.json({
      items: bills.map((b) => ({
        ...b,
        introducedDate: b.introducedDate?.toISOString() ?? null,
        lastActionDate: b.lastActionDate?.toISOString() ?? null,
        lastSyncedAt: b.lastSyncedAt?.toISOString() ?? null,
        sourceRetrievedAt: b.sourceRetrievedAt?.toISOString() ?? null,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
        matchedKeywords: b.matchedKeywords ? JSON.parse(b.matchedKeywords) : [],
      })),
      total: bills.length,
      byState,
      sinceDate: minDate.toISOString(),
    })
  } catch (err) {
    console.error('[GET /api/peer-state-bills]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    )
  }
}
