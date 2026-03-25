import { prisma } from '@/lib/db'
import {
  DataSource,
  Jurisdiction,
  Chamber,
  Priority,
  LegislativeStatus,
  TrackingTier,
  Prisma,
} from '@prisma/client'

export interface LegislativeItemFilters {
  jurisdiction?: Jurisdiction
  status?: LegislativeStatus
  priority?: Priority
  chamber?: Chamber
  committee?: string
  search?: string
  archived?: boolean
  tags?: string[]
  staffLeadId?: number
  trackingTier?: TrackingTier
  dataSource?: string[]
  eoRelevant?: boolean
  page?: number
  pageSize?: number
}

export async function getLegislativeItems(filters: LegislativeItemFilters = {}) {
  const {
    page = 1,
    pageSize = 20,
    jurisdiction,
    status,
    priority,
    chamber,
    committee,
    search,
    archived,
    tags,
    staffLeadId,
    trackingTier,
    dataSource,
    eoRelevant,
  } = filters

  const where: Prisma.LegislativeItemWhereInput = {}

  if (jurisdiction) where.jurisdiction = jurisdiction
  if (eoRelevant) where.eoRelevanceScore = { gte: 10 }
  if (status) where.status = status
  if (priority) where.priority = priority
  if (chamber) where.chamber = chamber
  if (committee) where.assignedCommittee = { contains: committee }
  if (archived !== undefined) where.archived = archived
  if (staffLeadId) where.staffLeadId = staffLeadId
  if (trackingTier) where.trackingTier = trackingTier
  if (dataSource && dataSource.length > 0) where.dataSource = { in: dataSource as DataSource[] }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { billNumber: { contains: search } },
      { shortSummary: { contains: search } },
      { issueCategory: { contains: search } },
    ]
  }

  if (tags && tags.length > 0) {
    where.tags = { some: { name: { in: tags } } }
  }

  const skip = (page - 1) * pageSize

  const [items, total] = await Promise.all([
    prisma.legislativeItem.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ statusDate: 'desc' }, { updatedAt: 'desc' }],
      include: {
        staffLead: { select: { id: true, name: true, email: true, role: true } },
        tags: true,
        documents: { select: { id: true, title: true, filename: true, mimeType: true, uploadedAt: true } },
        _count: { select: { notes: true, history: true } },
      },
    }),
    prisma.legislativeItem.count({ where }),
  ])

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export async function getLegislativeItem(id: number) {
  const item = await prisma.legislativeItem.findUnique({
    where: { id },
    include: {
      staffLead: { select: { id: true, name: true, email: true, role: true } },
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
      hearings: {
        orderBy: { date: 'asc' },
        include: { responsibleStaff: { select: { id: true, name: true } } },
      },
      budgetItems: {
        select: { id: true, name: true, fiscalYear: true, status: true, amountProposed: true, amountAdopted: true },
      },
      policyIdeas: {
        select: { id: true, title: true, disposition: true, dateSubmitted: true },
      },
      externalSourceRefs: true,
      knowledgeEntries: {
        select: { id: true, title: true, entryType: true, createdAt: true },
      },
      amendments: {
        orderBy: { createdAt: 'desc' },
      },
      billActions: {
        orderBy: { actionDate: 'desc' },
      },
    },
  })
  return item
}

export async function createLegislativeItem(
  data: Prisma.LegislativeItemCreateInput & { tags?: string[] }
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

  return prisma.legislativeItem.create({
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

export async function updateLegislativeItem(
  id: number,
  data: Partial<Prisma.LegislativeItemUpdateInput> & { tags?: string[] }
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

  return prisma.legislativeItem.update({
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

export async function deleteLegislativeItem(id: number) {
  return prisma.legislativeItem.delete({ where: { id } })
}
