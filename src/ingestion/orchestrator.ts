/**
 * Sync Orchestrator
 *
 * Coordinates sync runs: fetch → normalize → upsert → log.
 *
 * CRITICAL: Never overwrites staff-maintained fields.
 * Only source-derived fields are updated from live data.
 */

import { prisma } from '@/lib/db'
import { createBillAdapter, createHearingAdapter } from './adapters'
import {
  MALegislatureNormalizer,
  CongressGovNormalizer,
  MALegislatureHearingNormalizer,
} from './normalizers'
import { recordSyncRun } from './sync-log'
import { computeRelevanceScore } from '@/lib/relevance'
import type {
  AdapterSource,
  SyncResult,
  SyncError,
  NormalizeResult,
  CanonicalLegislationInput,
  CanonicalHearingInput,
  FetchParams,
} from './types'
import { BudgetSourceStage, BudgetStatus, AmendmentStatus, AmendmentType, Chamber } from '@prisma/client'
import { scrapeAmendments } from './adapters/malegislature-amendments'
import { fetchBudgetBillStatus } from './adapters/malegislature-budget-bill'
import {
  fetchAllPeerStateBills,
  isOpenStatesConfigured,
  PEER_STATES,
  sortStatesByStaleness,
} from './adapters/openstates'

// Map AdapterSource to Prisma DataSource enum values
const DATA_SOURCE_MAP: Record<AdapterSource, string> = {
  ma_legislature: 'MA_LEGISLATURE',
  congress_gov: 'CONGRESS_GOV',
  csv_import: 'CSV_IMPORT',
  json_import: 'JSON_IMPORT',
  ma_budget: 'MA_LEGISLATURE',
}

/**
 * Fields that are ONLY set from source data. Staff-maintained fields are never overwritten.
 */
const SOURCE_DERIVED_LEGISLATION_FIELDS = [
  'title',
  'billNumber',
  'sessionNumber',
  'chamber',
  'primarySponsor',
  'coSponsors',
  'assignedCommittee',
  'status',
  'rawSourceStatus',
  'statusDate',
  'externalLinks',
  'sourceUrl',
  'rawSourceData',
  'lastSyncedAt',
] as const

const SOURCE_DERIVED_HEARING_FIELDS = [
  'title',
  'eventType',
  'date',
  'time',
  'location',
  'committeeOrBody',
  'jurisdiction',
  'status',
  'sourceUrl',
  'rawSourceData',
  'lastSyncedAt',
] as const

/**
 * Run a sync for legislation from a given source.
 */
export async function syncLegislation(
  source: AdapterSource,
  triggerType: 'manual' | 'scheduled' | 'cli' = 'manual',
  fetchParams: FetchParams = {},
): Promise<SyncResult> {
  const startedAt = new Date()
  const errors: SyncError[] = []
  const warnings: string[] = []
  let processed = 0
  let created = 0
  let updated = 0
  let skipped = 0

  // Mark sync as running
  const runningLog = await prisma.syncLog.create({
    data: {
      source,
      status: 'running',
      triggerType,
      startedAt,
    },
  })

  try {
    // 1. Fetch raw data
    const adapter = createBillAdapter(source)
    const rawRecords = await adapter.fetch(fetchParams)

    // 2. Get appropriate normalizer
    const normalizer = getNormalizerForSource(source)

    // 3. Process each record
    for (const raw of rawRecords) {
      processed++
      try {
        const { normalized, warnings: normWarnings } = normalizer.normalize(raw.data)
        warnings.push(...normWarnings)

        // 4. Upsert: check if record exists by sourceExternalId
        const existing = await prisma.legislativeItem.findFirst({
          where: { sourceExternalId: normalized.sourceExternalId },
        })

        if (existing) {
          // Only update source-derived fields, never overwrite staff data
          const updateData = buildSourceDerivedUpdate(normalized)

          // Check if anything actually changed
          const hasChanges = detectLegislationChanges(existing, updateData)

          if (hasChanges) {
            await prisma.legislativeItem.update({
              where: { id: existing.id },
              data: {
                ...updateData,
                lastSyncedAt: new Date(),
                sourceRetrievedAt: new Date(),
              },
            })

            // Create history entry for the update
            await prisma.historyEntry.create({
              data: {
                action: 'sync_update',
                description: `Updated from ${adapter.displayName}`,
                details: JSON.stringify({
                  source,
                  changedFields: Object.keys(updateData),
                  previousStatus: existing.status,
                  newStatus: updateData.status,
                }),
                legislativeItemId: existing.id,
              },
            })

            // Extract bill actions from raw source data
            await extractAndUpsertBillActions(existing.id, normalized.rawSourceData)

            updated++
          } else {
            // Touch lastSyncedAt even if no changes
            await prisma.legislativeItem.update({
              where: { id: existing.id },
              data: { lastSyncedAt: new Date(), sourceRetrievedAt: new Date() },
            })
            skipped++
          }
        } else {
          // Also check by unique constraint (jurisdiction + billNumber + sessionNumber)
          const existingByBill = await prisma.legislativeItem.findFirst({
            where: {
              jurisdiction: normalized.jurisdiction,
              billNumber: normalized.billNumber,
              sessionNumber: normalized.sessionNumber ?? undefined,
            },
          })

          if (existingByBill) {
            // Record exists (likely manually entered), add source tracking
            const updateData = buildSourceDerivedUpdate(normalized)
            await prisma.legislativeItem.update({
              where: { id: existingByBill.id },
              data: {
                ...updateData,
                dataSource: DATA_SOURCE_MAP[source] as any,
                sourceExternalId: normalized.sourceExternalId,
                lastSyncedAt: new Date(),
                sourceRetrievedAt: new Date(),
              },
            })

            await prisma.historyEntry.create({
              data: {
                action: 'sync_linked',
                description: `Linked to ${adapter.displayName} source`,
                details: JSON.stringify({ source, externalId: normalized.sourceExternalId }),
                legislativeItemId: existingByBill.id,
              },
            })

            // Extract bill actions from raw source data
            await extractAndUpsertBillActions(existingByBill.id, normalized.rawSourceData)

            updated++
          } else {
            // Create new record
            const eoScore = computeRelevanceScore(normalized.title, normalized.shortSummary, normalized.issueCategory)
            const newItem = await prisma.legislativeItem.create({
              data: {
                jurisdiction: normalized.jurisdiction,
                billNumber: normalized.billNumber,
                sessionNumber: normalized.sessionNumber,
                title: normalized.title,
                shortSummary: normalized.shortSummary,
                chamber: normalized.chamber,
                primarySponsor: normalized.primarySponsor,
                coSponsors: normalized.coSponsors ?? [],
                assignedCommittee: normalized.assignedCommittee,
                status: normalized.status as any,
                rawSourceStatus: normalized.rawSourceStatus,
                statusDate: normalized.statusDate,
                externalLinks: normalized.externalLinks,
                issueCategory: normalized.issueCategory,
                eoRelevanceScore: eoScore,
                dataSource: DATA_SOURCE_MAP[source] as any,
                sourceUrl: normalized.sourceUrl,
                sourceExternalId: normalized.sourceExternalId,
                rawSourceData: normalized.rawSourceData as any,
                lastSyncedAt: new Date(),
                sourceRetrievedAt: new Date(),
              },
            })

            // Extract bill actions from raw source data
            await extractAndUpsertBillActions(newItem.id, normalized.rawSourceData)

            created++
          }
        }
      } catch (err) {
        errors.push({
          externalId: raw.externalId,
          message: err instanceof Error ? err.message : String(err),
          details: err,
        })
      }
    }

    const completedAt = new Date()
    const status = errors.length > 0 ? (created + updated > 0 ? 'partial' : 'failed') : 'success'

    const result: SyncResult = {
      source,
      triggerType,
      status: status as any,
      recordsProcessed: processed,
      recordsCreated: created,
      recordsUpdated: updated,
      recordsSkipped: skipped,
      errors,
      warnings,
      startedAt,
      completedAt,
    }

    // Update the running log entry
    await prisma.syncLog.update({
      where: { id: runningLog.id },
      data: {
        status: result.status,
        recordsProcessed: result.recordsProcessed,
        recordsCreated: result.recordsCreated,
        recordsUpdated: result.recordsUpdated,
        recordsSkipped: result.recordsSkipped,
        errors: result.errors.length > 0 ? JSON.stringify(result.errors) : null,
        warnings: result.warnings.length > 0 ? JSON.stringify(result.warnings) : null,
        completedAt,
      },
    })

    return result
  } catch (err) {
    const completedAt = new Date()
    const result: SyncResult = {
      source,
      triggerType,
      status: 'failed',
      recordsProcessed: processed,
      recordsCreated: created,
      recordsUpdated: updated,
      recordsSkipped: skipped,
      errors: [
        ...errors,
        { externalId: 'SYSTEM', message: err instanceof Error ? err.message : String(err) },
      ],
      warnings,
      startedAt,
      completedAt,
    }

    await prisma.syncLog.update({
      where: { id: runningLog.id },
      data: {
        status: 'failed',
        recordsProcessed: result.recordsProcessed,
        recordsCreated: result.recordsCreated,
        recordsUpdated: result.recordsUpdated,
        errors: JSON.stringify(result.errors),
        completedAt,
      },
    })

    return result
  }
}

