import { createClient } from '@libsql/client'

const openstatesKey = (process.env.OPENSTATES_API_KEY || '').trim()
const turso = createClient({
  url: (process.env.TURSO_DATABASE_URL || '').trim(),
  authToken: (process.env.TURSO_AUTH_TOKEN || '').trim(),
})

let lastReq = 0
async function throttledFetch(url) {
  const wait = 6200 - (Date.now() - lastReq)
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  lastReq = Date.now()
  return fetch(url, { headers: { Accept: 'application/json' } })
}

const bills = (await turso.execute(
  'SELECT id, state, billNumber, lastActionDate, lastActionText, sourceApiId FROM PeerStateBill WHERE archived = 0 ORDER BY lastActionDate DESC',
)).rows

console.log(`Verifying ${bills.length} bills against OpenStates...`)

let drifted = 0, updated = 0
const stale = []

for (const b of bills) {
  if (!b.sourceApiId) {
    console.log(`  [${b.state.toUpperCase()}] ${b.billNumber} — no sourceApiId`)
    continue
  }
  const url = `https://v3.openstates.org/bills/${b.sourceApiId}?apikey=${openstatesKey}`
  try {
    const resp = await throttledFetch(url)
    if (!resp.ok) {
      console.log(`  [${b.state.toUpperCase()}] ${b.billNumber} HTTP ${resp.status}`)
      continue
    }
    const live = await resp.json()
    const liveDate = live.latest_action_date
    const ourDate = b.lastActionDate ? new Date(b.lastActionDate).toISOString().slice(0,10) : null
    const liveDateOnly = liveDate ? liveDate.slice(0,10) : null
    const drift = liveDateOnly !== ourDate
    if (drift) {
      drifted++
      stale.push({state:b.state.toUpperCase(),billNumber:b.billNumber,ourDate,liveDate:liveDateOnly,liveText:live.latest_action_description})
      await turso.execute({
        sql: 'UPDATE PeerStateBill SET lastActionDate = ?, lastActionText = ?, lastSyncedAt = ?, sourceRetrievedAt = ? WHERE id = ?',
        args: [liveDate ? new Date(liveDate) : null, live.latest_action_description ?? null, new Date(), new Date(), b.id],
      })
      updated++
      console.log(`  [${b.state.toUpperCase()}] ${b.billNumber}: ${ourDate} -> ${liveDateOnly} DRIFT`)
    } else {
      console.log(`  [${b.state.toUpperCase()}] ${b.billNumber}: ${ourDate} OK`)
    }
  } catch (err) {
    console.log(`  [${b.state.toUpperCase()}] ${b.billNumber} ERROR ${err.message}`)
  }
}

console.log(`\n${drifted} drifted, ${updated} updated`)
if (stale.length) {
  console.log('\nDrifted bills:')
  for (const s of stale) {
    console.log(`  [${s.state}] ${s.billNumber}: ${s.ourDate} -> ${s.liveDate} (${(s.liveText||'').slice(0,60)})`)
  }
}
turso.close()
