import { NextRequest, NextResponse } from 'next/server'
import { getHearing, updateHearing, deleteHearing } from '@/services/hearings'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: rawId } = await params
    const id = parseInt(rawId)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    const item = await getHearing(id)
    if (!item) {
      return NextResponse.json({ error: 'Hearing not found' }, { status: 404 })
    }

    return NextResponse.json({ item })
  } catch (error) {
    console.error('[GET /api/hearings/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: rawId } = await params
    const id = parseInt(rawId)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    const body = await request.json()
    const item = await updateHearing(id, body)
    return NextResponse.json({ item })
  } catch (error: any) {
    console.error('[PUT /api/hearings/[id]]', error)
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Hearing not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: rawId } = await params
    const id = parseInt(rawId)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    await deleteHearing(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[DELETE /api/hearings/[id]]', error)
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Hearing not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
