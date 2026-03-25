import { NextRequest, NextResponse } from 'next/server'
import { AmendmentStatus, AmendmentType, BudgetSourceStage } from '@prisma/client'
import { getAmendments, createAmendment } from '@/services/amendment'
import { AmendmentCreateSchema } from '@/lib/validators/amendment'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status') as AmendmentStatus | null
    const type = searchParams.get('type') as AmendmentType | null
    const stage = searchParams.get('stage') as BudgetSourceStage | null
    const budgetItemId = searchParams.get('budgetItemId')
    const legislativeItemId = searchParams.get('legislativeItemId')
    const search = searchParams.get('search')
    const archived = searchParams.get('archived')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const result = await getAmendments({
      status: status || undefined,
      type: type || undefined,
      stage: stage || undefined,
      budgetItemId: budgetItemId ? parseInt(budgetItemId) : undefined,
      legislativeItemId: legislativeItemId ? parseInt(legislativeItemId) : undefined,
      search: search || undefined,
      archived: archived === 'true' ? true : archived === 'all' ? undefined : false,
      page,
      pageSize,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[GET /api/amendments]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = AmendmentCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { sourceUrl, amount, ...rest } = parsed.data
    const item = await createAmendment({
      ...rest,
      sourceUrl: sourceUrl || undefined,
      amount: amount !== undefined ? amount : undefined,
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/amendments]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
