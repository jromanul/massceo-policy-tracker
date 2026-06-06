import { NextRequest, NextResponse } from 'next/server'
import { getBudgetProcessTimeline, advanceStage } from '@/services/budget-process'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fyParam = searchParams.get('fiscalYear')

    // Default to next fiscal year (MA FY starts July 1)
    const now = new Date()
    const currentFY = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear()
    const fiscalYear = fyParam ? parseInt(fyParam) : currentFY + 1

    const timeline = await getBudgetProcessTimeline(fiscalYear)
    return NextResponse.json(timeline)
  } catch (error) {
    console.error('[GET /api/budget/timeline]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/budget/timeline — Advance a stage to completed and move current marker.
 * Body: { stageId: number, completedDate?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { stageId, completedDate } = body as { stageId: number; completedDate?: string }

    if (!stageId) {
      return NextResponse.json({ error: 'stageId is required' }, { status: 400 })
    }

    const result = await advanceStage(stageId, completedDate ? new Date(completedDate) : undefined)
    return NextResponse.json({ ok: true, result })
  } catch (error) {
    console.error('[POST /api/budget/timeline]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
