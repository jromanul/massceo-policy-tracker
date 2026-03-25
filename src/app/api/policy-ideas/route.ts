import { NextRequest, NextResponse } from 'next/server'
import { PolicyDisposition } from '@prisma/client'
import { getPolicyIdeas, createPolicyIdea } from '@/services/policy-ideas'
import { CONTENT_CLASS_DATASOURCES, type ContentClass } from '@/lib/source-metadata'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const disposition = searchParams.get('disposition') as PolicyDisposition | null
    const issueArea = searchParams.get('issueArea')
    const search = searchParams.get('search')
    const archivedParam = searchParams.get('archived')
    const archived = archivedParam !== null ? archivedParam === 'true' : undefined
    const submittedByIdParam = searchParams.get('submittedById')
    const submittedById = submittedByIdParam ? parseInt(submittedByIdParam) : undefined
    const tagsParam = searchParams.get('tags')
    const tags = tagsParam ? tagsParam.split(',').filter(Boolean) : undefined
    const contentClass = searchParams.get('contentClass') as ContentClass | null
    const dataSource = contentClass ? CONTENT_CLASS_DATASOURCES[contentClass] : undefined
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const result = await getPolicyIdeas({
      disposition: disposition || undefined,
      issueArea: issueArea || undefined,
      search: search || undefined,
      archived,
      submittedById,
      tags,
      dataSource,
      page,
      pageSize,
    })

    // Transform to match page expectations
    const items = result.items.map((i) => ({
      ...i,
      isArchived: i.archived,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
    }))

    return NextResponse.json({
      items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      pageCount: result.totalPages,
    })
  } catch (error) {
    console.error('[GET /api/policy-ideas]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    const item = await createPolicyIdea(body)
    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/policy-ideas]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
