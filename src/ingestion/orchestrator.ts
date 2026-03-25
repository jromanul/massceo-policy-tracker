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
import { BudgetSourceStage, BudgetStatus } from '@prisma/client'

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
): Promise<SyncResult[]> {
  const results: SyncResult[] = []

  // Sync MA Legislature bills
  try {
    results.push(await syncLegislation('ma_legislature', triggerType, { query: 'employee ownership cooperative' }))
  } catch (err) {
    console.error('[syncAll] MA Legislature sync failed:', err)
  }

  // Sync MA Legislature hearings
  try {
    results.push(await syncHearings('ma_legislature', triggerType))
  } catch (err) {
    console.error('[syncAll] MA Legislature hearing sync failed:', err)
  }

  // Sync Congress.gov (only if API key is set)
  if (process.env.CONGRESS_GOV_API_KEY) {
    try {
      results.push(await syncLegislation('congress_gov', triggerType, { query: 'employee ownership' }))
    } catch (err) {
      console.error('[syncAll] Congress.gov sync failed:', err)
    }
  }

  // Sync MA Budget from budget.digital.mass.gov
  try {
    results.push(await syncBudgetFromAdapter('ma_budget', triggerType))
  } catch (err) {
    console.error('[syncAll] MA Budget sync failed:', err)
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

// ─── Helpers ─────────────────────────────────────────────────────

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