/**
 * Run a sync for hearings from a given source.
 */
export async function syncHearings(
  source: AdapterSource,
  triggerType: 'manual' | 'scheduled' | 'cli' = 'manual',
  fetchParams: FetchParams = {},
): Promise<SyncResult> {
  const startedAt = new Date()
  const errors: SyncError[] = []
  const warnings: string[] = []
  let processed = 0
  let created = 0
  let updated = 0
  let skipped = 0

  const runningLog = await prisma.syncLog.create({
    data: {
      source: `${source}_hearings`,
      status: 'running',
      triggerType,
      startedAt,
    },
  })

  try {
    const adapter = createHearingAdapter(source)
    const rawRecords = await adapter.fetch(fetchParams)

    const normalizer = new MALegislatureHearingNormalizer()

    for (const raw of rawRecords) {
      processed++
      try {
        const { normalized, warnings: normWarnings } = normalizer.normalize(raw.data as any)
        warnings.push(...normWarnings)

        const existing = await prisma.hearing.findFirst({
          where: { sourceExternalId: normalized.sourceExternalId },
        })

        if (existing) {
          const hasChanges =
            existing.title !== normalized.title ||
            existing.status !== normalized.status ||
            existing.location !== (normalized.location ?? null)

          if (hasChanges) {
            await prisma.hearing.update({
              where: { id: existing.id },
              data: {
                title: normalized.title,
                eventType: normalized.eventType,
                date: normalized.date,
                time: normalized.time,
                location: normalized.location,
                committeeOrBody: normalized.committeeOrBody,
                jurisdiction: normalized.jurisdiction as any,
                status: normalized.status as any,
                sourceUrl: normalized.sourceUrl,
                rawSourceData: normalized.rawSourceData as any,
                lastSyncedAt: new Date(),
                sourceRetrievedAt: new Date(),
              },
            })

            // Link related bills on update (not just creation)
            if (normalized.relatedBillExternalIds?.length) {
              const relatedBills = await prisma.legislativeItem.findMany({
                where: {
                  sourceExternalId: { in: normalized.relatedBillExternalIds },
                },
                select: { id: true },
              })
              if (relatedBills.length > 0) {
                await prisma.hearing.update({
                  where: { id: existing.id },
                  data: {
                    legislativeItems: {
                      connect: relatedBills.map((b) => ({ id: b.id })),
                    },
                  },
                })
              }
            }

            updated++
          } else {
            await prisma.hearing.update({
              where: { id: existing.id },
              data: { lastSyncedAt: new Date(), sourceRetrievedAt: new Date() },
            })
            skipped++
          }
        } else {
          const newHearing = await prisma.hearing.create({
            data: {
              title: normalized.title,
              eventType: normalized.eventType,
              date: normalized.date,
              time: normalized.time,
              location: normalized.location,
              committeeOrBody: normalized.committeeOrBody,
              jurisdiction: normalized.jurisdiction as any,
              status: normalized.status as any,
              dataSource: DATA_SOURCE_MAP[source] as any,
              sourceUrl: normalized.sourceUrl,
              sourceExternalId: normalized.sourceExternalId,
              rawSourceData: normalized.rawSourceData as any,
              lastSyncedAt: new Date(),
              sourceRetrievedAt: new Date(),
            },
          })

          // Link related bills if we have them
          if (normalized.relatedBillExternalIds?.length) {
            const relatedBills = await prisma.legislativeItem.findMany({
              where: {
                sourceExternalId: { in: normalized.relatedBillExternalIds },
              },
              select: { id: true },
            })
            if (relatedBills.length > 0) {
              await prisma.hearing.update({
                where: { id: newHearing.id },
                data: {
                  legislativeItems: {
                    connect: relatedBills.map((b) => ({ id: b.id })),
                  },
                },
              })
            }
          }

          created++
        }
      } catch (err) {
        errors.push({
          externalId: raw.externalId,
          message: err instanceof Error ? err.message : String(err),
        })
      }
    }

    // Auto-complete any past-dated (or same-day) hearings still marked
    // UPCOMING. The MA Legislature calendar scrape only covers the current
    // month, and seed-only budget milestones (sourceExternalId =
    // "ma-budget-milestone-*") never go through the normalizer's date-based
    // status logic, so they linger as UPCOMING after the event has passed.
    // Compare against the start of *tomorrow* so any hearing whose calendar
    // date is today or earlier flips to COMPLETED.
    //
    // NOTE: We fetch + filter in JS rather than using a `date: { lt }` Prisma
    // WHERE clause. Some legacy rows have their `date` column stored as
    // INTEGER (Unix ms) while newer rows are TEXT (ISO). SQLite's type
    // affinity treats INTEGER as less than any TEXT value, so a bare Prisma
    // datetime comparison incorrectly matches every integer-stored row. The
    // JS-side comparison handles both representations uniformly because
    // Prisma deserializes both into JS Date objects.
    try {
      const tomorrowStart = new Date()
      tomorrowStart.setHours(0, 0, 0, 0)
      tomorrowStart.setDate(tomorrowStart.getDate() + 1)
      const upcomingHearings = await prisma.hearing.findMany({
        where: { status: 'UPCOMING' },
        select: { id: true, date: true, eventType: true, dataSource: true },
      })
      // Only auto-complete real scraped hearings (actual meetings with a fixed
      // date). Manually-curated milestone entries — budget-process markers,
      // committee reporting deadlines, the open-ended conference-negotiation
      // window — carry placeholder/estimated dates whose status is maintained by
      // hand. Flipping those to COMPLETED when a placeholder date passes would
      // falsely show an active stage (e.g. ongoing conference negotiations) as
      // finished. Skip anything authored manually or typed as a milestone.
      const MILESTONE_TYPES = new Set(['Budget Milestone', 'Committee Deadline'])
      const toComplete = upcomingHearings.filter(
        (h) =>
          h.date < tomorrowStart &&
          h.dataSource !== 'MANUAL' &&
          !MILESTONE_TYPES.has(h.eventType ?? ''),
      )
      if (toComplete.length > 0) {
        const result = await prisma.hearing.updateMany({
          where: { id: { in: toComplete.map((h) => h.id) } },
          data: { status: 'COMPLETED' },
        })
        updated += result.count
        console.log(`[syncHearings] Auto-completed ${result.count} past-dated hearing(s).`)
      }
    } catch (err) {
      warnings.push(
        `Auto-complete pass failed: ${err instanceof Error ? err.message : String(err)}`,
      )
    }

    const completedAt = new Date()
    const status = errors.length > 0 ? (created + updated > 0 ? 'partial' : 'failed') : 'success'

    const result: SyncResult = {
      source,
      triggerType,
      status: status as any,
      recordsProcessed: processed,
      recordsCreated: created,
      recordsUpdated: updated,
      recordsSkipped: skipped,
      errors,
      warnings,
      startedAt,
      completedAt,
    }

    await prisma.syncLog.update({
      where: { id: runningLog.id },
      data: {
        status: result.status,
        recordsProcessed: result.recordsProcessed,
        recordsCreated: result.recordsCreated,
        recordsUpdated: result.recordsUpdated,
        recordsSkipped: result.recordsSkipped,
        errors: result.errors.length > 0 ? JSON.stringify(result.errors) : null,
        warnings: result.warnings.length > 0 ? JSON.stringify(result.warnings) : null,
        completedAt,
      },
    })

    return result
  } catch (err) {
    const completedAt = new Date()
    const result: SyncResult = {
      source,
      triggerType,
      status: 'failed',
      recordsProcessed: processed,
      recordsCreated: created,
      recordsUpdated: updated,
      recordsSkipped: skipped,
      errors: [
        ...errors,
        { externalId: 'SYSTEM', message: err instanceof Error ? err.message : String(err) },
      ],
      warnings,
      startedAt,
      completedAt,
    }

    await prisma.syncLog.update({
      where: { id: runningLog.id },
      data: {
        status: 'failed',
        errors: JSON.stringify(result.errors),
        completedAt,
      },
    })

    return result
  }
}

