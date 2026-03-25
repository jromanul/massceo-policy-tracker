import { prisma } from '@/lib/db'
import { DataSource, Jurisdiction, HearingStatus, HearingType, Prisma } from '@prisma/client'

export interface HearingFilters {
  status?: HearingStatus
  hearingType?: HearingType
  jurisdiction?: Jurisdiction
  dateFrom?: Date
  dateTo?: Date
  committee?: string
  search?: string
  dataSource?: string[]
  page?: number
  pageSize?: number
}

export async function getHearings(filters: HearingFilters = {}) {
  const {
    page = 1,
    pageSize = 20,
    status,
    hearingType,
    jurisdiction,
    dateFrom,
    dateTo,
    committee,
    search,
    dataSource,
  } = filters

  const where: Prisma.HearingWhereInput = {}

  if (status) where.status = status
  if (hearingType) where.hearingType = hearingType
  if (jurisdiction) where.jurisdiction = jurisdiction
  if (committee) where.committeeOrBody = { contains: committee }
  if (dataSource && dataSource.length > 0) where.dataSource = { in: dataSource as DataSource[] }

  if (dateFrom || dateTo) {
    where.date = {}
    if (dateFrom) where.date.gte = dateFrom
    if (dateTo) where.date.lte = dateTo
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { summary: { contains: search } },
      { committeeOrBody: { contains: search } },
      { location: { contains: search } },
    ]
  }

  const skip = (page - 1) * pageSize

  const [items, total] = await Promise.all([
    prisma.hearing.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { date: 'asc' },
      include: {
        responsibleStaff: { select: { id: true, name: true, email: true, role: true } },
        tags: true,
        legislativeItems: {
          select: { id: true, title: true, billNumber: true, jurisdiction: true, status: true },
        },
        budgetItems: {
          select: { id: true, name: true, fiscalYear: true, status: true },
        },
      },
    }),
    prisma.hearing.count({ where }),
  ])

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export async function getHearing(id: number) {
  return prisma.hearing.findUnique({
    where: { id },
    include: {
      responsibleStaff: { select: { id: true, name: true, email: true, role: true } },
      tags: true,
      documents: true,
      notes: {
        include: { author: { select: { id: true, name: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      },
      legislativeItems: {
        select: { id: true, title: true, billNumber: true, jurisdiction: true, status: true, priority: true },
      },
      budgetItems: {
        select: { id: true, name: true, fiscalYear: true, status: true, priority: true },
      },
      knowledgeEntries: {
        select: { id: true, title: true, entryType: true, createdAt: true },
      },
    },
  })
}

export async function createHearing(
  data: Prisma.HearingCreateInput & { tags?: string[] }
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

  return prisma.hearing.create({
    data: {
      ...rest,
      tags: tagOps,
    },
    include: {
      responsibleStaff: { select: { id: true, name: true, email: true } },
      tags: true,
    },
  })
}

export async function updateHearing(
  id: number,
  data: Partial<Prisma.HearingUpdateInput> & { tags?: string[] }
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

  return prisma.hearing.update({
    where: { id },
    data: {
      ...rest,
      tags: tagOps,
    },
    include: {
      responsibleStaff: { select: { id: true, name: true, email: true } },
      tags: true,
    },
  })
}

export async function deleteHearing(id: number) {
  return prisma.hearing.delete({ where: { id } })
}
