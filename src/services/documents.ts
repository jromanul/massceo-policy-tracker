import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

export type DocumentEntityType = 'legislation' | 'budget' | 'hearing' | 'policy'

export interface DocumentFilters {
  entityType?: DocumentEntityType
  entityId?: number
  uploadedById?: number
}

export async function getDocuments(filters: DocumentFilters = {}) {
  const { entityType, entityId, uploadedById } = filters

  const where: Prisma.DocumentWhereInput = {}

  if (uploadedById) where.uploadedById = uploadedById

  if (entityType && entityId) {
    switch (entityType) {
      case 'legislation':
        where.legislativeItems = { some: { id: entityId } }
        break
      case 'budget':
        where.budgetItems = { some: { id: entityId } }
        break
      case 'hearing':
        where.hearings = { some: { id: entityId } }
        break
      case 'policy':
        where.policyIdeas = { some: { id: entityId } }
        break
    }
  }

  return prisma.document.findMany({
    where,
    orderBy: { uploadedAt: 'desc' },
    include: {
      uploadedBy: { select: { id: true, name: true, email: true } },
      legislativeItems: { select: { id: true, title: true, billNumber: true } },
      budgetItems: { select: { id: true, name: true, fiscalYear: true } },
      hearings: { select: { id: true, title: true, date: true } },
      policyIdeas: { select: { id: true, title: true } },
    },
  })
}

export async function createDocument(data: {
  title: string
  filename: string
  mimeType: string
  size: number
  path: string
  uploadedById?: number
}) {
  return prisma.document.create({
    data: {
      title: data.title,
      filename: data.filename,
      mimeType: data.mimeType,
      size: data.size,
      path: data.path,
      uploadedBy: data.uploadedById
        ? { connect: { id: data.uploadedById } }
        : undefined,
    },
    include: {
      uploadedBy: { select: { id: true, name: true, email: true } },
    },
  })
}

export async function deleteDocument(id: number) {
  return prisma.document.delete({ where: { id } })
}

export async function linkDocument(
  documentId: number,
  entityType: DocumentEntityType,
  entityId: number
) {
  const connectPayload = { connect: { id: entityId } }

  return prisma.document.update({
    where: { id: documentId },
    data: {
      legislativeItems: entityType === 'legislation' ? connectPayload : undefined,
      budgetItems: entityType === 'budget' ? connectPayload : undefined,
      hearings: entityType === 'hearing' ? connectPayload : undefined,
      policyIdeas: entityType === 'policy' ? connectPayload : undefined,
    },
  })
}

export async function unlinkDocument(
  documentId: number,
  entityType: DocumentEntityType,
  entityId: number
) {
  const disconnectPayload = { disconnect: { id: entityId } }

  return prisma.document.update({
    where: { id: documentId },
    data: {
      legislativeItems: entityType === 'legislation' ? disconnectPayload : undefined,
      budgetItems: entityType === 'budget' ? disconnectPayload : undefined,
      hearings: entityType === 'hearing' ? disconnectPayload : undefined,
      policyIdeas: entityType === 'policy' ? disconnectPayload : undefined,
    },
  })
}