/**
 * Run a sync for budget items (currently supports CSV/JSON import).
 * Budget data does not yet have an automated scraper — use seed-budget.ts for initial population.
 */
export async function syncBudget(
  source: AdapterSource,
  triggerType: 'manual' | 'scheduled' | 'cli' = 'manual',
  records: Array<{ externalId: string; data: Record<string, string> }> = [],
): Promise<SyncResult> {
  const startedAt = new Date()
  const errors: SyncError[] = []
  const warnings: string[] = []
  let processed = 0
  let created = 0
  let updated = 0
  let skipped = 0

  const runningLog = await prisma.syncLog.create({
    data: {
      source: `${source}_budget`,
      status: 'running',
      triggerType,
      startedAt,
    },
  })

  try {
    const { BudgetNormalizer } = await import('./normalizers/budget')
    const normalizer = new BudgetNormalizer()

    for (const raw of records) {
      processed++
      try {
        const { normalized, warnings: normWarnings } = normalizer.normalize(raw.data)
        warnings.push(...normWarnings)

        const existing = await prisma.budgetItem.findFirst({
          where: {
            lineItemNumber: normalized.lineItemNumber,
            fiscalYear: normalized.fiscalYear,
          },
        })

        if (existing) {
          skipped++
        } else {
          const budgetItem = await prisma.budgetItem.create({
            data: {
              name: normalized.name,
              lineItemNumber: normalized.lineItemNumber,
              fiscalYear: normalized.fiscalYear,
              sourceStage: normalized.sourceStage as BudgetSourceStage,
              amountProposed: normalized.amountProposed,
              status: normalized.status as BudgetStatus,
              significanceToMassCEO: normalized.significanceToMassCEO,
              notes: normalized.notes,
              dataSource: DATA_SOURCE_MAP[source] as any,
            },
          })

          if (normalized.amountProposed != null) {
            await prisma.budgetStage.create({
              data: {
                budgetItemId: budgetItem.id,
                stage: normalized.sourceStage as BudgetSourceStage,
                amount: normalized.amountProposed,
              },
            })
          }

          created++
        }
      } catch (err) {
        errors.push({
          externalId: raw.externalId,
          message: err instanceof Error ? err.message : String(err),
        })
      }
    }

    const completedAt = new Date()
    const status = errors.length > 0 ? (created + updated > 0 ? 'partial' : 'failed') : 'success'

    const result: SyncResult = {
      source, triggerType, status: status as any,
      recordsProcessed: processed, recordsCreated: created,
      recordsUpdated: updated, recordsSkipped: skipped,
      errors, warnings, startedAt, completedAt,
    }

    await prisma.syncLog.update({
      where: { id: runningLog.id },
      data: {
        status: result.status,
        recordsProcessed: result.recordsProcessed,
        recordsCreated: result.recordsCreated,
        recordsUpdated: result.recordsUpdated,
        recordsSkipped: result.recordsSkipped,
        errors: result.errors.length > 0 ? JSON.stringify(result.errors) : null,
        warnings: result.warnings.length > 0 ? JSON.stringify(result.warnings) : null,
        completedAt,
      },
    })

    return result
  } catch (err) {
    const completedAt = new Date()
    const result: SyncResult = {
      source, triggerType, status: 'failed',
      recordsProcessed: processed, recordsCreated: created,
      recordsUpdated: updated, recordsSkipped: skipped,
      errors: [...errors, { externalId: 'SYSTEM', message: err instanceof Error ? err.message : String(err) }],
      warnings, startedAt, completedAt,
    }
    await prisma.syncLog.update({
      where: { id: runningLog.id },
      data: { status: 'failed', errors: JSON.stringify(result.errors), completedAt },
    })
    return result
  }
}

/**
 * Run a full sync for all active sources.
 */
export async function syncAll(
  triggerType: 'manual' | 'scheduled' | 'cli' = 'scheduled',
  options: {
    /**
     * Total wall-clock budget for the entire sync run, in ms. The Vercel
     * Hobby cron caps each invocation at 60 s, so the cron route should pass
     * ~50000 (10 s safety margin). Whatever's left after the MA pipelines is
     * forwarded to the peer-state sync (when skipPeerStates is false), which
     * uses staleness rotation to process the stalest states within the
     * remaining budget.
     */
    totalBudgetMs?: number
    /**
     * Skip the peer-state OpenStates sync entirely. The main /api/cron/sync
     * route sets this to true because peer-states now has its own dedicated
     * cron (/api/cron/peer-state-sync) that gets a full 60 s budget rather
     * than the leftover seconds after the MA pipelines complete.
     */
    skipPeerStates?: boolean
  } = {},
): Promise<SyncResult[]> {
  // Reap zombie "running" rows left by any previously killed invocation so the
  // admin health view and staleness checks aren't polluted by them.
  await reapStuckSyncs().catch((err) => console.error('[syncAll] reapStuckSyncs failed:', err))

  const results: SyncResult[] = []
  const now = new Date()
  const currentFY = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear()
  const targetFY = currentFY + 1 // next FY being debated

  // Run the independent MA + federal scrapers CONCURRENTLY. They previously ran
  // sequentially under a shared ~50 s budget, gated by a `timeForNextStep()`
  // check, so one slow source (e.g. a 46 s malegislature.gov response) could
  // exhaust the budget and SILENTLY drop every remaining scraper — stale data,
  // and because the skip happened before the SyncLog.create, no error row at
  // all. Running them in parallel makes the wall-clock cost the slowest single
  // scraper rather than the sum of all of them, so every scraper completes
  // within Vercel's 60 s limit on a normal day. Each scraper writes its own
  // SyncLog and is isolated by allSettled (one failure can't abort the others),
  // and the adapters hold no shared mutable module state, so concurrent
  // execution is safe.
  const tasks: Array<{ name: string; run: () => Promise<SyncResult> }> = [
    { name: 'MA Legislature bills', run: () => syncLegislation('ma_legislature', triggerType) },
    { name: 'MA Legislature hearings', run: () => syncHearings('ma_legislature', triggerType) },
    { name: 'MA Budget', run: () => syncBudgetFromAdapter('ma_budget', triggerType) },
    { name: 'Budget bill status', run: () => syncBudgetBills(targetFY, triggerType) },
    { name: 'House amendments', run: () => syncBudgetAmendments(targetFY, 'HOUSE', triggerType) },
    { name: 'Senate amendments', run: () => syncBudgetAmendments(targetFY, 'SENATE', triggerType) },
  ]
  // Congress.gov only when its API key is configured.
  if (process.env.CONGRESS_GOV_API_KEY) {
    tasks.push({ name: 'Congress.gov', run: () => syncLegislation('congress_gov', triggerType) })
  }

  const settled = await Promise.allSettled(tasks.map((t) => t.run()))
  settled.forEach((s, i) => {
    if (s.status === 'fulfilled') {
      results.push(s.value)
    } else {
      console.error(`[syncAll] ${tasks[i].name} sync failed:`, s.reason)
    }
  })

  // Peer-state bills via OpenStates. The main /api/cron/sync route passes
  // skipPeerStates:true because peer-states has its own dedicated cron with a
  // full 60 s budget (OpenStates' 10 req/min rate limit makes a full refresh
  // take minutes). This branch only runs for manual/CLI opt-ins.
  if (isOpenStatesConfigured() && !options.skipPeerStates) {
    try {
      results.push(
        await syncPeerStateBills(triggerType, {
          timeBudgetMs: options.totalBudgetMs ?? 50000,
        }),
      )
    } catch (err) {
      console.error('[syncAll] Peer state bills sync failed:', err)
    }
  }

  return results
}

