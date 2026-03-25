import { prisma } from '@/lib/db'
import { DataSource, PolicyDisposition, PolicyOriginType, Prisma } from '@prisma/client'

export interface PolicyIdeaFilters {
  disposition?: PolicyDisposition
  originType?: PolicyOriginType
  issueArea?: string
  search?: string
  archived?: boolean
  submittedById?: number
  tags?: string[]
  dataSource?: string[]
  page?: number
  pageSize?: number
}

export async function getPolicyIdeas(filters: PolicyIdeaFilters = {}) {
  const {
    page = 1,
    pageSize = 20,
    disposition,
    originType,
    issueArea,
    search,
    archived,
    submittedById,
    tags,
    dataSource,
  } = filters

  const where: Prisma.PolicyIdeaWhereInput = {}

  if (disposition) where.disposition = disposition
  if (originType) where.originType = originType
  if (issueArea) where.issueArea = { contains: issueArea }
  if (archived !== undefined) where.archived = archived
  if (submittedById) where.submittedById = submittedById
  if (dataSource && dataSource.length > 0) where.dataSource = { in: dataSource as DataSource[] }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { shortDescription: { contains: search } },
      { fullDescription: { contains: search } },
      { issueArea: { contains: search } },
      { rationale: { contains: search } },
    ]
  }

  if (tags && tags.length > 0) {
    where.tags = { some: { name: { in: tags } } }
  }

  const skip = (page - 1) * pageSize

  const [items, total] = await Promise.all([
    prisma.policyIdea.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { updatedAt: 'desc' },
      include: {
        submittedBy: { select: { id: true, name: true, email: true, role: true } },
        tags: true,
        documents: { select: { id: true, title: true, filename: true, mimeType: true, uploadedAt: true } },
      },
    }),
    prisma.policyIdea.count({ where }),
  ])

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export async function getPolicyIdea(id: number) {
  return prisma.policyIdea.findUnique({
    where: { id },
    include: {
      submittedBy: { select: { id: true, name: true, email: true, role: true } },
      tags: true,
      documents: true,
      notes: {
        include: { author: { select: { id: true, name: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      },
      history: {
        include: { author: { select: { id: true, name: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      },
      legislativeItems: {
        select: { id: true, title: true, billNumber: true, jurisdiction: true, status: true },
      },
      budgetItems: {
        select: { id: true, name: true, fiscalYear: true, status: true },
      },
      knowledgeEntries: {
        select: { id: true, title: true, entryType: true, createdAt: true },
      },
    },
  })
}

export async function createPolicyIdea(
  data: Prisma.PolicyIdeaCreateInput & { tags?: string[] }
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

  return prisma.policyIdea.create({
    data: {
      ...rest,
      tags: tagOps,
    },
    include: {
      submittedBy: { select: { id: true, name: true, email: true } },
      tags: true,
    },
  })
}

export async function updatePolicyIdea(
  id: number,
  data: Partial<Prisma.PolicyIdeaUpdateInput> & { tags?: string[] }
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

  return prisma.policyIdea.update({
    where: { id },
    data: {
      ...rest,
      tags: tagOps,
    },
    include: {
      submittedBy: { select: { id: true, name: true, email: true } },
      tags: true,
    },
  })
}

export async function deletePolicyIdea(id: number) {
  return prisma.policyIdea.delete({ where: { id } })
}
