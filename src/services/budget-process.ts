import { prisma } from '@/lib/db'

export async function getBudgetProcessTimeline(fiscalYear: number) {
  const stages = await prisma.budgetProcessStage.findMany({
    where: { fiscalYear },
    orderBy: { stageOrder: 'asc' },
    include: {
      relatedBudgetItem: {
        select: {
          id: true,
          name: true,
          lineItemNumber: true,
          amountProposed: true,
          amountAdopted: true,
          status: true,
        },
      },
      relatedHearing: {
        select: {
          id: true,
          title: true,
          date: true,
          status: true,
        },
      },
    },
  })

  // Fetch EO-relevant amendments for House/Senate debate stages of this FY
  const amendments = await prisma.amendment.findMany({
    where: {
      archived: false,
      dataSource: 'MA_LEGISLATURE',
      // Only amendments that were scraped (have sourceExternalId with FY)
      sourceExternalId: { contains: `ma-amendment-${fiscalYear}-` },
    },
    orderBy: [{ chamber: 'asc' }, { amendmentNumber: 'asc' }],
    select: {
      id: true,
      amendmentNumber: true,
      title: true,
      filedBy: true,
      chamber: true,
      stage: true,
      status: true,
      amount: true,
      sourceUrl: true,
      budgetItemId: true,
      eoRelevanceNotes: true,
    },
  })

  const houseAmendments = amendments
    .filter((a) => a.chamber === 'HOUSE')
    .map((a) => ({
      ...a,
      amount: a.amount ? Number(a.amount) : null,
    }))
  const senateAmendments = amendments
    .filter((a) => a.chamber === 'SENATE')
    .map((a) => ({
      ...a,
      amount: a.amount ? Number(a.amount) : null,
    }))

  const currentStage = stages.find((s) => s.isCurrent)
  const completedCount = stages.filter((s) => s.stageStatus === 'COMPLETED').length

  return {
    fiscalYear,
    stages: stages.map((s) => ({
      id: s.id,
      stageKey: s.stageKey,
      stageOrder: s.stageOrder,
      stageLabel: s.stageLabel,
      stageDescription: s.stageDescription,
      stageStatus: s.stageStatus,
      stageDate: s.stageDate?.toISOString() ?? null,
      stageDateIsEstimate: s.stageDateIsEstimate,
      sourceSystem: s.sourceSystem,
      sourceUrl: s.sourceUrl,
      sourceRetrievedAt: s.sourceRetrievedAt?.toISOString() ?? null,
      isAuthoritative: s.isAuthoritative,
      massceoNote: s.massceoNote,
      isCurrent: s.isCurrent,
      relatedBudgetItem: s.relatedBudgetItem
        ? {
            id: s.relatedBudgetItem.id,
            name: s.relatedBudgetItem.name,
            lineItemNumber: s.relatedBudgetItem.lineItemNumber,
            amountProposed: s.relatedBudgetItem.amountProposed
              ? Number(s.relatedBudgetItem.amountProposed)
              : null,
            amountAdopted: s.relatedBudgetItem.amountAdopted
              ? Number(s.relatedBudgetItem.amountAdopted)
              : null,
            status: s.relatedBudgetItem.status,
          }
        : null,
      relatedHearing: s.relatedHearing
        ? {
            id: s.relatedHearing.id,
            title: s.relatedHearing.title,
            date: s.relatedHearing.date.toISOString(),
            status: s.relatedHearing.status,
          }
        : null,
      // Attach EO-relevant amendments to the appropriate debate stage
      amendments:
        s.stageKey === 'HOUSE_DEBATE'
          ? houseAmendments
          : s.stageKey === 'SENATE_DEBATE'
          ? senateAmendments
          : [],
    })),
    currentStageKey: currentStage?.stageKey ?? null,
    completedCount,
    totalCount: stages.length,
  }
}

/**
 * Mark a stage as COMPLETED, set the next stage as CURRENT.
 */
export async function advanceStage(stageId: number, completedDate?: Date) {
  const stage = await prisma.budgetProcessStage.findUnique({ where: { id: stageId } })
  if (!stage) throw new Error(`Stage ${stageId} not found`)

  // Mark this stage as COMPLETED
  await prisma.budgetProcessStage.update({
    where: { id: stageId },
    data: {
      stageStatus: 'COMPLETED',
      isCurrent: false,
      stageDate: completedDate ?? stage.stageDate ?? new Date(),
      stageDateIsEstimate: false,
      updatedAt: new Date(),
    },
  })

  // Find the next stage by order
  const nextStage = await prisma.budgetProcessStage.findFirst({
    where: {
      fiscalYear: stage.fiscalYear,
      stageOrder: stage.stageOrder + 1,
    },
  })

  if (nextStage) {
    // Clear any existing isCurrent flags for this fiscal year
    await prisma.budgetProcessStage.updateMany({
      where: { fiscalYear: stage.fiscalYear, isCurrent: true },
      data: { isCurrent: false },
    })

    // Set next stage as CURRENT
    await prisma.budgetProcessStage.update({
      where: { id: nextStage.id },
      data: {
        stageStatus: 'CURRENT',
        isCurrent: true,
        updatedAt: new Date(),
      },
    })
  }

  return { completedStage: stage.stageKey, nextStage: nextStage?.stageKey ?? null }
}

export async function getBudgetProcessSummary(fiscalYear: number) {
  const stages = await prisma.budgetProcessStage.findMany({
    where: { fiscalYear },
    orderBy: { stageOrder: 'asc' },
    select: {
      stageKey: true,
      stageLabel: true,
      stageStatus: true,
      stageDate: true,
      stageDateIsEstimate: true,
      isCurrent: true,
    },
  })

  if (stages.length === 0) return null

  const currentStage = stages.find((s) => s.isCurrent)
  const completedCount = stages.filter((s) => s.stageStatus === 'COMPLETED').length
  const nextStage = stages.find(
    (s) => s.stageStatus === 'UPCOMING' || s.stageStatus === 'NOT_YET_AVAILABLE'
  )

  return {
    fiscalYear,
    currentStageLabel: currentStage?.stageLabel ?? null,
    completedCount,
    totalCount: stages.length,
    nextStageLabel: nextStage?.stageLabel ?? null,
    nextStageDate: nextStage?.stageDate?.toISOString() ?? null,
    nextStageDateIsEstimate: nextStage?.stageDateIsEstimate ?? false,
    stages: stages.map((s) => ({
      stageKey: s.stageKey,
      stageLabel: s.stageLabel,
      stageStatus: s.stageStatus,
    })),
  }
}
