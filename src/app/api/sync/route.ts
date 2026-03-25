import { NextRequest, NextResponse } from 'next/server'
import { syncLegislation, syncHearings, syncBudgetFromAdapter, syncAll } from '@/ingestion'

type AdapterSource = 'ma_legislature' | 'congress_gov' | 'ma_budget'

const ALLOWED_SOURCES: AdapterSource[] = ['ma_legislature', 'congress_gov', 'ma_budget']

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { source, entityType } = body as { source?: string; entityType?: string }

    // Sync all sources
    if (!source || source === 'all') {
      const results = await syncAll('manual')
      return NextResponse.json({
        ok: true,
        results: results.map((r) => ({
          source: r.source,
          status: r.status,
          recordsCreated: r.recordsCreated,
          recordsUpdated: r.recordsUpdated,
          recordsSkipped: r.recordsSkipped,
          errors: r.errors.length,
        })),
      })
    }

    // Validate source
    if (!ALLOWED_SOURCES.includes(source as AdapterSource)) {
      return NextResponse.json(
        { ok: false, error: `Invalid source: ${source}. Allowed: ${ALLOWED_SOURCES.join(', ')}` },
        { status: 400 },
      )
    }

    const adapterSource = source as AdapterSource

    // Sync specific entity type
    if (entityType === 'budget') {
      const result = await syncBudgetFromAdapter(adapterSource, 'manual')
      return NextResponse.json({ ok: true, result: formatResult(result) })
    }

    if (entityType === 'hearings') {
      const result = await syncHearings(adapterSource, 'manual')
      return NextResponse.json({ ok: true, result: formatResult(result) })
    }

    if (entityType === 'legislation' || !entityType) {
      const result = await syncLegislation(adapterSource, 'manual')
      return NextResponse.json({ ok: true, result: formatResult(result) })
    }

    return NextResponse.json(
      { ok: false, error: `Invalid entityType: ${entityType}` },
      { status: 400 },
    )
  } catch (err) {
    console.error('[API /sync] Error:', err)
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    )
  }
}

function formatResult(r: { source: string; status: string; recordsCreated: number; recordsUpdated: number; recordsSkipped: number; errors: Array<{ message: string }> }) {
  return {
    source: r.source,
    status: r.status,
    recordsCreated: r.recordsCreated,
    recordsUpdated: r.recordsUpdated,
    recordsSkipped: r.recordsSkipped,
    errors: r.errors.map((e) => e.message),
  }
}

export async function GET() {
  return NextResponse.json({
    sources: ALLOWED_SOURCES,
    usage: 'POST with { source?: string, entityType?: string }',
  })
}
