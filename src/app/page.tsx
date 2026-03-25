export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getDashboardData as fetchDashboard } from '@/services/dashboard'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  ScrollText,
  CalendarDays,
  DollarSign,
  Lightbulb,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react'
import { resolveCommitteeName } from '@/lib/constants'
import { formatDate, formatCurrency, truncate } from '@/lib/utils'
import { SourceLabel } from '@/components/shared/source-label'
import { DataStatusStrip } from '@/components/shared/data-status-strip'
import { getDashboardStatusData } from '@/services/dashboard-status'

interface RecentItem {
  id: number
  type: 'legislation' | 'budget' | 'hearing' | 'policy'
  title: string
  updatedAt: string
  status?: string
  dataSource?: string
}

interface DashboardData {
  stats: {
    totalLegislation: number
    upcomingHearings: number
    activeBudgetItems: number
    policyIdeas: number
  }
  highPriorityLegislation: Array<{
    id: number
    billNumber: string | null
    title: string
    status: string
    jurisdiction: string
    dataSource?: string
  }>
  highPriorityFederal: Array<{
    id: number
    billNumber: string | null
    title: string
    status: string
    dataSource?: string
  }>
  upcomingHearings: Array<{
    id: number
    title: string
    startDatetime: string
    committee: string | null
    status: string
    dataSource?: string
  }>
  budgetSnapshot: {
    totalProposed: number | null
    byStatus: Record<string, number>
    allSeed?: boolean
    nextFY?: number
    nextFYProposed?: number | null
    nextFYStage?: string | null
    items?: Array<{
      fiscalYear: number
      name: string
      amountProposed: number
      amountAdopted: number | null
      status: string
      sourceStage: string
      significanceToMassCEO: string | null
    }>
  }
  sourceBreakdown?: {
    legislation: Record<string, number>
    hearings: Record<string, number>
  }
  recentlyUpdatedExternal: RecentItem[]
  recentlyUpdatedInternal: RecentItem[]
  boardAttention: Array<{
    id: number
    type: string
    title: string
    reason: string
    href: string
    dataSource?: string
  }>
  recentPolicyIdeas: Array<{
    id: number
    title: string
    disposition: string
    issueArea: string | null
    createdAt: string
    dataSource?: string
  }>
}

