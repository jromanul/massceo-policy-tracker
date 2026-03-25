import { NextRequest, NextResponse } from 'next/server'
import {
  getLegislativeItem,
  updateLegislativeItem,
  deleteLegislativeItem,
} from '@/services/legislation'

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

    const item = await getLegislativeItem(id)
    if (!item) {
      return NextResponse.json({ error: 'Legislative item not found' }, { status: 404 })
    }

    return NextResponse.json({ item })
  } catch (error) {
    console.error('[GET /api/legislation/[id]]', error)
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
    const item = await updateLegislativeItem(id, body)
    return NextResponse.json({ item })
  } catch (error: any) {
    console.error('[PUT /api/legislation/[id]]', error)
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Legislative item not found' }, { status: 404 })
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

    await deleteLegislativeItem(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[DELETE /api/legislation/[id]]', error)
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Legislative item not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
