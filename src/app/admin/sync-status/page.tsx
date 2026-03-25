import { PageHeader } from '@/components/layout/page-header'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { getDashboardStatusData, type SourceHealthEntry } from '@/services/dashboard-status'
import { formatDate } from '@/lib/utils'
import { prisma } from '@/lib/db'
import { SyncButtons } from './sync-buttons'

const STATUS_DOT: Record<string, string> = {
  healthy: 'bg-green-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  not_configured: 'bg-slate-300',
}

const STATUS_LABEL: Record<string, string> = {
  healthy: 'Healthy',
  warning: 'Warning',
  error: 'Error',
  not_configured: 'Not Configured',
}

async function getRecentSyncLogs() {
  return prisma.syncLog.findMany({
    take: 20,
    orderBy: { startedAt: 'desc' },
  })
}

export default async function SyncStatusPage() {
  const [statusData, syncLogs] = await Promise.all([
    getDashboardStatusData(),
    getRecentSyncLogs(),
  ])

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Sync Status' },
        ]}
      />

      <PageHeader
        title="Sync Status & Diagnostics"
        description="View data source health, record counts, and recent sync activity."
      />

      {/* Sync Trigger */}
      <Card>
        <CardHeader>
          <CardTitle>Trigger Sync</CardTitle>
        </CardHeader>
        <CardContent>
          <SyncButtons />
        </CardContent>
      </Card>

      {/* Content Counts Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <SummaryCard label="External" value={statusData.contentCounts.external} color="green" />
        <SummaryCard label="Internal" value={statusData.contentCounts.internal} color="blue" />
        <SummaryCard label="Sample/Demo" value={statusData.contentCounts.sampleDemo} color="amber" />
        <SummaryCard label="Total Records" value={statusData.contentCounts.total} color="slate" />
      </div>

      {/* Source Health */}
      <Card>
        <CardHeader>
          <CardTitle>Source Health</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Source</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Records</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Last Sync</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Last Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {statusData.sourceHealth.map((source: SourceHealthEntry) => (
                <tr key={source.source} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">{source.displayName}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${STATUS_DOT[source.status]}`} />
                      <span className="text-slate-600">{STATUS_LABEL[source.status]}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-mono text-slate-700">{source.recordCount}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {source.lastSyncAt ? formatDate(source.lastSyncAt) : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 capitalize">
                    {source.lastSyncStatus ?? '—'}
                    {source.isRunning && (
                      <span className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">
                        Running
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Recent Sync Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sync Logs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {syncLogs.length === 0 ? (
            <p className="text-sm text-slate-500 px-4 py-6">No sync logs yet. Run a sync to see activity here.</p>
          ) : (
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Source</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Trigger</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Processed</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Created</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Updated</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Errors</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Started</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {syncLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-sm text-slate-800">{log.source}</td>
                    <td className="px-4 py-2.5 text-sm">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        log.status === 'success' ? 'bg-green-100 text-green-700' :
                        log.status === 'failed' ? 'bg-red-100 text-red-700' :
                        log.status === 'running' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-slate-600">{log.triggerType ?? '—'}</td>
                    <td className="px-4 py-2.5 text-sm text-right font-mono text-slate-700">{log.recordsProcessed ?? 0}</td>
                    <td className="px-4 py-2.5 text-sm text-right font-mono text-slate-700">{log.recordsCreated ?? 0}</td>
                    <td className="px-4 py-2.5 text-sm text-right font-mono text-slate-700">{log.recordsUpdated ?? 0}</td>
                    <td className="px-4 py-2.5 text-sm text-right font-mono text-slate-700">{log.errors ? '1' : '0'}</td>
                    <td className="px-4 py-2.5 text-sm text-slate-600 whitespace-nowrap">
                      {formatDate(log.startedAt.toISOString())}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {statusData.lastSuccessfulSync && (
        <p className="text-xs text-slate-400">
          Last successful sync across all sources: {formatDate(statusData.lastSuccessfulSync)}
        </p>
      )}
    </div>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  const bg: Record<string, string> = {
    green: 'bg-green-50 text-green-700',
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    slate: 'bg-slate-50 text-slate-700',
  }
  return (
    <div className={`rounded-lg p-4 ${bg[color] ?? bg.slate}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs opacity-80">{label}</p>
    </div>
  )
}
