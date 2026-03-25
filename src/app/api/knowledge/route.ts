import { NextRequest, NextResponse } from 'next/server'
import { KnowledgeEntryType } from '@prisma/client'
import { getKnowledgeEntries, createKnowledgeEntry } from '@/services/knowledge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const entryType = searchParams.get('entryType') as KnowledgeEntryType | null
    const search = searchParams.get('search')
    const tagsParam = searchParams.get('tags')
    const tags = tagsParam ? tagsParam.split(',').filter(Boolean) : undefined
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const result = await getKnowledgeEntries({
      entryType: entryType || undefined,
      search: search || undefined,
      tags,
      page,
      pageSize,
    })

    // Transform to match page expectations
    const items = result.items.map((i) => ({
      id: i.id,
      title: i.title,
      entryType: i.entryType,
      excerpt: i.content ? i.content.substring(0, 200) + (i.content.length > 200 ? '...' : '') : null,
      content: i.content,
      tags: i.tags,
      relatedLegislation: i.legislativeItems?.map((l) => ({
        id: l.id,
        billNumber: l.billNumber,
        title: l.title,
      })),
      relatedBudget: i.budgetItems?.map((b) => ({
        id: b.id,
        name: b.name,
      })),
      relatedHearings: i.hearings?.map((h) => ({
        id: h.id,
        title: h.title,
      })),
      relatedPolicyIdeas: i.policyIdeas?.map((p) => ({
        id: p.id,
        title: p.title,
      })),
      isUnresolved: !!i.unresolvedQuestions,
      isHandoffNote: i.entryType === 'HANDOFF_NOTE',
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
    console.error('[GET /api/knowledge]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.title || !body.content || !body.entryType) {
      return NextResponse.json(
        { error: 'title, content, and entryType are required' },
        { status: 400 }
      )
    }

    const item = await createKnowledgeEntry(body)
    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/knowledge]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