/**
 * Run a budget sync using the adapter (fetches from budget.digital.mass.gov).
 */
export async function syncBudgetFromAdapter(
  source: AdapterSource,
  triggerType: 'manual' | 'scheduled' | 'cli' = 'manual',
  fetchParams: FetchParams = {},
): Promise<SyncResult> {
  const startedAt = new Date()
  const errors: SyncError[] = []
  const warnings: string[] = []
  let processed = 0
  let created = 0
  let updated = 0
  let skipped = 0

  const runningLog = await prisma.syncLog.create({
    data: {
      source: `${source}_budget`,
      status: 'running',
      triggerType,
      startedAt,
    },
  })

  try {
    const { createBudgetAdapter } = await import('./adapters')
    const adapter = createBudgetAdapter(source)
    const rawRecords = await adapter.fetch(fetchParams)

    for (const raw of rawRecords) {
      processed++
      try {
        const d = raw.data as any
        const existing = await prisma.budgetItem.findFirst({
          where: {
            lineItemNumber: d.lineItemNumber,
            fiscalYear: d.fiscalYear,
          },
        })

        if (existing) {
          // Update amount if stage matches or is newer
          const existingStage = await prisma.budgetStage.findFirst({
            where: {
              budgetItemId: existing.id,
              stage: d.stage as BudgetSourceStage,
            },
          })

          if (existingStage) {
            const newAmount = Number(d.amount ?? 0)
            const oldAmount = Number(existingStage.amount)
            if (newAmount !== oldAmount) {
              await prisma.budgetStage.update({
                where: { id: existingStage.id },
                data: {
                  amount: newAmount,
                  sourceUrl: d.url ?? null,
                  sourceRetrievedAt: new Date(),
                  provenance: 'source-imported',
                },
              })
              updated++
            } else {
              skipped++
            }
          } else {
            // New stage for existing budget item
            await prisma.budgetStage.create({
              data: {
                budgetItemId: existing.id,
                stage: d.stage as BudgetSourceStage,
                amount: Number(d.amount ?? 0),
                sourceUrl: d.url ?? null,
                sourceRetrievedAt: new Date(),
                provenance: 'source-imported',
                notes: d.description ?? null,
              },
            })
            created++
          }

          // Touch sync timestamps
          await prisma.budgetItem.update({
            where: { id: existing.id },
            data: { lastSyncedAt: new Date(), sourceRetrievedAt: new Date() },
          })
        } else {
          // New budget item
          const budgetItem = await prisma.budgetItem.create({
            data: {
              name: d.name,
              lineItemNumber: d.lineItemNumber,
              fiscalYear: d.fiscalYear,
              sourceStage: d.stage as BudgetSourceStage,
              amountProposed: Number(d.amount ?? 0),
              status: 'PROPOSED' as BudgetStatus,
              dataSource: 'MA_LEGISLATURE' as any,
              sourceUrl: d.url ?? null,
              sourceExternalId: raw.externalId,
              lastSyncedAt: new Date(),
              sourceRetrievedAt: new Date(),
            },
          })

          await prisma.budgetStage.create({
            data: {
              budgetItemId: budgetItem.id,
              stage: d.stage as BudgetSourceStage,
              amount: Number(d.amount ?? 0),
              sourceUrl: d.url ?? null,
              sourceRetrievedAt: new Date(),
              provenance: 'source-imported',
              notes: d.description ?? null,
            },
          })

          created++
        }
      } catch (err) {
        errors.push({
          externalId: raw.externalId,
          message: err instanceof Error ? err.message : String(err),
        })
      }
    }

    const completedAt = new Date()
    const status = errors.length > 0 ? (created + updated > 0 ? 'partial' : 'failed') : 'success'

    const result: SyncResult = {
      source,
      triggerType,
      status: status as any,
      recordsProcessed: processed,
      recordsCreated: created,
      recordsUpdated: updated,
      recordsSkipped: skipped,
      errors,
      warnings,
      startedAt,
      completedAt,
    }

    await prisma.syncLog.update({
      where: { id: runningLog.id },
      data: {
        status: result.status,
        recordsProcessed: result.recordsProcessed,
        recordsCreated: result.recordsCreated,
        recordsUpdated: result.recordsUpdated,
        recordsSkipped: result.recordsSkipped,
        errors: result.errors.length > 0 ? JSON.stringify(result.errors) : null,
        warnings: result.warnings.length > 0 ? JSON.stringify(result.warnings) : null,
        completedAt,
      },
    })

    return result
  } catch (err) {
    const completedAt = new Date()
    const result: SyncResult = {
      source,
      triggerType,
      status: 'failed',
      recordsProcessed: processed,
      recordsCreated: created,
      recordsUpdated: updated,
      recordsSkipped: skipped,
      errors: [...errors, { externalId: 'SYSTEM', message: err instanceof Error ? err.message : String(err) }],
      warnings,
      startedAt,
      completedAt,
    }

    await prisma.syncLog.update({
      where: { id: runningLog.id },
      data: {
        status: 'failed',
        recordsProcessed: result.recordsProcessed,
        errors: JSON.stringify(result.errors),
        completedAt,
      },
    })

    return result
  }
}

/**
 * Sync budget amendments from malegislature.gov for a given fiscal year and chamber.
 * Scrapes the debate page, filters to EO-relevant amendments, and upserts into the DB.
 * Links amendments to the MassCEO budget item (7002-1075) for the given FY.
 */
