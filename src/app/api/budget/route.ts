import { NextRequest, NextResponse } from 'next/server'
import { Jurisdiction, Priority, BudgetSourceStage, BudgetStatus } from '@prisma/client'
import { getBudgetItems, createBudgetItem } from '@/services/budget'
import { prisma } from '@/lib/db'
import { CONTENT_CLASS_DATASOURCES, type ContentClass } from '@/lib/source-metadata'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const fiscalYearParam = searchParams.get('fiscalYear')
    const fiscalYear = fiscalYearParam ? parseInt(fiscalYearParam) : undefined
    const sourceStage = searchParams.get('sourceStage') as BudgetSourceStage | null
    const status = searchParams.get('status') as BudgetStatus | null
    const priority = searchParams.get('priority') as Priority | null
    const jurisdiction = searchParams.get('jurisdiction') as Jurisdiction | null
    const search = searchParams.get('search')
    const archivedParam = searchParams.get('archived')
    const archived = archivedParam !== null ? archivedParam === 'true' : undefined
    const tagsParam = searchParams.get('tags')
    const tags = tagsParam ? tagsParam.split(',').filter(Boolean) : undefined
    const contentClass = searchParams.get('contentClass') as ContentClass | null
    const dataSource = contentClass ? CONTENT_CLASS_DATASOURCES[contentClass] : undefined
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const result = await getBudgetItems({
      fiscalYear,
      sourceStage: sourceStage || undefined,
      status: status || undefined,
      priority: priority || undefined,
      jurisdiction: jurisdiction || undefined,
      search: search || undefined,
      archived,
      tags,
      dataSource,
      page,
      pageSize,
    })

    // Compute highlights for the selected fiscal year
    const targetFY = fiscalYear ?? 2027
    const fyItems = await prisma.budgetItem.findMany({
      where: { fiscalYear: targetFY, archived: false },
      select: { amountProposed: true, amountAdopted: true, sourceStage: true },
    })
    const priorFYItems = await prisma.budgetItem.findMany({
      where: { fiscalYear: targetFY - 1 },
      select: { amountAdopted: true },
    })

    let totalProposed = 0
    let totalAdopted = 0
    const byStage: Record<string, number> = {}
    for (const item of fyItems) {
      if (item.amountProposed) totalProposed += Number(item.amountProposed)
      if (item.amountAdopted) totalAdopted += Number(item.amountAdopted)
      byStage[item.sourceStage] = (byStage[item.sourceStage] || 0) + 1
    }
    let priorYearTotal = 0
    for (const item of priorFYItems) {
      if (item.amountAdopted) priorYearTotal += Number(item.amountAdopted)
    }

    // Transform items to match page expectations
    const items = result.items.map((i) => ({
      ...i,
      proposedAmount: i.amountProposed,
      adoptedAmount: i.amountAdopted,
      updatedAt: (i.statusDate ?? i.updatedAt).toISOString(),
      lastActionDate: i.statusDate ? i.statusDate.toISOString() : null,
    }))

    return NextResponse.json({
      items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      pageCount: result.totalPages,
      highlights: {
        totalProposed: totalProposed || null,
        totalAdopted: totalAdopted || null,
        byStage,
        priorYearTotal: priorYearTotal || null,
      },
    })
  } catch (error) {
    console.error('[GET /api/budget]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.fiscalYear || !body.name || !body.sourceStage) {
      return NextResponse.json(
        { error: 'fiscalYear, name, and sourceStage are required' },
        { status: 400 }
      )
    }

    const item = await createBudgetItem(body)
    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/budget]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
