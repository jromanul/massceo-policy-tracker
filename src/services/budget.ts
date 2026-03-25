import { prisma } from '@/lib/db'
import {
  DataSource,
  Jurisdiction,
  Priority,
  BudgetSourceStage,
  BudgetStatus,
  Prisma,
} from '@prisma/client'

export interface BudgetItemFilters {
  fiscalYear?: number
  sourceStage?: BudgetSourceStage
  status?: BudgetStatus
  priority?: Priority
  jurisdiction?: Jurisdiction
  search?: string
  archived?: boolean
  tags?: string[]
  dataSource?: string[]
  page?: number
  pageSize?: number
}

export async function getBudgetItems(filters: BudgetItemFilters = {}) {
  const {
    page = 1,
    pageSize = 20,
    fiscalYear,
    sourceStage,
    status,
    priority,
    jurisdiction,
    search,
    archived,
    tags,
    dataSource,
  } = filters

  const where: Prisma.BudgetItemWhereInput = {}

  if (fiscalYear) where.fiscalYear = fiscalYear
  if (sourceStage) where.sourceStage = sourceStage
  if (status) where.status = status
  if (priority) where.priority = priority
  if (jurisdiction) where.jurisdiction = jurisdiction
  if (archived !== undefined) where.archived = archived
  if (dataSource && dataSource.length > 0) where.dataSource = { in: dataSource as DataSource[] }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { lineItemNumber: { contains: search } },
      { significanceToMassCEO: { contains: search } },
      { notes: { contains: search } },
    ]
  }

  if (tags && tags.length > 0) {
    where.tags = { some: { name: { in: tags } } }
  }

  const skip = (page - 1) * pageSize

  const [items, total] = await Promise.all([
    prisma.budgetItem.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ priority: 'asc' }, { updatedAt: 'desc' }],
      include: {
        staffLead: { select: { id: true, name: true, email: true, role: true } },
        tags: true,
        documents: { select: { id: true, title: true, filename: true, mimeType: true, uploadedAt: true } },
      },
    }),
    prisma.budgetItem.count({ where }),
  ])

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export async function getBudgetItem(id: number) {
  return prisma.budgetItem.findUnique({
    where: { id },
    include: {
      staffLead: { select: { id: true, name: true, email: true, role: true } },
      tags: true,
      documents: true,
      notes_rel: {
        include: { author: { select: { id: true, name: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      },
      history: {
        include: { author: { select: { id: true, name: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      },
      legislativeItems: {
        select: { id: true, title: true, billNumber: true, status: true, jurisdiction: true },
      },
      hearings: {
        select: { id: true, title: true, date: true, status: true },
        orderBy: { date: 'asc' },
      },
      policyIdeas: {
        select: { id: true, title: true, disposition: true },
      },
      knowledgeEntries: {
        select: { id: true, title: true, entryType: true, createdAt: true },
      },
      budgetStages: {
        orderBy: { stage: 'asc' },
      },
      amendments: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

export async function createBudgetItem(
  data: Prisma.BudgetItemCreateInput & { tags?: string[] }
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

  return prisma.budgetItem.create({
    data: {
      ...rest,
      tags: tagOps,
    },
    include: {
      staffLead: { select: { id: true, name: true, email: true } },
      tags: true,
    },
  })
}

export async function updateBudgetItem(
  id: number,
  data: Partial<Prisma.BudgetItemUpdateInput> & { tags?: string[] }
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

  return prisma.budgetItem.update({
    where: { id },
    data: {
      ...rest,
      tags: tagOps,
    },
    include: {
      staffLead: { select: { id: true, name: true, email: true } },
      tags: true,
    },
  })
}

export async function deleteBudgetItem(id: number) {
  return prisma.budgetItem.delete({ where: { id } })
}