export async function syncBudgetAmendments(
  fiscalYear: number,
  chamber: 'HOUSE' | 'SENATE',
  triggerType: 'manual' | 'scheduled' | 'cli' = 'manual',
): Promise<SyncResult> {
  const source = 'ma_legislature' as AdapterSource
  const startedAt = new Date()
  const errors: SyncError[] = []
  const warnings: string[] = []
  let processed = 0
  let created = 0
  let updated = 0
  let skipped = 0

  const runningLog = await prisma.syncLog.create({
    data: {
      source: `${source}_amendments_${chamber.toLowerCase()}_fy${fiscalYear}`,
      status: 'running',
      triggerType,
      startedAt,
    },
  })

  try {
    const amendments = await scrapeAmendments({ fiscalYear, chamber })

    // Find the MassCEO budget item for this fiscal year to link amendments to
    const masscoItem = await prisma.budgetItem.findFirst({
      where: { lineItemNumber: '7002-1075', fiscalYear },
    })

    const stage: BudgetSourceStage = chamber === 'HOUSE' ? 'HOUSE' : 'SENATE'
    const prismaChamber: Chamber = chamber === 'HOUSE' ? Chamber.HOUSE : Chamber.SENATE

    for (const a of amendments) {
      processed++
      try {
        const externalId = `ma-amendment-${a.fiscalYear}-${a.billNumber}-${a.chamber}-${a.amendmentNumber}`

        // Match an existing amendment by sourceExternalId OR by its natural key
        // (amendment number + chamber + linked budget item). The natural-key
        // fallback is essential: curated/manually-entered amendment records use
        // a different sourceExternalId format (no bill-number segment), and
        // matching on sourceExternalId alone would let the scraper create a
        // duplicate of an already-tracked amendment on every run. Oldest record
        // wins so the original curated row is the one that gets updated.
        const existing = await prisma.amendment.findFirst({
          where: {
            OR: [
              { sourceExternalId: externalId },
              {
                amendmentNumber: a.amendmentNumber,
                chamber: prismaChamber,
                ...(masscoItem?.id ? { budgetItemId: masscoItem.id } : {}),
              },
            ],
          },
          orderBy: { id: 'asc' },
        })

        if (existing) {
          // Update source-derived fields only (preserve staff notes/status)
          const hasChanges =
            existing.title !== a.title ||
            existing.filedBy !== a.sponsor

          if (hasChanges) {
            await prisma.amendment.update({
              where: { id: existing.id },
              data: {
                title: a.title,
                filedBy: a.sponsor,
                sourceUrl: a.sourceUrl,
                rawSourceStatus: a.action || a.subject,
                lastSyncedAt: new Date(),
                sourceRetrievedAt: new Date(),
                rawSourceData: a as any,
              },
            })
            updated++
          } else {
            await prisma.amendment.update({
              where: { id: existing.id },
              data: { lastSyncedAt: new Date(), sourceRetrievedAt: new Date() },
            })
            skipped++
          }
        } else {
          await prisma.amendment.create({
            data: {
              amendmentNumber: a.amendmentNumber,
              title: a.title,
              type: AmendmentType.AMENDMENT,
              filedBy: a.sponsor,
              stage,
              chamber: prismaChamber,
              status: AmendmentStatus.FILED,
              statusDate: new Date(),
              eoRelevanceNotes: `Matched EO keyword filter on ${chamber} debate amendments page for FY${fiscalYear}.`,
              sourceUrl: a.sourceUrl,
              budgetItemId: masscoItem?.id,
              dataSource: 'MA_LEGISLATURE' as any,
              sourceExternalId: externalId,
              rawSourceStatus: a.action || a.subject,
              lastSyncedAt: new Date(),
              sourceRetrievedAt: new Date(),
              rawSourceData: a as any,
            },
          })
          created++
        }
      } catch (err) {
        errors.push({
          externalId: `amendment-${a.amendmentNumber}`,
          message: err instanceof Error ? err.message : String(err),
        })
      }
    }

    const completedAt = new Date()
    const status = errors.length > 0 ? (created + updated > 0 ? 'partial' : 'failed') : 'success'

    const result: SyncResult = {
      source,
      triggerType,
      status: status as any,
      recordsProcessed: processed,
      recordsCreated: created,
      recordsUpdated: updated,
      recordsSkipped: skipped,
      errors,
      warnings,
      startedAt,
      completedAt,
    }

    await prisma.syncLog.update({
      where: { id: runningLog.id },
      data: {
        status: result.status,
        recordsProcessed: result.recordsProcessed,
        recordsCreated: result.recordsCreated,
        recordsUpdated: result.recordsUpdated,
        recordsSkipped: result.recordsSkipped,
        errors: result.errors.length > 0 ? JSON.stringify(result.errors) : null,
        warnings: result.warnings.length > 0 ? JSON.stringify(result.warnings) : null,
        completedAt,
      },
    })

    return result
  } catch (err) {
    const completedAt = new Date()
    const result: SyncResult = {
      source,
      triggerType,
      status: 'failed',
      recordsProcessed: processed,
      recordsCreated: created,
      recordsUpdated: updated,
      recordsSkipped: skipped,
      errors: [...errors, { externalId: 'SYSTEM', message: err instanceof Error ? err.message : String(err) }],
      warnings,
      startedAt,
      completedAt,
    }

    await prisma.syncLog.update({
      where: { id: runningLog.id },
      data: { status: 'failed', errors: JSON.stringify(result.errors), completedAt },
    })

    return result
  }
}

/**
 * Sync the status of the budget bills (H.5500 = House FY27 budget, etc.) and
 * auto-advance the budget timeline stages based on bill actions.
 *
 * Mapping:
 *  - H.5500 reported from HWM  -> HWM_BUDGET = COMPLETED, HOUSE_DEBATE = CURRENT
 *  - H.5500 passed by House    -> HOUSE_DEBATE = COMPLETED, HOUSE_BUDGET = COMPLETED, SWM_BUDGET = CURRENT
 *  - Senate bill reported      -> SWM_BUDGET = COMPLETED, SENATE_DEBATE = CURRENT
 *  - Senate bill passed        -> SENATE_DEBATE = COMPLETED, SENATE_BUDGET = COMPLETED, CONFERENCE_COMMITTEE = CURRENT
 *  - Conference report filed   -> CONFERENCE_COMMITTEE = COMPLETED, FINAL_TO_GOVERNOR = CURRENT
 *  - Signed by Governor        -> FINAL_TO_GOVERNOR = COMPLETED, GOVERNOR_REVIEW = COMPLETED
 */
