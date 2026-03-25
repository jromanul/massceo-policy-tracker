import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { getDocuments, createDocument } from '@/services/documents'
import type { DocumentEntityType } from '@/services/documents'

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const entityType = searchParams.get('entityType') as DocumentEntityType | null
    const entityIdParam = searchParams.get('entityId')
    const entityId = entityIdParam ? parseInt(entityIdParam) : undefined
    const uploadedByIdParam = searchParams.get('uploadedById')
    const uploadedById = uploadedByIdParam ? parseInt(uploadedByIdParam) : undefined

    const documents = await getDocuments({
      entityType: entityType || undefined,
      entityId,
      uploadedById,
    })

    return NextResponse.json({ documents })
  } catch (error) {
    console.error('[GET /api/documents]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const title = (formData.get('title') as string) || file.name
    const uploadedByIdStr = formData.get('uploadedById') as string | null
    const uploadedById = uploadedByIdStr ? parseInt(uploadedByIdStr) : undefined

    // Ensure uploads directory exists
    await mkdir(UPLOAD_DIR, { recursive: true })

    // Generate a unique filename to avoid collisions
    const timestamp = Date.now()
    const safeOriginal = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filename = `${timestamp}_${safeOriginal}`
    const filePath = path.join(UPLOAD_DIR, filename)

    // Read file bytes and write to disk
    const arrayBuffer = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(arrayBuffer))

    const document = await createDocument({
      title,
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      path: filePath,
      uploadedById,
    })

    return NextResponse.json({ document }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/documents]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
