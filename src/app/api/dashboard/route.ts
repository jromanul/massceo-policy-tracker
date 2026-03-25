import { NextRequest, NextResponse } from 'next/server'
import { getDashboardData } from '@/services/dashboard'

export async function GET(request: NextRequest) {
  try {
    const data = await getDashboardData()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[GET /api/dashboard]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
