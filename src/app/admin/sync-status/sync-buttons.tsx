'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface SyncTarget {
  label: string
  source: string
  entityType?: string
}

const SYNC_TARGETS: SyncTarget[] = [
  { label: 'Sync All', source: 'all' },
  { label: 'MA Legislature (Bills)', source: 'ma_legislature', entityType: 'legislation' },
  { label: 'MA Legislature (Hearings)', source: 'ma_legislature', entityType: 'hearings' },
  { label: 'Congress.gov', source: 'congress_gov', entityType: 'legislation' },
  { label: 'MA Budget', source: 'ma_budget', entityType: 'budget' },
]

export function SyncButtons() {
  const [running, setRunning] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<{ key: string; ok: boolean; message: string } | null>(null)

  async function handleSync(target: SyncTarget) {
    const key = `${target.source}-${target.entityType ?? 'all'}`
    setRunning(key)
    setLastResult(null)

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: target.source, entityType: target.entityType }),
      })
      const data = await res.json()

      if (data.ok) {
        const summary = data.results
          ? data.results.map((r: { source: string; recordsCreated: number; recordsUpdated: number }) =>
              `${r.source}: +${r.recordsCreated} created, ${r.recordsUpdated} updated`
            ).join('; ')
          : data.result
            ? `+${data.result.recordsCreated} created, ${data.result.recordsUpdated} updated`
            : 'Done'
        setLastResult({ key, ok: true, message: summary })
      } else {
        setLastResult({ key, ok: false, message: data.error ?? 'Unknown error' })
      }
    } catch (err) {
      setLastResult({ key, ok: false, message: err instanceof Error ? err.message : 'Network error' })
    } finally {
      setRunning(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {SYNC_TARGETS.map((target) => {
          const key = `${target.source}-${target.entityType ?? 'all'}`
          return (
            <Button
              key={key}
              size="sm"
              variant={target.source === 'all' ? 'default' : 'outline'}
              disabled={running !== null}
              onClick={() => handleSync(target)}
            >
              {running === key ? 'Syncing...' : target.label}
            </Button>
          )
        })}
      </div>
      {lastResult && (
        <p className={`text-sm ${lastResult.ok ? 'text-green-700' : 'text-red-600'}`}>
          {lastResult.ok ? 'Success' : 'Failed'}: {lastResult.message}
        </p>
      )}
    </div>
  )
}
