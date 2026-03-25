import { Database, PenLine, FlaskConical, AlertTriangle, Activity, Clock } from 'lucide-react'
import type { DashboardStatusData, SourceHealthEntry } from '@/services/dashboard-status'

interface DataStatusStripProps {
  data: DashboardStatusData
}

function formatSyncTime(iso: string | null): string {
  if (!iso) return 'Never'
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHrs = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHrs < 24) return `${diffHrs}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatFullSyncTime(iso: string | null): string {
  if (!iso) return 'No syncs recorded'
  const date = new Date(iso)
  return `Last sync: ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
}

const STATUS_DOT: Record<SourceHealthEntry['status'], { color: string; label: string }> = {
  healthy: { color: 'bg-emerald-500', label: 'Healthy' },
  warning: { color: 'bg-amber-500', label: 'Warning' },
  error: { color: 'bg-red-500', label: 'Error' },
  not_configured: { color: 'bg-slate-300', label: 'Not configured' },
}

export function DataStatusStrip({ data }: DataStatusStripProps) {
  const { contentCounts, sourceHealth, lastSuccessfulSync } = data
  const hasSampleDemo = contentCounts.sampleDemo > 0
  const hasExternal = contentCounts.external > 0

  return (
    <div className="space-y-2">
      {/* Warning Banner */}
      {hasSampleDemo && (
        <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            {!hasExternal ? (
              <>This dashboard contains only sample/demo and internal data. No external sources are configured.</>
            ) : (
              <>This dashboard includes <strong>{contentCounts.sampleDemo}</strong> sample/demo record{contentCounts.sampleDemo !== 1 ? 's' : ''}.</>
            )}
          </p>
        </div>
      )}

      {/* Status Strip */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
        {/* Content Summary Row */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <Activity size={13} className="text-slate-400" />
              <span className="text-slate-500 uppercase tracking-wider">Data Status</span>
            </div>
            <span className="text-slate-200">|</span>
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              <Database size={11} />
              {contentCounts.external} External
            </span>
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700">
              <PenLine size={11} />
              {contentCounts.internal} Internal
            </span>
            {contentCounts.sampleDemo > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <FlaskConical size={11} />
                {contentCounts.sampleDemo} Sample/Demo
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock size={11} />
            {formatFullSyncTime(lastSuccessfulSync)}
          </div>
        </div>

        {/* Source Health Row */}
        <div className="flex items-center gap-4 flex-wrap border-t border-slate-100 pt-3">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Sources</span>
          {sourceHealth.map((entry) => {
            const dot = STATUS_DOT[entry.status]
            return (
              <div
                key={entry.source}
                className="flex items-center gap-2 text-xs text-slate-600"
                title={`${entry.displayName}: ${dot.label}${entry.lastSyncAt ? ` — Last sync ${formatSyncTime(entry.lastSyncAt)}` : ''}`}
              >
                <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${dot.color}`} />
                <span className="font-medium">{entry.displayName}</span>
                <span className="text-slate-400">
                  {entry.recordCount > 0 ? `${entry.recordCount} records` : 'No records'}
                </span>
                {entry.isRunning && (
                  <span className="text-blue-600 font-medium">Syncing...</span>
                )}
                {!entry.isRunning && entry.lastSyncAt && (
                  <span className="text-slate-400">{formatSyncTime(entry.lastSyncAt)}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
