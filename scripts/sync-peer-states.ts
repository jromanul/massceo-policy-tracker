/**
 * scripts/sync-peer-states.ts
 *
 * Run a FULL peer-state bill sync via OpenStates. Writes directly to the
 * production Turso database.
 *
 * Why a CLI script in addition to the /api/peer-state-bills/sync endpoint:
 * OpenStates enforces a 10-request-per-minute rate limit on the free tier,
 * and Vercel Hobby functions time out at 60 seconds. Covering all 17 peer
 * states × 2 queries × (up to) 3 pages = ~100 requests needs ~10 minutes of
 * wall-clock time. The Vercel cron can only cover ~4 states per daily run,
 * rotating through the list over several days. This CLI has no 60 s limit
 * and syncs everything in one pass.
 *
 * Usage:
 *   npm run sync:peer-states             # all 17 peer states (~10 min)
 *   npx tsx scripts/sync-peer-states.ts pa co or   # specific states only
 */

import { syncPeerStateBills } from '../src/ingestion/orchestrator'

async function main() {
  const only = process.argv.slice(2).length > 0 ? process.argv.slice(2) : undefined

  console.log(
    `[sync-peer-states] Full sync${only ? ` for states: ${only.join(', ')}` : ' (all 17 peer states)'}`,
  )
  console.log(
    `[sync-peer-states] Database: ${
      process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || 'local dev.db'
    }`,
  )
  console.log(
    '[sync-peer-states] Rate limit: 10 req/min (OpenStates free tier) — expect ~10 min runtime',
  )
  console.log()

  const result = await syncPeerStateBills('cli', {
    minDate: new Date('2025-01-01T00:00:00Z'),
    only,
    timeBudgetMs: 30 * 60 * 1000, // 30 min hard cap, more than enough
  })

  console.log('\n─────────────────────────────────────────────')
  console.log(`Status:            ${result.status}`)
  console.log(`Records processed: ${result.recordsProcessed}`)
  console.log(`  created:         ${result.recordsCreated}`)
  console.log(`  updated:         ${result.recordsUpdated}`)
  console.log(`  skipped:         ${result.recordsSkipped}`)

  if (result.statesProcessed) {
    console.log(`States processed:  ${result.statesProcessed.join(', ')}`)
  }
  if (result.statesSkipped && result.statesSkipped.length > 0) {
    console.log(`States skipped:    ${result.statesSkipped.join(', ')}`)
  }

  if (result.warnings.length > 0) {
    console.log('\nWarnings:')
    for (const w of result.warnings) console.log(`  - ${w}`)
  }

  if (result.errors.length > 0) {
    console.log('\nErrors:')
    for (const e of result.errors) console.log(`  - ${e.externalId}: ${e.message}`)
    process.exit(1)
  }

  if (result.status === 'failed') process.exit(1)
}

main().catch((err) => {
  console.error('[sync-peer-states] Fatal error:', err)
  process.exit(1)
})