export async function syncBudgetBills(
  fiscalYear: number,
  triggerType: 'manual' | 'scheduled' | 'cli' = 'manual',
): Promise<SyncResult> {
  const source = 'ma_legislature' as AdapterSource
  const startedAt = new Date()
  const errors: SyncError[] = []
  const warnings: string[] = []
  let processed = 0
  let updated = 0
  let skipped = 0

  const runningLog = await prisma.syncLog.create({
    data: {
      source: `${source}_budget_bill_fy${fiscalYear}`,
      status: 'running',
      triggerType,
      startedAt,
    },
  })

  try {
    // The House budget bill for FY2027 is H.5500. Senate TBD.
    // We track whatever bills we can find via action searches.
    const houseBillNumber = fiscalYear === 2027 ? 'H5500' : null
    // Senate bill number not yet known for FY27; will be detected when SWM releases

    const billsToTrack: Array<{ number: string; chamber: 'HOUSE' | 'SENATE' }> = []
    if (houseBillNumber) billsToTrack.push({ number: houseBillNumber, chamber: 'HOUSE' })

    for (const bill of billsToTrack) {
      processed++
      try {
        const status = await fetchBudgetBillStatus(bill.number)
        if (!status) {
          warnings.push(`Bill ${bill.number} status not retrievable`)
          skipped++
          continue
        }

        // Store the bill status in history/bill-action by finding existing legislation record
        // or creating a note. Since this is about timeline advancement, we update stages.

        // Get the stages for this FY
        const stages = await prisma.budgetProcessStage.findMany({
          where: { fiscalYear },
          orderBy: { stageOrder: 'asc' },
        })

        const hwmStage = stages.find((s) => s.stageKey === 'HWM_BUDGET')
        const houseDebateStage = stages.find((s) => s.stageKey === 'HOUSE_DEBATE')
        const houseBudgetStage = stages.find((s) => s.stageKey === 'HOUSE_BUDGET')
        const swmStage = stages.find((s) => s.stageKey === 'SWM_BUDGET')
        const senateDebateStage = stages.find((s) => s.stageKey === 'SENATE_DEBATE')
        const senateBudgetStage = stages.find((s) => s.stageKey === 'SENATE_BUDGET')
        const conferenceStage = stages.find((s) => s.stageKey === 'CONFERENCE_COMMITTEE')
        const finalStage = stages.find((s) => s.stageKey === 'FINAL_TO_GOVERNOR')
        const governorReviewStage = stages.find((s) => s.stageKey === 'GOVERNOR_REVIEW')

        // Map action flags to stage transitions (only for House-side bills)
        if (bill.chamber === 'HOUSE') {
          // HWM filed — mark HWM_BUDGET complete
          if (hwmStage && hwmStage.stageStatus !== 'COMPLETED') {
            await prisma.budgetProcessStage.update({
              where: { id: hwmStage.id },
              data: {
                stageStatus: 'COMPLETED',
                isCurrent: false,
                sourceUrl: status.sourceUrl,
                sourceRetrievedAt: new Date(),
              },
            })
            updated++
          }

          if (status.isPassedHouse && houseDebateStage && houseDebateStage.stageStatus !== 'COMPLETED') {
            await prisma.budgetProcessStage.update({
              where: { id: houseDebateStage.id },
              data: {
                stageStatus: 'COMPLETED',
                isCurrent: false,
                stageDate: new Date(status.lastActionDate || Date.now()),
                stageDateIsEstimate: false,
                sourceUrl: status.sourceUrl,
                sourceRetrievedAt: new Date(),
              },
            })
            // House passage produces the engrossed House Budget.
            if (houseBudgetStage && houseBudgetStage.stageStatus !== 'COMPLETED') {
              await prisma.budgetProcessStage.update({
                where: { id: houseBudgetStage.id },
                data: {
                  stageStatus: 'COMPLETED',
                  isCurrent: false,
                  stageDate: new Date(status.lastActionDate || Date.now()),
                  stageDateIsEstimate: false,
                  sourceUrl: `https://malegislature.gov/Budget/FY${fiscalYear}/HouseBudget`,
                  sourceRetrievedAt: new Date(),
                },
              })
              updated++
            }
            // Mark SWM as CURRENT
            if (swmStage && swmStage.stageStatus === 'UPCOMING') {
              await prisma.budgetProcessStage.updateMany({
                where: { fiscalYear, isCurrent: true },
                data: { isCurrent: false },
              })
              await prisma.budgetProcessStage.update({
                where: { id: swmStage.id },
                data: { stageStatus: 'CURRENT', isCurrent: true },
              })
            }
            updated++
          } else if (houseDebateStage && !houseDebateStage.isCurrent && houseDebateStage.stageStatus === 'UPCOMING') {
            // HWM bill is filed but House hasn't passed yet — mark HOUSE_DEBATE as CURRENT
            await prisma.budgetProcessStage.updateMany({
              where: { fiscalYear, isCurrent: true },
              data: { isCurrent: false },
            })
            await prisma.budgetProcessStage.update({
              where: { id: houseDebateStage.id },
              data: { stageStatus: 'CURRENT', isCurrent: true },
            })
            updated++
          }

          if (status.isSignedByGovernor) {
            // Mark final and governor review as complete
            if (finalStage && finalStage.stageStatus !== 'COMPLETED') {
              await prisma.budgetProcessStage.update({
                where: { id: finalStage.id },
                data: { stageStatus: 'COMPLETED', isCurrent: false },
              })
              updated++
            }
            if (governorReviewStage && governorReviewStage.stageStatus !== 'COMPLETED') {
              await prisma.budgetProcessStage.update({
                where: { id: governorReviewStage.id },
                data: { stageStatus: 'COMPLETED', isCurrent: false },
              })
              updated++
            }
          }
        }

        if (bill.chamber === 'SENATE') {
          if (swmStage && swmStage.stageStatus !== 'COMPLETED') {
            await prisma.budgetProcessStage.update({
              where: { id: swmStage.id },
              data: {
                stageStatus: 'COMPLETED',
                isCurrent: false,
                sourceUrl: status.sourceUrl,
                sourceRetrievedAt: new Date(),
              },
            })
            updated++
          }

          if (status.isPassedSenate && senateDebateStage && senateDebateStage.stageStatus !== 'COMPLETED') {
            await prisma.budgetProcessStage.update({
              where: { id: senateDebateStage.id },
              data: {
                stageStatus: 'COMPLETED',
                isCurrent: false,
                stageDate: new Date(status.lastActionDate || Date.now()),
                stageDateIsEstimate: false,
              },
            })
            // Senate passage produces the engrossed Senate Budget.
            if (senateBudgetStage && senateBudgetStage.stageStatus !== 'COMPLETED') {
              await prisma.budgetProcessStage.update({
                where: { id: senateBudgetStage.id },
                data: {
                  stageStatus: 'COMPLETED',
                  isCurrent: false,
                  stageDate: new Date(status.lastActionDate || Date.now()),
                  stageDateIsEstimate: false,
                  sourceUrl: `https://malegislature.gov/Budget/FY${fiscalYear}/SenateBudget`,
                  sourceRetrievedAt: new Date(),
                },
              })
              updated++
            }
            if (conferenceStage && conferenceStage.stageStatus === 'UPCOMING') {
              await prisma.budgetProcessStage.updateMany({
                where: { fiscalYear, isCurrent: true },
                data: { isCurrent: false },
              })
              await prisma.budgetProcessStage.update({
                where: { id: conferenceStage.id },
                data: { stageStatus: 'CURRENT', isCurrent: true },
              })
            }
            updated++
          }
        }
      } catch (err) {
        errors.push({
          externalId: `budget-bill-${bill.number}`,
          message: err instanceof Error ? err.message : String(err),
        })
      }
    }

    // ── Reconcile post-passage stages from the engrossed budget bill ──
    // H5500 (tracked above) only carries House-side actions, so the timeline
    // stalls at "Senate Budget" even after the Senate passes its version and a
    // conference committee is appointed. Those post-passage actions — Senate
    // engrossment, conference appointment, the conference report, enactment and
    // the Governor's signature — all land on the engrossed budget bill (H5501
    // for FY27), which both chambers' budgets converge into. Read it and
    // advance the process to whatever stage the live record actually reflects.
    const engrossedBillNumber = fiscalYear === 2027 ? 'H5501' : null
    if (engrossedBillNumber) {
      processed++
      try {
        const eng = await fetchBudgetBillStatus(engrossedBillNumber)
        if (eng) {
          let targetKey: string | null = null
          if (eng.isSignedByGovernor) targetKey = 'GOVERNOR_REVIEW'
          else if (eng.isConferenceReportFiled) targetKey = 'FINAL_TO_GOVERNOR'
          else if (eng.isInConference) targetKey = 'CONFERENCE_COMMITTEE'
          else if (eng.isPassedSenate) targetKey = 'SENATE_BUDGET'
          if (targetKey) {
            const asOf = eng.lastActionDate ? new Date(eng.lastActionDate) : null
            updated += await advanceBudgetProcessTo(fiscalYear, targetKey, asOf, eng.sourceUrl)
          }
        } else {
          warnings.push(`Engrossed bill ${engrossedBillNumber} status not retrievable`)
        }
      } catch (err) {
        errors.push({
          externalId: `engrossed-${engrossedBillNumber}`,
          message: err instanceof Error ? err.message : String(err),
        })
      }
    }

    const completedAt = new Date()
    const status = errors.length > 0 ? (updated > 0 ? 'partial' : 'failed') : 'success'
    const result: SyncResult = {
      source,
      triggerType,
      status: status as any,
      recordsProcessed: processed,
      recordsCreated: 0,
      recordsUpdated: updated,
      recordsSkipped: skipped,
      errors,
      warnings,
      startedAt,
      completedAt,
    }

    await prisma.syncLog.update({
      where: { id: runningLog.id },
      data: {
        status: result.status,
        recordsProcessed: processed,
        recordsUpdated: updated,
        recordsSkipped: skipped,
        errors: result.errors.length > 0 ? JSON.stringify(result.errors) : null,
        warnings: result.warnings.length > 0 ? JSON.stringify(result.warnings) : null,
        completedAt,
      },
    })

    return result
  } catch (err) {
    const completedAt = new Date()
    const result: SyncResult = {
      source,
      triggerType,
      status: 'failed',
      recordsProcessed: processed,
      recordsCreated: 0,
      recordsUpdated: updated,
      recordsSkipped: skipped,
      errors: [...errors, { externalId: 'SYSTEM', message: err instanceof Error ? err.message : String(err) }],
      warnings,
      startedAt,
      completedAt,
    }

    await prisma.syncLog.update({
      where: { id: runningLog.id },
      data: { status: 'failed', errors: JSON.stringify(result.errors), completedAt },
    })

    return result
  }
}

