import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { BudgetSourceStage } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/budget/[id]/stages
 * Body: { stage: BudgetSourceStage, amount: number, notes?: string, sourceUrl?: string }
 *
 * Add a new budget stage entry (Governor/House/Senate/Conference/Final) to an existing
 * budget item. Upserts on (budgetItemId, stage).
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: rawId } = await params
    const id = parseInt(rawId)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    const body = await request.json()
    const { stage, amount, notes, sourceUrl } = body as {
      stage: string
      amount: number
      notes?: string
      sourceUrl?: string
    }

    if (!stage || amount === undefined || amount === null) {
      return NextResponse.json(
        { error: 'stage and amount are required' },
        { status: 400 },
      )
    }

    const budgetItem = await prisma.budgetItem.findUnique({ where: { id } })
    if (!budgetItem) {
      return NextResponse.json({ error: 'Budget item not found' }, { status: 404 })
    }

    // Upsert the stage
    const existing = await prisma.budgetStage.findFirst({
      where: { budgetItemId: id, stage: stage as BudgetSourceStage },
    })

    let budgetStage
    if (existing) {
      budgetStage = await prisma.budgetStage.update({
        where: { id: existing.id },
        data: {
          amount,
          notes: notes ?? existing.notes,
          sourceUrl: sourceUrl ?? existing.sourceUrl,
          sourceRetrievedAt: new Date(),
          provenance: 'manual-update',
        },
      })
    } else {
      budgetStage = await prisma.budgetStage.create({
        data: {
          budgetItemId: id,
          stage: stage as BudgetSourceStage,
          amount,
          notes,
          sourceUrl,
          sourceRetrievedAt: new Date(),
          provenance: 'manual-entry',
        },
      })
    }

    // Also touch the parent item
    await prisma.budgetItem.update({
      where: { id },
      data: { lastSyncedAt: new Date(), sourceRetrievedAt: new Date() },
    })

    return NextResponse.json({ ok: true, budgetStage })
  } catch (error) {
    console.error('[POST /api/budget/[id]/stages]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
