import { NextRequest, NextResponse } from 'next/server'
import { Jurisdiction, Chamber, Priority, LegislativeStatus, TrackingTier } from '@prisma/client'
import { getLegislativeItems, createLegislativeItem } from '@/services/legislation'
import { CONTENT_CLASS_DATASOURCES, type ContentClass } from '@/lib/source-metadata'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const jurisdiction = searchParams.get('jurisdiction') as Jurisdiction | null
    const status = searchParams.get('status') as LegislativeStatus | null
    const priority = searchParams.get('priority') as Priority | null
    const chamber = searchParams.get('chamber') as Chamber | null
    const committee = searchParams.get('committee')
    const search = searchParams.get('search')
    const archivedParam = searchParams.get('archived')
    const archived = archivedParam === 'true' ? true : archivedParam === 'all' ? undefined : false
    const tagsParam = searchParams.get('tags')
    const tags = tagsParam ? tagsParam.split(',').filter(Boolean) : undefined
    const staffLeadId = searchParams.get('staffLeadId')
    const trackingTier = searchParams.get('trackingTier') as TrackingTier | null
    const contentClass = searchParams.get('contentClass') as ContentClass | null
    const dataSource = contentClass ? CONTENT_CLASS_DATASOURCES[contentClass] : undefined
    const eoRelevantParam = searchParams.get('eoRelevant')
    const eoRelevant = eoRelevantParam === 'true' ? true : undefined
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const result = await getLegislativeItems({
      jurisdiction: jurisdiction || undefined,
      status: status || undefined,
      priority: priority || undefined,
      chamber: chamber || undefined,
      committee: committee || undefined,
      search: search || undefined,
      archived,
      tags,
      staffLeadId: staffLeadId ? parseInt(staffLeadId) : undefined,
      trackingTier: trackingTier || undefined,
      dataSource,
      eoRelevant,
      page,
      pageSize,
    })

    // Transform to match page expectations
    const items = result.items.map((i) => ({
      ...i,
      committee: i.assignedCommittee,
      updatedAt: (i.statusDate ?? i.updatedAt).toISOString(),
    }))

    return NextResponse.json({
      items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      pageCount: result.totalPages,
    })
  } catch (error) {
    console.error('[GET /api/legislation]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.jurisdiction || !body.billNumber || !body.title) {
      return NextResponse.json(
        { error: 'jurisdiction, billNumber, and title are required' },
        { status: 400 }
      )
    }

    const item = await createLegislativeItem(body)
    return NextResponse.json({ item }, { status: 201 })
  } catch (error: any) {
    console.error('[POST /api/legislation]', error)
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'A bill with this jurisdiction, billNumber, and session already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