/**
 * Sync employee-ownership bills across peer state legislatures via OpenStates.
 * Upserts into PeerStateBill (separate from LegislativeItem to keep MA-specific
 * workflow fields uncontaminated by multi-state noise).
 *
 * Date filter: only bills with action on/after 2025-01-01 are kept.
 */
export async function syncPeerStateBills(
  triggerType: 'manual' | 'scheduled' | 'cli' = 'manual',
  options: {
    minDate?: Date
    only?: string[]
    timeBudgetMs?: number
  } = {},
): Promise<SyncResult & { statesProcessed?: string[]; statesSkipped?: string[] }> {
  const source = 'ma_legislature' as AdapterSource // reuse for logging (not MA-specific)
  const startedAt = new Date()
  const errors: SyncError[] = []
  const warnings: string[] = []
  let processed = 0
  let created = 0
  let updated = 0
  let skipped = 0

  // Reap any prior zombie "running" rows (this dedicated peer-state cron is the
  // most common source of them, since OpenStates' rate limit pushes runs toward
  // the Vercel timeout) before opening this run's own log.
  await reapStuckSyncs().catch((err) => console.error('[syncPeerStateBills] reapStuckSyncs failed:', err))

  const runningLog = await prisma.syncLog.create({
    data: {
      source: 'openstates_peer_state_bills',
      status: 'running',
      triggerType,
      startedAt,
    },
  })

  try {
    if (!isOpenStatesConfigured()) {
      warnings.push('OPENSTATES_API_KEY not configured — skipping peer state bill sync.')
      const completedAt = new Date()
      await prisma.syncLog.update({
        where: { id: runningLog.id },
        data: {
          status: 'success',
          warnings: JSON.stringify(warnings),
          completedAt,
        },
      })
      return {
        source,
        triggerType,
        status: 'success',
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsSkipped: 0,
        errors: [],
        warnings,
        startedAt,
        completedAt,
      }
    }

    // Fetch each state's freshness signal so we can process the stalest
    // states first. The sort prefers states with REAL bills (refresh their
    // lastActionDate regularly) over states without (rescan periodically).
    const stateInfo: Record<
      string,
      { hasBills: boolean; lastSyncedAt: Date | null }
    > = {}
    for (const { code } of PEER_STATES) {
      // Most recent REAL bill sync (excludes checkpoint sentinel rows)
      const billRow = await prisma.peerStateBill.findFirst({
        where: { state: code, archived: false, NOT: { billNumber: '__CHECKPOINT__' } },
        orderBy: { lastSyncedAt: 'desc' },
        select: { lastSyncedAt: true },
      })
      if (billRow?.lastSyncedAt) {
        stateInfo[code] = { hasBills: true, lastSyncedAt: billRow.lastSyncedAt }
      } else {
        // No real bills — fall back to checkpoint timestamp for ordering
        const cpRow = await prisma.peerStateBill.findFirst({
          where: { state: code, billNumber: '__CHECKPOINT__' },
          orderBy: { lastSyncedAt: 'desc' },
          select: { lastSyncedAt: true },
        })
        stateInfo[code] = { hasBills: false, lastSyncedAt: cpRow?.lastSyncedAt ?? null }
      }
    }
    const stateOrder = sortStatesByStaleness(stateInfo)

    // Incremental persistence: upsert bills after each state completes
    // rather than batching at the end. Keeps the UI populated progressively
    // during a multi-minute OpenStates sync and ensures partial progress
    // survives if the sync is interrupted.
    const upsertBill = async (b: import('./adapters/openstates').PeerStateBillResult) => {
      processed++
      try {
        const existing = await prisma.peerStateBill.findFirst({
          where: {
            state: b.state,
            billNumber: b.billNumber,
            sessionIdentifier: b.sessionIdentifier ?? undefined,
          },
        })

        const sharedData = {
          state: b.state,
          stateName: b.stateName,
          billNumber: b.billNumber,
          sessionIdentifier: b.sessionIdentifier,
          title: b.title,
          shortSummary: b.shortSummary,
          sponsor: b.sponsor,
          chamber: b.chamber as any,
          statusText: b.statusText,
          introducedDate: b.introducedDate,
          lastActionDate: b.lastActionDate,
          lastActionText: b.lastActionText,
          sourceSystem: b.sourceSystem,
          sourceApiId: b.sourceApiId,
          sourceUrl: b.sourceUrl,
          rawSourceData: b.rawSourceData as any,
          matchedKeywords: JSON.stringify(b.matchedKeywords),
          lastSyncedAt: new Date(),
          sourceRetrievedAt: new Date(),
        }

        if (existing) {
          const hasChanges =
            existing.title !== b.title ||
            existing.statusText !== b.statusText ||
            existing.lastActionText !== b.lastActionText ||
            existing.lastActionDate?.getTime() !== b.lastActionDate?.getTime()

          if (hasChanges) {
            await prisma.peerStateBill.update({ where: { id: existing.id }, data: sharedData })
            updated++
          } else {
            await prisma.peerStateBill.update({
              where: { id: existing.id },
              data: { lastSyncedAt: new Date(), sourceRetrievedAt: new Date() },
            })
            skipped++
          }
        } else {
          await prisma.peerStateBill.create({ data: sharedData })
          created++
        }
      } catch (err) {
        errors.push({
          externalId: `${b.state}-${b.billNumber}`,
          message: err instanceof Error ? err.message : String(err),
        })
      }
    }

    const scrapeResult = await fetchAllPeerStateBills({
      minDate: options.minDate,
      only: options.only,
      timeBudgetMs: options.timeBudgetMs,
      stateOrder,
      onStateComplete: async (stateCode, stateBills) => {
        for (const b of stateBills) {
          await upsertBill(b)
        }
        // Write a per-state sync checkpoint regardless of whether bills were
        // found. Without this, states returning 0 EO bills never get a
        // lastSyncedAt timestamp and stay permanently at the front of the
        // staleness rotation queue — which means the cron repeatedly
        // re-scans the same empty states (al, ak, az, ar, …) each day and
        // never rotates to states with actual bills (NY, RI, WI, …). The
        // checkpoint is an archived sentinel row so it never surfaces in the
        // public list, but the staleness query sees its lastSyncedAt.
        const stateName =
          PEER_STATES.find((s) => s.code === stateCode)?.name ?? stateCode
        const existingCheckpoint = await prisma.peerStateBill.findFirst({
          where: { state: stateCode, billNumber: '__CHECKPOINT__' },
          select: { id: true },
        })
        const checkpointData = {
          state: stateCode,
          stateName,
          billNumber: '__CHECKPOINT__',
          title: `[Sync checkpoint — last cron run for ${stateName}]`,
          archived: true,
          lastSyncedAt: new Date(),
          sourceRetrievedAt: new Date(),
        }
        if (existingCheckpoint) {
          await prisma.peerStateBill.update({
            where: { id: existingCheckpoint.id },
            data: { lastSyncedAt: new Date(), sourceRetrievedAt: new Date() },
          })
        } else {
          await prisma.peerStateBill.create({ data: checkpointData })
        }
      },
    })
    for (const [state, msg] of Object.entries(scrapeResult.errorsPerState)) {
      warnings.push(`${state}: ${msg}`)
    }
    if (scrapeResult.statesSkipped.length > 0) {
      warnings.push(
        `Time budget exhausted; skipped states (will be picked up on next sync): ${scrapeResult.statesSkipped.join(', ')}`,
      )
    }
    if (scrapeResult.statesProcessed.length > 0) {
      warnings.push(
        `States processed this run: ${scrapeResult.statesProcessed.join(', ')}`,
      )
    }

    const completedAt = new Date()
    const status = errors.length > 0 ? (created + updated > 0 ? 'partial' : 'failed') : 'success'

    const result: SyncResult = {
      source,
      triggerType,
      status: status as any,
      recordsProcessed: processed,
      recordsCreated: created,
      recordsUpdated: updated,
      recordsSkipped: skipped,
      errors,
      warnings,
      startedAt,
      completedAt,
    }

    await prisma.syncLog.update({
      where: { id: runningLog.id },
      data: {
        status: result.status,
        recordsProcessed: processed,
        recordsCreated: created,
        recordsUpdated: updated,
        recordsSkipped: skipped,
        errors: errors.length > 0 ? JSON.stringify(errors) : null,
        warnings: warnings.length > 0 ? JSON.stringify(warnings) : null,
        completedAt,
      },
    })

    return {
      ...result,
      statesProcessed: scrapeResult.statesProcessed,
      statesSkipped: scrapeResult.statesSkipped,
    }
  } catch (err) {
    const completedAt = new Date()
    await prisma.syncLog.update({
      where: { id: runningLog.id },
      data: {
        status: 'failed',
        errors: JSON.stringify([
          ...errors,
          { externalId: 'SYSTEM', message: err instanceof Error ? err.message : String(err) },
        ]),
        completedAt,
      },
    })

    return {
      source,
      triggerType,
      status: 'failed',
      recordsProcessed: processed,
      recordsCreated: created,
      recordsUpdated: updated,
      recordsSkipped: skipped,
      errors: [
        ...errors,
        { externalId: 'SYSTEM', message: err instanceof Error ? err.message : String(err) },
      ],
      warnings,
      startedAt,
      completedAt,
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────

/**
 * Mark SyncLog rows stuck in "running" as failed. Vercel kills a function at
 * its 60 s limit without giving the handler a chance to write a terminal
 * status, so a timed-out sync leaves a zombie "running" row forever. Those
 * zombies render as a perpetual blue "running" badge in the admin UI and, until
 * the dashboard guards against them, masked the source's real last result. Any
 * row still "running" well past the max function duration is definitively dead.
 */
export async function reapStuckSyncs(maxRunMs = 5 * 60 * 1000): Promise<number> {
  const cutoff = new Date(Date.now() - maxRunMs)
  const res = await prisma.syncLog.updateMany({
    where: { status: 'running', startedAt: { lt: cutoff } },
    data: {
      status: 'failed',
      completedAt: new Date(),
      errors: JSON.stringify([
        {
          externalId: 'SYSTEM',
          message:
            'Reaped: sync exceeded max runtime with no terminal status (presumed killed by the function timeout).',
        },
      ]),
    },
  })
  if (res.count > 0) {
    console.log(`[reapStuckSyncs] Marked ${res.count} stuck "running" sync(s) as failed.`)
  }
  return res.count
}

/**
 * Idempotently advance the budget-process timeline so `targetStageKey` is the
 * CURRENT stage: every earlier stage COMPLETED, every later stage UPCOMING.
 * Forward-only — if the timeline is already past the target (a later stage is
 * current), it's a no-op, so a lagging upstream signal can never roll the
 * process backward. Returns the number of stage rows changed (0 if already in
 * the desired state, which keeps the daily cron quiet once it's caught up).
 */
async function advanceBudgetProcessTo(
  fiscalYear: number,
  targetStageKey: string,
  asOfDate: Date | null,
  sourceUrl: string | null,
): Promise<number> {
  const stages = await prisma.budgetProcessStage.findMany({
    where: { fiscalYear },
    orderBy: { stageOrder: 'asc' },
  })
  const targetIdx = stages.findIndex((s) => s.stageKey === targetStageKey)
  if (targetIdx < 0) return 0
  const currentIdx = stages.findIndex((s) => s.isCurrent)
  // Forward-only: never move the current marker earlier than it already is.
  if (currentIdx >= 0 && targetIdx < currentIdx) return 0

  let changed = 0
  for (let i = 0; i < stages.length; i++) {
    const s = stages[i]
    const desiredStatus = i < targetIdx ? 'COMPLETED' : i === targetIdx ? 'CURRENT' : 'UPCOMING'
    const desiredCurrent = i === targetIdx
    if (s.stageStatus !== desiredStatus || s.isCurrent !== desiredCurrent) {
      await prisma.budgetProcessStage.update({
        where: { id: s.id },
        data: {
          stageStatus: desiredStatus as any,
          isCurrent: desiredCurrent,
          ...(i === targetIdx && asOfDate
            ? { stageDate: asOfDate, stageDateIsEstimate: false }
            : {}),
          ...(i === targetIdx && sourceUrl ? { sourceUrl } : {}),
          sourceRetrievedAt: new Date(),
        },
      })
      changed++
    }
  }
  return changed
}

function getNormalizerForSource(source: AdapterSource): { normalize(raw: any): NormalizeResult<CanonicalLegislationInput> } {
  switch (source) {
    case 'ma_legislature':
      return new MALegislatureNormalizer()
    case 'congress_gov':
      return new CongressGovNormalizer()
    default:
      // For CSV/JSON import, caller should use the specific normalizer with mapping
      return new MALegislatureNormalizer() // fallback
  }
}

/**
 * Build an update object containing ONLY source-derived fields.
 * Staff-maintained fields (notes, priority, relevance, board interest, etc.) are never included.
 */
function buildSourceDerivedUpdate(normalized: CanonicalLegislationInput) {
  return {
    title: normalized.title,
    billNumber: normalized.billNumber,
    sessionNumber: normalized.sessionNumber,
    shortSummary: normalized.shortSummary,
    chamber: normalized.chamber as any,
    primarySponsor: normalized.primarySponsor,
    coSponsors: normalized.coSponsors ?? [],
    assignedCommittee: normalized.assignedCommittee,
    status: normalized.status as any,
    rawSourceStatus: normalized.rawSourceStatus,
    statusDate: normalized.statusDate,
    externalLinks: normalized.externalLinks,
    sourceUrl: normalized.sourceUrl,
    rawSourceData: normalized.rawSourceData as any,
    eoRelevanceScore: computeRelevanceScore(normalized.title, normalized.shortSummary, normalized.issueCategory),
  }
}

/**
 * Detect if source-derived fields have actually changed.
 */
function detectLegislationChanges(
  existing: any,
  update: ReturnType<typeof buildSourceDerivedUpdate>,
): boolean {
  return (
    existing.title !== update.title ||
    existing.status !== update.status ||
    existing.rawSourceStatus !== update.rawSourceStatus ||
    existing.primarySponsor !== update.primarySponsor ||
    existing.assignedCommittee !== update.assignedCommittee ||
    existing.shortSummary !== update.shortSummary ||
    JSON.stringify(existing.coSponsors) !== JSON.stringify(update.coSponsors)
  )
}

/**
 * Extract bill actions from rawSourceData and upsert as BillAction records.
 * Limits to the 20 most recent actions per bill to prevent unbounded growth.
 */
async function extractAndUpsertBillActions(
  legislativeItemId: number,
  rawSourceData: unknown,
): Promise<number> {
  if (!rawSourceData || typeof rawSourceData !== 'object') return 0

  const data = rawSourceData as Record<string, unknown>
  // MA Legislature adapter stores actions in various formats
  const actions = (data.actions || data.actionHistory || data.billActions) as
    | Array<{ text?: string; actionText?: string; date?: string; actionDate?: string; chamber?: string }>
    | undefined

  if (!Array.isArray(actions) || actions.length === 0) return 0

  let created = 0
  const recentActions = actions.slice(0, 20)

  for (const action of recentActions) {
    const actionText = action.text || action.actionText
    const dateStr = action.date || action.actionDate
    if (!actionText || !dateStr) continue

    const actionDate = new Date(dateStr)
    if (isNaN(actionDate.getTime())) continue

    // Check for existing to avoid duplicates
    const existing = await prisma.billAction.findFirst({
      where: {
        legislativeItemId,
        actionText,
        actionDate,
      },
    })

    if (!existing) {
      await prisma.billAction.create({
        data: {
          legislativeItemId,
          actionText,
          actionDate,
          chamber: action.chamber === 'House' ? 'HOUSE' : action.chamber === 'Senate' ? 'SENATE' : undefined,
          rawActionData: action as any,
        },
      })
      created++
    }
  }

  return created
}
