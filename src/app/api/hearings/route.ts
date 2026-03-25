import { NextRequest, NextResponse } from 'next/server'
import { Jurisdiction, HearingStatus, HearingType } from '@prisma/client'
import { getHearings, createHearing } from '@/services/hearings'
import { CONTENT_CLASS_DATASOURCES, type ContentClass } from '@/lib/source-metadata'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status') as HearingStatus | null
    const jurisdiction = searchParams.get('jurisdiction') as Jurisdiction | null
    const committee = searchParams.get('committee')
    const search = searchParams.get('search')
    const dateFromParam = searchParams.get('dateFrom')
    const dateToParam = searchParams.get('dateTo')
    const dateFrom = dateFromParam ? new Date(dateFromParam) : undefined
    const dateTo = dateToParam ? new Date(dateToParam) : undefined
    const hearingType = searchParams.get('hearingType') as HearingType | null
    const contentClass = searchParams.get('contentClass') as ContentClass | null
    const dataSource = contentClass ? CONTENT_CLASS_DATASOURCES[contentClass] : undefined
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const result = await getHearings({
      status: status || undefined,
      hearingType: hearingType || undefined,
      jurisdiction: jurisdiction || undefined,
      committee: committee || undefined,
      search: search || undefined,
      dateFrom,
      dateTo,
      dataSource,
      page,
      pageSize,
    })

    // Transform to match page expectations
    const items = result.items.map((h) => ({
      id: h.id,
      title: h.title,
      startDatetime: h.date.toISOString(),
      endDatetime: null,
      location: h.location,
      committee: h.committeeOrBody,
      jurisdiction: h.jurisdiction,
      hearingType: h.eventType,
      status: h.status,
      relatedBills: h.legislativeItems?.map((l) => l.billNumber).filter(Boolean).join(', ') || null,
      updatedAt: h.updatedAt.toISOString(),
      dataSource: h.dataSource,
    }))

    return NextResponse.json({
      items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      pageCount: result.totalPages,
    })
  } catch (error) {
    console.error('[GET /api/hearings]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.title || !body.date) {
      return NextResponse.json(
        { error: 'title and date are required' },
        { status: 400 }
      )
    }

    const item = await createHearing(body)
    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/hearings]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
