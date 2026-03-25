import { NextRequest, NextResponse } from 'next/server'
import { getAmendment, updateAmendment, deleteAmendment } from '@/services/amendment'

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

    const item = await getAmendment(id)
    if (!item) {
      return NextResponse.json({ error: 'Amendment not found' }, { status: 404 })
    }

    return NextResponse.json({ item })
  } catch (error) {
    console.error('[GET /api/amendments/[id]]', error)
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
    const item = await updateAmendment(id, body)
    return NextResponse.json({ item })
  } catch (error: any) {
    console.error('[PUT /api/amendments/[id]]', error)
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Amendment not found' }, { status: 404 })
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

    await deleteAmendment(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[DELETE /api/amendments/[id]]', error)
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Amendment not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
