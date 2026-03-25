import { prisma } from '@/lib/db'
import {
  AmendmentStatus,
  AmendmentType,
  BudgetSourceStage,
  DataSource,
  Prisma,
} from '@prisma/client'

export interface AmendmentFilters {
  status?: AmendmentStatus
  type?: AmendmentType
  stage?: BudgetSourceStage
  budgetItemId?: number
  legislativeItemId?: number
  dataSource?: DataSource
  search?: string
  archived?: boolean
  page?: number
  pageSize?: number
}

export async function getAmendments(filters: AmendmentFilters = {}) {
  const {
    page = 1,
    pageSize = 20,
    status,
    type,
    stage,
    budgetItemId,
    legislativeItemId,
    dataSource,
    search,
    archived,
  } = filters

  const where: Prisma.AmendmentWhereInput = {}

  if (status) where.status = status
  if (type) where.type = type
  if (stage) where.stage = stage
  if (budgetItemId) where.budgetItemId = budgetItemId
  if (legislativeItemId) where.legislativeItemId = legislativeItemId
  if (dataSource) where.dataSource = dataSource
  if (archived !== undefined) where.archived = archived

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { amendmentNumber: { contains: search } },
      { description: { contains: search } },
      { filedBy: { contains: search } },
    ]
  }

  const skip = (page - 1) * pageSize

  const [items, total] = await Promise.all([
    prisma.amendment.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        budgetItem: { select: { id: true, name: true, fiscalYear: true } },
        legislativeItem: { select: { id: true, title: true, billNumber: true } },
      },
    }),
    prisma.amendment.count({ where }),
  ])

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export async function getAmendment(id: number) {
  return prisma.amendment.findUnique({
    where: { id },
    include: {
      budgetItem: { select: { id: true, name: true, fiscalYear: true } },
      legislativeItem: { select: { id: true, title: true, billNumber: true } },
    },
  })
}

export async function createAmendment(data: Prisma.AmendmentUncheckedCreateInput) {
  return prisma.amendment.create({
    data,
    include: {
      budgetItem: { select: { id: true, name: true, fiscalYear: true } },
      legislativeItem: { select: { id: true, title: true, billNumber: true } },
    },
  })
}

export async function updateAmendment(id: number, data: Prisma.AmendmentUncheckedUpdateInput) {
  return prisma.amendment.update({
    where: { id },
    data,
    include: {
      budgetItem: { select: { id: true, name: true, fiscalYear: true } },
      legislativeItem: { select: { id: true, title: true, billNumber: true } },
    },
  })
}

export async function deleteAmendment(id: number) {
  return prisma.amendment.delete({ where: { id } })
}
