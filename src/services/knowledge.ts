import { prisma } from '@/lib/db'
import { KnowledgeEntryType, Prisma } from '@prisma/client'

export interface KnowledgeEntryFilters {
  entryType?: KnowledgeEntryType
  search?: string
  tags?: string[]
  page?: number
  pageSize?: number
}

export async function getKnowledgeEntries(filters: KnowledgeEntryFilters = {}) {
  const {
    page = 1,
    pageSize = 20,
    entryType,
    search,
    tags,
  } = filters

  const where: Prisma.KnowledgeEntryWhereInput = {}

  if (entryType) where.entryType = entryType

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { content: { contains: search } },
      { handoffNotes: { contains: search } },
      { unresolvedQuestions: { contains: search } },
    ]
  }

  if (tags && tags.length > 0) {
    where.tags = { some: { name: { in: tags } } }
  }

  const skip = (page - 1) * pageSize

  const [items, total] = await Promise.all([
    prisma.knowledgeEntry.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { updatedAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        tags: true,
        documents: { select: { id: true, title: true, filename: true, mimeType: true, uploadedAt: true } },
        legislativeItems: { select: { id: true, title: true, billNumber: true, jurisdiction: true } },
        budgetItems: { select: { id: true, name: true, fiscalYear: true } },
        hearings: { select: { id: true, title: true, date: true } },
        policyIdeas: { select: { id: true, title: true } },
      },
    }),
    prisma.knowledgeEntry.count({ where }),
  ])

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export async function getKnowledgeEntry(id: number) {
  return prisma.knowledgeEntry.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, email: true, role: true } },
      tags: true,
      documents: true,
      notes: {
        include: { author: { select: { id: true, name: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      },
      legislativeItems: {
        select: { id: true, title: true, billNumber: true, jurisdiction: true, status: true },
      },
      budgetItems: {
        select: { id: true, name: true, fiscalYear: true, status: true },
      },
      hearings: {
        select: { id: true, title: true, date: true, status: true },
      },
      policyIdeas: {
        select: { id: true, title: true, disposition: true },
      },
    },
  })
}

export async function createKnowledgeEntry(
  data: Prisma.KnowledgeEntryCreateInput & { tags?: string[] }
) {
  const { tags, ...rest } = data as any

  const tagOps = tags && tags.length > 0
    ? {
        connectOrCreate: tags.map((name: string) => ({
          where: { name },
          create: { name },
        })),
      }
    : undefined

  return prisma.knowledgeEntry.create({
    data: {
      ...rest,
      tags: tagOps,
    },
    include: {
      tags: true,
    },
  })
}

export async function updateKnowledgeEntry(
  id: number,
  data: Partial<Prisma.KnowledgeEntryUpdateInput> & { tags?: string[] }
) {
  const { tags, ...rest } = data as any

  const tagOps = tags !== undefined
    ? {
        set: [],
        connectOrCreate: tags.map((name: string) => ({
          where: { name },
          create: { name },
        })),
      }
    : undefined

  return prisma.knowledgeEntry.update({
    where: { id },
    data: {
      ...rest,
      tags: tagOps,
    },
    include: {
      tags: true,
    },
  })
}