async function getDashboardData(): Promise<DashboardData | null> {
  try {
    return await fetchDashboard() as unknown as DashboardData
  } catch (e) {
    console.error('[Dashboard] Failed to load data:', e)
    return null
  }
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  href,
  color = 'slate',
}: {
  title: string
  value: number
  subtitle?: string
  icon: React.ElementType
  href: string
  color?: string
}) {
  const colorMap: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    violet: 'bg-violet-100 text-violet-600',
  }
  return (
    <Link href={href} className="block group">
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="py-5">
          <div className="flex items-center gap-4">
            <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${colorMap[color] ?? colorMap.slate}`}>
              <Icon size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{value.toLocaleString()}</p>
              <p className="text-sm text-slate-500">{title}</p>
              {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function SectionHeader({
  title,
  description,
  icon: Icon,
}: {
  title: string
  description: string
  icon: React.ElementType
}) {
  return (
    <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-500">
        <Icon size={16} />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </div>
  )
}

function RecentUpdatesList({ items, emptyText }: { items: RecentItem[]; emptyText: string }) {
  if (!items.length) {
    return <p className="text-sm text-slate-500 px-6 py-4">{emptyText}</p>
  }
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
          <Clock size={14} className="text-slate-400 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <Link href={typeHref(item.type, item.id)} className="text-sm font-medium text-slate-800 hover:underline truncate block">
              {truncate(item.title, 60)}
            </Link>
            <p className="text-xs text-slate-400">{formatDate(item.updatedAt)}</p>
          </div>
          {item.dataSource && <SourceLabel dataSource={item.dataSource} />}
          <span className="text-xs text-slate-400 capitalize flex-shrink-0">{item.type}</span>
        </li>
      ))}
    </ul>
  )
}

const typeHref = (type: string, id: number) => {
  if (type === 'legislation') return `/legislation/${id}`
  if (type === 'budget') return `/budget/${id}`
  if (type === 'hearing') return `/hearings/${id}`
  if (type === 'policy') return `/policy-ideas/${id}`
  return '#'
}

export default async function DashboardPage() {
  const [data, statusData] = await Promise.all([
    getDashboardData(),
    getDashboardStatusData().catch((e) => {
      console.error('[Dashboard] Failed to load status data:', e)
      return null
    }),
  ])

  const stats = data?.stats ?? {
    totalLegislation: 0,
    upcomingHearings: 0,
    activeBudgetItems: 0,
    policyIdeas: 0,
  }

  // Source annotation subtitles
  const legSources = data?.sourceBreakdown?.legislation ?? {}
  const legSubtitle = legSources.MA_LEGISLATURE
    ? `${legSources.MA_LEGISLATURE} from MA Legislature`
    : stats.totalLegislation > 0 ? 'sample data only' : undefined
  const budgetSubtitle = data?.budgetSnapshot?.allSeed ? 'seed data — pending authoritative source' : undefined

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Welcome to the MassCEO Policy Tracker. Here&apos;s your current legislative and policy overview.
        </p>
      </div>

      {/* Data Status & Source Health */}
      {statusData && (
        <div className="space-y-1">
          <DataStatusStrip data={statusData} />
          <div className="flex justify-end">
            <Link href="/admin/sync-status" className="text-xs text-slate-400 hover:text-slate-600">
              View full sync status
            </Link>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          Section A: External Policy & Legislative Monitoring
          ═══════════════════════════════════════════════════════════════ */}
      <div className="space-y-6">
        <SectionHeader
          title="External Policy & Legislative Monitoring"
          description="Bills, hearings, and budget items sourced from MA Legislature and Congress.gov."
          icon={ScrollText}
        />

        {/* External Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Bills Tracked"
            value={stats.totalLegislation}
            subtitle={legSubtitle}
            icon={ScrollText}
            href="/legislation"
            color="blue"
          />
          <StatCard
            title="Upcoming Hearings"
            value={stats.upcomingHearings}
            icon={CalendarDays}
            href="/hearings"
            color="green"
          />
          <StatCard
            title="Active Budget Items"
            value={stats.activeBudgetItems}
            subtitle={budgetSubtitle}
            icon={DollarSign}
            href="/budget"
            color="slate"
          />
        </div>

        {/* Two-column grid: Bills & Hearings/Budget */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            {/* MA Bills */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>MA Bills</CardTitle>
                  <Link href="/legislation?jurisdiction=MASSACHUSETTS" className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
                    View all <ArrowRight size={12} />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {!data?.highPriorityLegislation?.length ? (
                  <p className="text-sm text-slate-500 px-6 py-4">No EO-relevant Massachusetts bills found. MA Legislature sync may need to be run, or no bills matched current relevance criteria.</p>
                ) : (
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Bill #</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Title</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {data.highPriorityLegislation.map((bill) => (
                        <tr key={bill.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-2.5 text-sm">
                            <Link href={`/legislation/${bill.id}`} className="font-medium text-slate-800 hover:underline">
                              {bill.billNumber ?? '—'}
                            </Link>
                          </td>
                          <td className="px-4 py-2.5 text-sm text-slate-700 max-w-[180px]">
                            <Link href={`/legislation/${bill.id}`} className="hover:underline">
                              {truncate(bill.title, 45)}
                            </Link>
                          </td>
                          <td className="px-4 py-2.5 text-sm">
                            <StatusBadge status={bill.status} type="legislative" />
                          </td>
                          <td className="px-4 py-2.5 text-sm">
                            {bill.dataSource && <SourceLabel dataSource={bill.dataSource} />}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>

            {/* Federal Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Federal Items</CardTitle>
                  <Link href="/legislation?jurisdiction=FEDERAL" className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
                    View all <ArrowRight size={12} />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {!data?.highPriorityFederal?.length ? (
                  <p className="text-sm text-slate-500 px-6 py-4">No EO-relevant federal bills found. Run sync to import from Congress.gov.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {data.highPriorityFederal.map((bill) => (
                      <li key={bill.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                        <div className="min-w-0 flex-1">
                          <Link href={`/legislation/${bill.id}`} className="text-sm font-medium text-slate-800 hover:underline block truncate">
                            {bill.billNumber ? `${bill.billNumber} — ` : ''}{truncate(bill.title, 55)}
                          </Link>
                        </div>
                        {bill.dataSource && <SourceLabel dataSource={bill.dataSource} />}
                        <StatusBadge status={bill.status} type="legislative" />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Upcoming Hearings */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Upcoming Hearings</CardTitle>
                  <Link href="/hearings" className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
                    View all <ArrowRight size={12} />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {!data?.upcomingHearings?.length ? (
                  <p className="text-sm text-slate-500 px-6 py-4">No upcoming hearings. Run sync to import from the MA Legislature events calendar.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {data.upcomingHearings.slice(0, 5).map((hearing) => (
                      <li key={hearing.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="flex flex-col items-center justify-center w-10 h-10 rounded-md bg-blue-50 text-blue-700 text-center">
                            <span className="text-xs font-bold leading-none">
                              {new Date(hearing.startDatetime).toLocaleDateString('en-US', { month: 'short' })}
                            </span>
                            <span className="text-base font-bold leading-none">
                              {new Date(hearing.startDatetime).getDate()}
                            </span>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link href={`/hearings/${hearing.id}`} className="text-sm font-medium text-slate-800 hover:underline block truncate">
                            {truncate(hearing.title, 50)}
                          </Link>
                          {hearing.committee && (
                            <p className="text-xs text-slate-500 truncate">{resolveCommitteeName(hearing.committee)}</p>
                          )}
                        </div>
                        {hearing.dataSource && <SourceLabel dataSource={hearing.dataSource} />}
                        <StatusBadge status={hearing.status} type="hearing" />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* FY27 Budget Snapshot */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Budget Snapshot</CardTitle>
                  <Link href="/budget" className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
                    View all <ArrowRight size={12} />
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {data?.budgetSnapshot?.items && data.budgetSnapshot.items.length > 0 ? (
                  <div className="space-y-4">
                    {data.budgetSnapshot.items
                      .sort((a, b) => b.fiscalYear - a.fiscalYear)
                      .map((item) => {
                        const isCurrent = item.status === 'ADOPTED'
                        const isZero = item.amountProposed === 0 && !item.amountAdopted
                        return (
                          <div key={item.fiscalYear} className={`p-3 rounded-lg border ${isZero ? 'bg-red-50 border-red-200' : isCurrent ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-slate-600">FY{item.fiscalYear} — Line 7002-1075</span>
                              <StatusBadge status={item.status} type="budget" />
                            </div>
                            <div className="flex items-baseline gap-2">
                              <p className={`text-xl font-bold ${isZero ? 'text-red-700' : 'text-slate-900'}`}>
                                {formatCurrency(item.amountAdopted ?? item.amountProposed)}
                              </p>
                              {item.amountAdopted != null && (
                                <span className="text-xs text-slate-500">adopted</span>
                              )}
                              {item.amountAdopted == null && item.sourceStage && (
                                <span className="text-xs text-slate-500">{item.sourceStage.toLowerCase()} proposal</span>
                              )}
                            </div>
                            {isZero && (
                              <p className="text-xs text-red-600 mt-1">
                                Governor&apos;s budget proposes $0. Amendment filing opens after HWM release (est. mid-April).
                              </p>
                            )}
                          </div>
                        )
                      })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No budget data available.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Upcoming Hearings & Budget Milestones Timeline */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Upcoming Hearings & Budget Milestones</CardTitle>
              <Link href="/hearings" className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {!data?.upcomingHearings?.length ? (
              <p className="text-sm text-slate-500 px-6 py-4">No upcoming hearings or milestones scheduled.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.upcomingHearings.map((hearing) => {
                  const d = new Date(hearing.startDatetime)
                  return (
                    <div key={hearing.id} className="flex items-start gap-4 px-4 py-3 hover:bg-slate-50 transition-colors">
                      <div className="flex-shrink-0">
                        <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-blue-50 text-blue-700 text-center">
                          <span className="text-[10px] font-semibold uppercase leading-none">
                            {d.toLocaleDateString('en-US', { month: 'short' })}
                          </span>
                          <span className="text-lg font-bold leading-none mt-0.5">
                            {d.getDate()}
                          </span>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link href={`/hearings/${hearing.id}`} className="text-sm font-medium text-slate-800 hover:underline block">
                          {hearing.title}
                        </Link>
                        {hearing.committee && (
                          <p className="text-xs text-slate-500 mt-0.5">{resolveCommitteeName(hearing.committee)}</p>
                        )}
                      </div>
                      <StatusBadge status={hearing.status} type="hearing" />
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          Section B: Internal Governance & EOAB Workflow
          ═══════════════════════════════════════════════════════════════ */}
      <div className="space-y-6">
        <SectionHeader
          title="Internal Governance & EOAB Workflow"
          description="Policy ideas, board attention items, and internal records managed by EOAB staff."
          icon={Lightbulb}
        />

        {/* Internal Stats */}
        <div className="max-w-xs">
          <StatCard
            title="Policy Ideas"
            value={stats.policyIdeas}
            icon={Lightbulb}
            href="/policy-ideas"
            color="violet"
          />
        </div>

        {/* Two-column grid: Policy Ideas & Board Attention */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent EOAB Policy Ideas */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent EOAB Policy Ideas</CardTitle>
                <Link href="/policy-ideas" className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
                  View all <ArrowRight size={12} />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {!data?.recentPolicyIdeas?.length ? (
                <p className="text-sm text-slate-500 px-6 py-4">No recent policy ideas.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.recentPolicyIdeas.map((idea) => (
                    <li key={idea.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                      <div className="min-w-0 flex-1">
                        <Link href={`/policy-ideas/${idea.id}`} className="text-sm font-medium text-slate-800 hover:underline block truncate">
                          {truncate(idea.title, 50)}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          {idea.issueArea && <span className="text-xs text-slate-500">{idea.issueArea}</span>}
                          <StatusBadge status={idea.disposition} type="policy" />
                        </div>
                      </div>
                      {idea.dataSource && <SourceLabel dataSource={idea.dataSource} />}
                      <span className="text-xs text-slate-400 flex-shrink-0">{formatDate(idea.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Board Attention */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-orange-500" />
                <CardTitle>Items Needing Board Attention</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {!data?.boardAttention?.length ? (
                <p className="text-sm text-slate-500 px-6 py-4">No items require immediate board attention.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.boardAttention.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                      <div className="min-w-0 flex-1">
                        <Link href={item.href} className="text-sm font-medium text-slate-800 hover:underline block truncate">
                          {truncate(item.title, 55)}
                        </Link>
                        <p className="text-xs text-orange-600 mt-0.5">{item.reason}</p>
                      </div>
                      {item.dataSource && <SourceLabel dataSource={item.dataSource} />}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recently Updated Internal Records */}
        <Card>
          <CardHeader>
            <CardTitle>Recently Updated Internal Records</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <RecentUpdatesList
              items={data?.recentlyUpdatedInternal ?? []}
              emptyText="No recent internal updates."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
