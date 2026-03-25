import { prisma } from '@/lib/db'
import {
  Jurisdiction,
  BoardInterestLevel,
  BoardDiscussionStatus,
  HearingStatus,
} from '@prisma/client'
import { getContentClass } from '@/lib/source-metadata'

export async function getDashboardData() {
  const now = new Date()
  // MA fiscal year starts July 1: if current month >= July, FY = next calendar year
  const currentFY = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear()

  const [
    totalLegislation,
    upcomingHearingsCount,
    activeBudgetItems,
    policyIdeasCount,
    maBills,
    federalItems,
    upcomingHearings,
    fy27BudgetItems,
    recentLegislation,
    recentBudget,
    recentHearings,
    recentPolicies,
    needsBoardAttentionLegislation,
    needsBoardAttentionBudget,
    recentPolicyIdeas,
  ] = await Promise.all([
    // Stats counts — only count EO-relevant legislation
    prisma.legislativeItem.count({ where: { archived: false, eoRelevanceScore: { gte: 10 } } }),
    prisma.hearing.count({ where: { status: HearingStatus.UPCOMING } }),
    prisma.budgetItem.count({ where: { archived: false, fiscalYear: { in: [currentFY, currentFY + 1] } } }),
    prisma.policyIdea.count({ where: { archived: false } }),

    // MA bills (top 5, EO-relevant only)
    prisma.legislativeItem.findMany({
      where: {
        jurisdiction: Jurisdiction.MASSACHUSETTS,
        archived: false,
        eoRelevanceScore: { gte: 10 },
      },
      take: 5,
      orderBy: [{ eoRelevanceScore: 'desc' }, { updatedAt: 'desc' }],
      include: {
        tags: true,
      },
    }),

    // Federal items (top 5, EO-relevant only)
    prisma.legislativeItem.findMany({
      where: {
        jurisdiction: Jurisdiction.FEDERAL,
        archived: false,
        eoRelevanceScore: { gte: 10 },
      },
      take: 5,
      orderBy: [{ eoRelevanceScore: 'desc' }, { updatedAt: 'desc' }],
      include: {
        tags: true,
      },
    }),

    // Upcoming hearings (next 10) — show all UPCOMING regardless of date
    prisma.hearing.findMany({
      where: {
        status: HearingStatus.UPCOMING,
      },
      take: 10,
      orderBy: { date: 'asc' },
      include: {
        legislativeItems: { select: { id: true, title: true, billNumber: true } },
        budgetItems: { select: { id: true, name: true, fiscalYear: true } },
      },
    }),

    // Budget snapshot (current + upcoming FY)
    prisma.budgetItem.findMany({
      where: { fiscalYear: { in: [currentFY, currentFY + 1] } },
      select: {
        status: true,
        amountProposed: true,
        amountAdopted: true,
        dataSource: true,
        fiscalYear: true,
        name: true,
        sourceStage: true,
        significanceToMassCEO: true,
      },
    }),

    // Recently updated legislation (last 10, EO-relevant only)
    prisma.legislativeItem.findMany({
      where: { eoRelevanceScore: { gte: 10 } },
      take: 10,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        billNumber: true,
        status: true,
        priority: true,
        updatedAt: true,
        jurisdiction: true,
        dataSource: true,
      },
    }),

    // Recently updated budget items (last 10)
    prisma.budgetItem.findMany({
      take: 10,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        fiscalYear: true,
        status: true,
        priority: true,
        updatedAt: true,
        dataSource: true,
      },
    }),

    // Recently updated hearings (last 10)
    prisma.hearing.findMany({
      take: 10,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        date: true,
        status: true,
        updatedAt: true,
        dataSource: true,
      },
    }),

    // Recently updated policy ideas (last 10)
    prisma.policyIdea.findMany({
      take: 10,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        disposition: true,
        updatedAt: true,
        dataSource: true,
      },
    }),

    // Needs board attention - legislation
    prisma.legislativeItem.findMany({
      where: {
        archived: false,
        boardInterestLevel: BoardInterestLevel.HIGH,
      },
      take: 10,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        billNumber: true,
        boardInterestLevel: true,
        priority: true,
        jurisdiction: true,
        status: true,
        dataSource: true,
      },
    }),

    // Needs board attention - budget
    prisma.budgetItem.findMany({
      where: {
        archived: false,
        boardDiscussionStatus: BoardDiscussionStatus.ACTION_REQUIRED,
      },
      take: 10,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        fiscalYear: true,
        boardDiscussionStatus: true,
        priority: true,
        status: true,
        dataSource: true,
      },
    }),

    // Recent policy ideas (last 5)
    prisma.policyIdea.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        tags: true,
      },
    }),
  ])

  // Compute FY27 budget snapshot — separate current FY from next FY
  const byStatus: Record<string, number> = {}
  let totalProposed = 0
  let totalAdopted = 0
  let fy27Proposed: number | null = null
  let fy27Stage: string | null = null

  for (const item of fy27BudgetItems) {
    byStatus[item.status] = (byStatus[item.status] || 0) + 1
    totalProposed += Number(item.amountProposed ?? 0)
    if (item.amountAdopted) totalAdopted += Number(item.amountAdopted)
  }

  // Extract FY27-specific data for prominent display
  const nextFYItems = fy27BudgetItems.filter((i) => (i as any).fiscalYear === currentFY + 1)
  if (nextFYItems.length > 0) {
    fy27Proposed = nextFYItems.reduce((sum, i) => sum + Number(i.amountProposed ?? 0), 0)
    fy27Stage = nextFYItems[0].status
  }

  // Source breakdown for dashboard stat annotations
  const allBudgetSeed = fy27BudgetItems.length > 0 && fy27BudgetItems.every((i) => i.dataSource === 'SEED')

  const legislationBySource: Record<string, number> = {}
  for (const item of recentLegislation) {
    legislationBySource[item.dataSource] = (legislationBySource[item.dataSource] || 0) + 1
  }
  const hearingsBySource: Record<string, number> = {}
  for (const item of recentHearings) {
    hearingsBySource[item.dataSource] = (hearingsBySource[item.dataSource] || 0) + 1
  }

  // Merge recently updated across all types, then split by content class
  const allRecent = [
    ...recentLegislation.map((i) => ({
      id: i.id,
      type: 'legislation' as const,
      title: i.billNumber ? `${i.billNumber} — ${i.title}` : i.title,
      updatedAt: i.updatedAt.toISOString(),
      status: i.status,
      dataSource: i.dataSource,
    })),
    ...recentBudget.map((i) => ({
      id: i.id,
      type: 'budget' as const,
      title: `FY${i.fiscalYear} — ${i.name}`,
      updatedAt: i.updatedAt.toISOString(),
      status: i.status,
      dataSource: i.dataSource,
    })),
    ...recentHearings.map((i) => ({
      id: i.id,
      type: 'hearing' as const,
      title: i.title,
      updatedAt: i.updatedAt.toISOString(),
      status: i.status,
      dataSource: i.dataSource,
    })),
    ...recentPolicies.map((i) => ({
      id: i.id,
      type: 'policy' as const,
      title: i.title,
      updatedAt: i.updatedAt.toISOString(),
      status: i.disposition,
      dataSource: i.dataSource,
    })),
  ]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  const recentlyUpdatedExternal = allRecent
    .filter((item) => getContentClass(item.dataSource) === 'authoritative_external')
    .slice(0, 10)
  const recentlyUpdatedInternal = allRecent
    .filter((item) => getContentClass(item.dataSource) !== 'authoritative_external')
    .slice(0, 10)

  // Build board attention flat array
  const boardAttention = [
    ...needsBoardAttentionLegislation.map((i) => ({
      id: i.id,
      type: 'legislation',
      title: i.billNumber ? `${i.billNumber} — ${i.title}` : i.title,
      reason: `Board interest: ${i.boardInterestLevel}`,
      href: `/legislation/${i.id}`,
      dataSource: i.dataSource,
    })),
    ...needsBoardAttentionBudget.map((i) => ({
      id: i.id,
      type: 'budget',
      title: `FY${i.fiscalYear} — ${i.name}`,
      reason: `Board discussion: ${i.boardDiscussionStatus}`,
      href: `/budget/${i.id}`,
      dataSource: i.dataSource,
    })),
  ]

  return {
    stats: {
      totalLegislation,
      upcomingHearings: upcomingHearingsCount,
      activeBudgetItems,
      policyIdeas: policyIdeasCount,
    },
    highPriorityLegislation: maBills.map((b) => ({
      id: b.id,
      billNumber: b.billNumber,
      title: b.title,
      status: b.status,
      jurisdiction: b.jurisdiction,
      dataSource: b.dataSource,
    })),
    highPriorityFederal: federalItems.map((b) => ({
      id: b.id,
      billNumber: b.billNumber,
      title: b.title,
      status: b.status,
      dataSource: b.dataSource,
    })),
    upcomingHearings: upcomingHearings.map((h) => ({
      id: h.id,
      title: h.title,
      startDatetime: h.date.toISOString(),
      committee: h.committeeOrBody,
      status: h.status,
      dataSource: h.dataSource,
    })),
    budgetSnapshot: {
      totalProposed: totalProposed || null,
      totalAdopted: totalAdopted || null,
      byStatus,
      allSeed: allBudgetSeed,
      nextFY: currentFY + 1,
      nextFYProposed: fy27Proposed,
      nextFYStage: fy27Stage,
      items: fy27BudgetItems.map((i) => ({
        fiscalYear: (i as any).fiscalYear as number,
        name: (i as any).name as string,
        amountProposed: Number(i.amountProposed ?? 0),
        amountAdopted: i.amountAdopted ? Number(i.amountAdopted) : null,
        status: i.status,
        sourceStage: (i as any).sourceStage as string,
        significanceToMassCEO: (i as any).significanceToMassCEO as string | null,
      })),
    },
    sourceBreakdown: {
      legislation: legislationBySource,
      hearings: hearingsBySource,
    },
    recentlyUpdatedExternal,
    recentlyUpdatedInternal,
    boardAttention,
    recentPolicyIdeas: recentPolicyIdeas.map((p) => ({
      id: p.id,
      title: p.title,
      disposition: p.disposition,
      issueArea: p.issueArea,
      createdAt: p.createdAt.toISOString(),
      dataSource: p.dataSource,
    })),
  }
}
