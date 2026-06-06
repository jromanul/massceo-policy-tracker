import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { BudgetProcessStatus } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * PUT /api/budget/timeline/[id]
 * Update fields on a budget process stage (for manual corrections/updates).
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: rawId } = await params
    const id = parseInt(rawId)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    const body = await request.json()
    const allowedFields = [
      'stageStatus', 'stageDate', 'stageDateIsEstimate', 'sourceUrl',
      'sourceSystem', 'isAuthoritative', 'massceoNote', 'isCurrent',
      'stageLabel', 'stageDescription',
    ]

    const data: Record<string, any> = {}
    for (const f of allowedFields) {
      if (f in body) data[f] = body[f]
    }

    if (data.stageDate && typeof data.stageDate === 'string') {
      data.stageDate = new Date(data.stageDate)
    }
    if (data.stageStatus) {
      data.stageStatus = data.stageStatus as BudgetProcessStatus
    }

    data.updatedAt = new Date()

    const stage = await prisma.budgetProcessStage.update({
      where: { id },
      data,
    })

    return NextResponse.json({ ok: true, stage })
  } catch (error) {
    console.error('[PUT /api/budget/timeline/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
