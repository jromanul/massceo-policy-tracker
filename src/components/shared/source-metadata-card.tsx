import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { ProvenanceBadge } from '@/components/shared/provenance-badge'
import { BUDGET_SOURCE_STAGES } from '@/lib/constants'
import { formatDate, formatCurrency } from '@/lib/utils'
import {
  getDataOrigin,
  getSourceSystemName,
  getImportAdapterName,
  getSourceNote,
  getMissingFields,
} from '@/lib/source-metadata'
import { ExternalLink, AlertTriangle, Info } from 'lucide-react'

interface SourceMetadataCardProps {
  dataSource: string
  sourceUrl?: string | null
  sourceExternalId?: string | null
  lastSyncedAt?: string | null
  sourceRetrievedAt?: string | null
  rawSourceStatus?: string | null
  normalizedStatus?: string | null
  jurisdiction?: string | null
  statusType?: 'legislative' | 'budget' | 'hearing' | 'policy'
  budgetStages?: Array<{
    id: number
    stage: string
    amount: string | number | null
    sourceUrl: string | null
    sourceRetrievedAt: string | null
    provenance?: string | null
  }>
}

function formatTimestamp(value: string | null | undefined): string {
  if (!value) return 'Not available'
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
      {children}
    </dt>
  )
}

function FieldValue({ children }: { children: React.ReactNode }) {
  return <dd className="text-sm text-slate-700">{children}</dd>
}


function OriginBadge({ origin }: { origin: string }) {
  const colors: Record<string, string> = {
    Imported: 'bg-blue-50 text-blue-700 border border-blue-200',
    Seeded: 'bg-amber-50 text-amber-700 border border-amber-200',
    Manual: 'bg-slate-100 text-slate-600',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[origin] ?? colors.Manual}`}>
      {origin}
    </span>
  )
}


export function SourceMetadataCard({
  dataSource,
  sourceUrl,
  sourceExternalId,
  lastSyncedAt,
  sourceRetrievedAt,
  rawSourceStatus,
  normalizedStatus,
  jurisdiction,
  statusType,
  budgetStages,
}: SourceMetadataCardProps) {
  const origin = getDataOrigin(dataSource)
  const systemName = getSourceSystemName(dataSource)
  const adapterName = getImportAdapterName(dataSource)
  const sourceNote = getSourceNote(dataSource, jurisdiction)
  const missingFields = getMissingFields({
    dataSource,
    sourceUrl,
    sourceExternalId,
    lastSyncedAt,
    sourceRetrievedAt,
    rawSourceStatus,
  })
  const isManualOrSeed = dataSource === 'MANUAL' || dataSource === 'SEED'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Source Metadata</CardTitle>
          <ProvenanceBadge dataSource={dataSource} sourceUrl={sourceUrl} compact />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warning banner for incomplete metadata (skip for MANUAL/SEED — those fields are inherently absent) */}
        {!isManualOrSeed && missingFields.length > 0 && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-300 rounded-lg">
            <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-amber-800">Source metadata incomplete</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Missing: {missingFields.join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Source note */}
        {sourceNote && (
          <div className="flex items-start gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
            <Info size={13} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800">{sourceNote}</p>
          </div>
        )}

        {/* Metadata grid */}
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          <div>
            <FieldLabel>Source System</FieldLabel>
            <FieldValue>{systemName}</FieldValue>
          </div>

          {sourceUrl && (
            <div>
              <FieldLabel>Source URL</FieldLabel>
              <dd>
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  <ExternalLink size={12} />
                  View source
                </a>
              </dd>
            </div>
          )}

          {sourceExternalId && (
            <div>
              <FieldLabel>Source Record ID</FieldLabel>
              <FieldValue>
                <code className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded">{sourceExternalId}</code>
              </FieldValue>
            </div>
          )}

          <div>
            <FieldLabel>Data Origin</FieldLabel>
            <dd><OriginBadge origin={origin} /></dd>
          </div>


          {!isManualOrSeed && lastSyncedAt && (
            <div>
              <FieldLabel>Last Successful Sync</FieldLabel>
              <FieldValue>{formatTimestamp(lastSyncedAt)}</FieldValue>
            </div>
          )}

          {!isManualOrSeed && sourceRetrievedAt && (
            <div>
              <FieldLabel>Source Retrieved At</FieldLabel>
              <FieldValue>{formatTimestamp(sourceRetrievedAt)}</FieldValue>
            </div>
          )}

          {rawSourceStatus && (
            <div>
              <FieldLabel>Raw Source Status</FieldLabel>
              <FieldValue>
                <code className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded">{rawSourceStatus}</code>
              </FieldValue>
            </div>
          )}

          {normalizedStatus && (
            <div>
              <FieldLabel>Normalized Display Status</FieldLabel>
              {statusType ? (
                <dd><StatusBadge status={normalizedStatus} type={statusType} /></dd>
              ) : (
                <FieldValue>{normalizedStatus}</FieldValue>
              )}
            </div>
          )}

          {adapterName && (
            <div>
              <FieldLabel>Import Adapter Name</FieldLabel>
              <FieldValue>{adapterName}</FieldValue>
            </div>
          )}

          {jurisdiction && (
            <div>
              <FieldLabel>Jurisdiction</FieldLabel>
              <FieldValue>{jurisdiction === 'MASSACHUSETTS' ? 'Massachusetts' : jurisdiction === 'FEDERAL' ? 'Federal' : jurisdiction}</FieldValue>
            </div>
          )}
        </dl>

        {/* Per-stage source data (budget only) */}
        {budgetStages && budgetStages.length > 0 && (
          <div className="pt-2">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Per-Stage Source Data
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-2 pr-4">Stage</th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider py-2 pr-4">Amount</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-2 pr-4">Source URL</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-2">Retrieved At</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetStages.map((stage) => {
                    const stageLabel = BUDGET_SOURCE_STAGES.find((s) => s.value === stage.stage)?.label ?? stage.stage
                    return (
                      <tr key={stage.id} className="border-b border-slate-100">
                        <td className="py-2 pr-4 text-slate-700">{stageLabel}</td>
                        <td className="py-2 pr-4 text-right font-mono text-slate-700">
                          {formatCurrency(stage.amount)}
                          {stage.provenance === 'inferred' && (
                            <span className="ml-1 text-xs text-slate-400 italic font-sans">(est.)</span>
                          )}
                        </td>
                        <td className="py-2 pr-4">
                          {stage.sourceUrl ? (
                            <a
                              href={stage.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline inline-flex items-center gap-1"
                            >
                              <ExternalLink size={11} />
                              View source
                            </a>
                          ) : null}
                        </td>
                        <td className="py-2 text-slate-500">
                          {stage.sourceRetrievedAt ? formatTimestamp(stage.sourceRetrievedAt) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
