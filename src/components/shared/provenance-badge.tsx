'use client'

import { ExternalLink, Database, Upload, FileText, PenLine } from 'lucide-react'

const DATA_SOURCE_CONFIG: Record<string, { label: string; color: string; icon: typeof Database }> = {
  MANUAL: { label: 'Manual Entry', color: 'bg-slate-100 text-slate-700', icon: PenLine },
  SEED: { label: 'Sample Data', color: 'bg-amber-50 text-amber-700 border border-amber-200', icon: Database },
  MA_LEGISLATURE: { label: 'MA Legislature', color: 'bg-blue-50 text-blue-700 border border-blue-200', icon: Database },
  CONGRESS_GOV: { label: 'Congress.gov', color: 'bg-indigo-50 text-indigo-700 border border-indigo-200', icon: Database },
  CSV_IMPORT: { label: 'CSV Import', color: 'bg-green-50 text-green-700 border border-green-200', icon: Upload },
  JSON_IMPORT: { label: 'JSON Import', color: 'bg-green-50 text-green-700 border border-green-200', icon: FileText },
}

interface ProvenanceBadgeProps {
  dataSource: string
  sourceUrl?: string | null
  lastSyncedAt?: string | null
  compact?: boolean
}

export function ProvenanceBadge({ dataSource, sourceUrl, lastSyncedAt, compact }: ProvenanceBadgeProps) {
  const config = DATA_SOURCE_CONFIG[dataSource] ?? DATA_SOURCE_CONFIG.MANUAL
  const Icon = config.icon

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.color}`}>
        <Icon size={11} />
        {config.label}
      </span>
    )
  }

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${config.color}`}>
      <Icon size={12} />
      <span>{config.label}</span>
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 opacity-60 hover:opacity-100"
          title="View source"
        >
          <ExternalLink size={11} />
        </a>
      )}
    </div>
  )
}

interface ProvenanceDetailProps {
  dataSource: string
  sourceUrl?: string | null
  sourceExternalId?: string | null
  lastSyncedAt?: string | null
  rawSourceStatus?: string | null
}

export function ProvenanceDetail({
  dataSource,
  sourceUrl,
  sourceExternalId,
  lastSyncedAt,
  rawSourceStatus,
}: ProvenanceDetailProps) {
  const config = DATA_SOURCE_CONFIG[dataSource] ?? DATA_SOURCE_CONFIG.MANUAL
  const isImported = dataSource !== 'MANUAL'

  if (!isImported) return null

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <ProvenanceBadge dataSource={dataSource} sourceUrl={sourceUrl} compact />
        <span className="text-xs text-slate-400">|</span>
        <span className="text-xs text-slate-500">
          {lastSyncedAt ? `Last synced: ${new Date(lastSyncedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}` : 'Not yet synced'}
        </span>
      </div>
      {rawSourceStatus && (
        <p className="text-xs text-slate-600">
          <span className="font-medium text-slate-500">Source status: </span>
          {rawSourceStatus}
        </p>
      )}
      {sourceUrl && (
        <p className="text-xs">
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline inline-flex items-center gap-1"
          >
            <ExternalLink size={11} />
            View on source website
          </a>
        </p>
      )}
      {sourceExternalId && (
        <p className="text-xs text-slate-400">
          Source ID: {sourceExternalId}
        </p>
      )}
    </div>
  )
}
