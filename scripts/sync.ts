#!/usr/bin/env tsx
/**
 * CLI Sync Runner
 *
 * Usage:
 *   tsx scripts/sync.ts                    # Sync all sources
 *   tsx scripts/sync.ts ma_legislature     # Sync MA Legislature only
 *   tsx scripts/sync.ts congress_gov       # Sync Congress.gov only
 *   tsx scripts/sync.ts --hearings         # Sync hearings only
 *   tsx scripts/sync.ts --status           # Show sync status
 *
 * Can be used with cron (every 6 hours):
 *   0 0,6,12,18 * * * cd /path/to/massceo-tracker && npx tsx scripts/sync.ts >> logs/sync.log 2>&1
 */

import { syncLegislation, syncHearings, syncAll, getSyncStatusForAllSources } from '../src/ingestion'
import type { AdapterSource, SyncResult } from '../src/ingestion/types'

const VALID_SOURCES: AdapterSource[] = ['ma_legislature', 'congress_gov']

function formatDate(d: Date | null): string {
  if (!d) return 'never'
  return d.toISOString().replace('T', ' ').slice(0, 19)
}

function printResult(result: SyncResult): void {
  const icon = result.status === 'success' ? '✓' : result.status === 'partial' ? '⚠' : '✗'
  console.log(`\n${icon} ${result.source} — ${result.status}`)
  console.log(`  Processed: ${result.recordsProcessed}`)
  console.log(`  Created:   ${result.recordsCreated}`)
  console.log(`  Updated:   ${result.recordsUpdated}`)
  console.log(`  Skipped:   ${result.recordsSkipped}`)
  console.log(`  Duration:  ${((result.completedAt.getTime() - result.startedAt.getTime()) / 1000).toFixed(1)}s`)

  if (result.errors.length > 0) {
    console.log(`  Errors (${result.errors.length}):`)
    for (const err of result.errors.slice(0, 5)) {
      console.log(`    - [${err.externalId}] ${err.message}`)
    }
    if (result.errors.length > 5) {
      console.log(`    ... and ${result.errors.length - 5} more`)
    }
  }

  if (result.warnings.length > 0) {
    console.log(`  Warnings (${result.warnings.length}):`)
    for (const w of result.warnings.slice(0, 5)) {
      console.log(`    - ${w}`)
    }
  }
}

async function showStatus(): Promise<void> {
  const statuses = await getSyncStatusForAllSources()
  console.log('\nSync Status:')
  console.log('─'.repeat(60))
  for (const s of statuses) {
    console.log(`  ${s.displayName}`)
    console.log(`    Last sync:  ${formatDate(s.lastSyncAt)}`)
    console.log(`    Status:     ${s.lastSyncStatus ?? 'never synced'}`)
    console.log(`    Records:    ${s.recordsInSystem}`)
    console.log(`    Running:    ${s.isRunning ? 'yes' : 'no'}`)
    console.log()
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)

  console.log(`[${formatDate(new Date())}] MassCEO Sync Runner`)

  if (args.includes('--status')) {
    await showStatus()
    process.exit(0)
  }

  const hearingsOnly = args.includes('--hearings')
  const sourceArg = args.find((a) => !a.startsWith('--'))

  if (sourceArg && !VALID_SOURCES.includes(sourceArg as AdapterSource)) {
    console.error(`Invalid source: ${sourceArg}`)
    console.error(`Valid sources: ${VALID_SOURCES.join(', ')}`)
    process.exit(1)
  }

  try {
    if (sourceArg) {
      const source = sourceArg as AdapterSource
      if (hearingsOnly) {
        const result = await syncHearings(source, 'cli')
        printResult(result)
      } else {
        const result = await syncLegislation(source, 'cli')
        printResult(result)

        // Also sync hearings if the source supports it
        if (source === 'ma_legislature' && !hearingsOnly) {
          try {
            const hearingResult = await syncHearings(source, 'cli')
            printResult(hearingResult)
          } catch {
            console.log('  (hearings sync not available for this source)')
          }
        }
      }
    } else {
      console.log('Syncing all sources...')
      const results = await syncAll('cli')
      for (const result of results) {
        printResult(result)
      }
    }

    console.log(`\n[${formatDate(new Date())}] Sync complete`)
  } catch (err) {
    console.error('Sync failed:', err)
    process.exit(1)
  }

  process.exit(0)
}

main()
