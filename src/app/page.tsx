export const dynamic = 'force-dynamic'

import React from 'react'
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
import { formatDate, formatCurrency, truncate, getActiveBudgetFiscalYear } from '@/lib/utils'
import { SourceLabel } from '@/components/shared/source-label'

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
    statusDate: string | null
  }>
  highPriorityFederal: Array<{
    id: number
    billNumber: string | null
    title: string
    status: string
    dataSource?: string
    statusDate: string | null
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
      notes: string | null
    }>
    activeAmendments?: Array<{
      id: number
      amendmentNumber: string | null
      title: string
      filedBy: string | null
      chamber: string | null
      status: string
      amount: number | null
      sourceUrl: string | null
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
  budgetProcessSummary?: {
    fiscalYear: number
    currentStageLabel: string | null
    completedCount: number
    totalCount: number
    nextStageLabel: string | null
    nextStageDate: string | null
    nextStageDateIsEstimate: boolean
    stages: Array<{ stageKey: string; stageLabel: string; stageStatus: string }>
  } | null
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
    blue: 'bg-blue-100 text-[var(--ma-navy)]',
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


function BudgetProcessCompact({ summary }: { summary: NonNullable<DashboardData['budgetProcessSummary']> }) {
  const progress = summary.totalCount > 0 ? (summary.completedCount / summary.totalCount) * 100 : 0

  function fmtDate(iso: string | null, est: boolean): string {
    if (!iso) return ''
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    const s = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    })
    return est ? `Est. ${s}` : s
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600">FY{summary.fiscalYear} Budget Process</span>
        <span className="text-xs text-slate-400">{summary.completedCount} of {summary.totalCount} stages</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.max(progress, 3)}%` }} />
      </div>
      {summary.currentStageLabel && (
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-blue-500" />
          <span className="text-xs font-medium text-slate-700">{summary.currentStageLabel}</span>
          <StatusBadge status="CURRENT" type="budgetProcess" />
        </div>
      )}
      {summary.nextStageLabel && (
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-slate-300" />
          <span className="text-xs text-slate-500">Next: {summary.nextStageLabel}</span>
          {summary.nextStageDate && (
            <span className="text-xs text-slate-400 italic">{fmtDate(summary.nextStageDate, summary.nextStageDateIsEstimate)}</span>
          )}
        </div>
      )}
      <Link href="/budget" className="text-xs text-[var(--ma-navy)] hover:underline inline-flex items-center gap-1">
        View full timeline →
      </Link>
    </div>
  )
}

function RecentUpdatesList({ items, emptyText }: { items: RecentItem[]; emptyText: string }) {
  if (!items.length) {
    return <p className="text-sm text-slate-500 px-6 py-4">{emptyText}</p>
  }
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((item) => (
        <li
          key={`${item.type}-${item.id}`}
          className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
        >
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
  const data = await getDashboardData()

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
    <div className="space-y-8">
      {/* Commonwealth-style page header */}
      <div className="pb-6 border-b border-[var(--border)]">
        <p
          className="mb-2 font-mono text-[11px] uppercase"
          style={{
            color: 'var(--ma-navy)',
            letterSpacing: '0.12em',
            fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace",
          }}
        >
          MassCEO · Employee Ownership Advisory Board
        </p>
        <h1
          className="text-[28px] font-semibold tracking-tight leading-tight"
          style={{ color: 'var(--ma-navy-ink)' }}
        >
          MassCEO Policy Tracker Overview
        </h1>
        <p
          className="mt-2 text-[14px] leading-relaxed max-w-3xl"
          style={{ color: 'var(--foreground-muted)' }}
        >
          A live snapshot of Massachusetts and federal employee-ownership
          legislation, the FY{getActiveBudgetFiscalYear()} state budget process,
          upcoming legislative hearings, and pending or recently enacted
          employee-ownership bills in other states.
        </p>
      </div>

      <div className="space-y-6">
        {/* Two-column grid: Bills & Hearings/Budget */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column — Combined Legislation (MA + Federal) */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Legislation</CardTitle>
                  <Link href="/legislation" className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
                    View all <ArrowRight size={12} />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {(() => {
                  // Chronological sort: most recent action date first (null dates last)
                  const chronoSort = <T extends { statusDate: string | null }>(a: T, b: T) => {
                    if (!a.statusDate && !b.statusDate) return 0
                    if (!a.statusDate) return 1
                    if (!b.statusDate) return -1
                    return new Date(b.statusDate).getTime() - new Date(a.statusDate).getTime()
                  }
                  const maBills = [...(data?.highPriorityLegislation ?? [])]
                    .sort(chronoSort)
                    .map((b) => ({ ...b, jurisdiction: 'MASSACHUSETTS' as const }))
                  const federalBills = [...(data?.highPriorityFederal ?? [])]
                    .sort(chronoSort)
                    .map((b) => ({ ...b, jurisdiction: 'FEDERAL' as const }))
                  const combined = [...maBills, ...federalBills]

                  if (combined.length === 0) {
                    return (
                      <p className="text-sm text-slate-500 px-6 py-4">
                        No employee-ownership bills found. Daily sync runs at 2 AM ET; check back after the next refresh.
                      </p>
                    )
                  }

                  return (
                    <div className="divide-y divide-slate-100">
                      {maBills.length > 0 && (
                        <div>
                          <div className="px-4 py-2 bg-slate-50 text-xs font-semibold uppercase text-slate-500 tracking-wide">
                            Massachusetts
                          </div>
                          <ul className="divide-y divide-slate-100">
                            {maBills.map((bill) => (
                              <li
                                key={bill.id}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                              >
                                <Link
                                  href={`/legislation/${bill.id}`}
                                  className="font-mono text-xs font-semibold text-slate-700 hover:underline shrink-0 w-14"
                                >
                                  {bill.billNumber ?? '—'}
                                </Link>
                                <Link
                                  href={`/legislation/${bill.id}`}
                                  className="text-sm text-slate-800 hover:underline flex-1 min-w-0 truncate"
                                >
                                  {truncate(bill.title, 55)}
                                </Link>
                                {bill.dataSource && <SourceLabel dataSource={bill.dataSource} />}
                                <StatusBadge status={bill.status} type="legislative" />
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {federalBills.length > 0 && (
                        <div>
                          <div className="px-4 py-2 bg-slate-50 text-xs font-semibold uppercase text-slate-500 tracking-wide">
                            Federal
                          </div>
                          <ul className="divide-y divide-slate-100">
                            {federalBills.map((bill) => (
                              <li
                                key={bill.id}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                              >
                                <Link
                                  href={`/legislation/${bill.id}`}
                                  className="font-mono text-xs font-semibold text-slate-700 hover:underline shrink-0 w-14"
                                >
                                  {bill.billNumber ?? '—'}
                                </Link>
                                <Link
                                  href={`/legislation/${bill.id}`}
                                  className="text-sm text-slate-800 hover:underline flex-1 min-w-0 truncate"
                                >
                                  {truncate(bill.title, 55)}
                                </Link>
                                {bill.dataSource && <SourceLabel dataSource={bill.dataSource} />}
                                <StatusBadge status={bill.status} type="legislative" />
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )
                })()}
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
                  <p className="text-sm text-slate-500 px-6 py-4">No upcoming hearings. Daily sync runs at 2 AM ET; check back after the next refresh.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {[...data.upcomingHearings]
                      .sort(
                        (a, b) =>
                          new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime(),
                      )
                      .slice(0, 5)
                      .map((hearing) => (
                      <li key={hearing.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="flex flex-col items-center justify-center w-10 h-10 rounded-md bg-blue-50 text-[var(--ma-navy)] text-center">
                            <span className="text-xs font-bold leading-none">
                              {new Date(hearing.startDatetime).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}
                            </span>
                            <span className="text-base font-bold leading-none">
                              {new Date(hearing.startDatetime).toLocaleDateString('en-US', { day: 'numeric', timeZone: 'UTC' })}
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
                    {(() => {
                      // Chronological order: oldest fiscal year first, then by
                      // stage within each FY (Governor → House → Senate → Conf
                      // → Final). This places concluded years at the top and
                      // the active FY's process at the bottom.
                      const stageRank: Record<string, number> = {
                        GOVERNOR: 1,
                        HOUSE: 2,
                        SENATE: 3,
                        CONFERENCE: 4,
                        FINAL: 5,
                        SUPPLEMENTAL: 6,
                      }
                      const stageLabel: Record<string, string> = {
                        GOVERNOR: "Governor's Proposal",
                        HOUSE: 'House',
                        SENATE: 'Senate Ways & Means',
                        CONFERENCE: 'Conference Report',
                        FINAL: 'Final',
                        SUPPLEMENTAL: 'Supplemental',
                      }
                      const sortedItems = [...data.budgetSnapshot.items].sort((a, b) => {
                        if (a.fiscalYear !== b.fiscalYear) return a.fiscalYear - b.fiscalYear
                        return (
                          (stageRank[a.sourceStage] ?? 99) -
                          (stageRank[b.sourceStage] ?? 99)
                        )
                      })
                      const nextFY = data.budgetSnapshot.nextFY
                      // Filter out amendments already reflected in a chamber
                      // row's amount — once an amendment is ADOPTED, the House/
                      // Senate row carries its dollars and a "via amendment"
                      // qualifier. Listing the same amendment in a separate
                      // "Live Amendments" block on top of that is redundant
                      // (per Board feedback).
                      const amendments = (
                        data.budgetSnapshot.activeAmendments ?? []
                      ).filter((a) => a.status !== 'ADOPTED')

                      // Detect whether the next-FY has multiple stages tracked
                      // (Governor + House + Senate, etc.). If only one stage,
                      // the row label can stay "FYxx MassCEO Budget" without
                      // a stage qualifier.
                      const nextFYStageCount = sortedItems.filter(
                        (it) => it.fiscalYear === nextFY,
                      ).length
                      // Index of the LAST next-FY row, used to anchor the live
                      // amendments block at the bottom of the FY27 group.
                      let lastNextFYIdx = -1
                      sortedItems.forEach((it, i) => {
                        if (it.fiscalYear === nextFY) lastNextFYIdx = i
                      })

                      const rendered: React.ReactNode[] = []
                      sortedItems.forEach((item, idx) => {
                        const fyShort = `FY${String(item.fiscalYear).slice(-2)}`
                        // Show stage qualifier only when this FY has multiple
                        // stages tracked (e.g. FY27 mid-process). For single-
                        // stage years like FY26 FINAL, the plain "FYxx MassCEO
                        // Budget" reads cleanly per Board feedback.
                        const showStage =
                          item.fiscalYear === nextFY && nextFYStageCount > 1
                        const rowHeading = showStage
                          ? `${fyShort} MassCEO Budget — ${stageLabel[item.sourceStage] ?? item.sourceStage}`
                          : `${fyShort} MassCEO Budget`
                        // Chamber-stage labels ("House budget" / "Senate
                        // budget") frame the amount as a proposal — whether
                        // the dollars got there via the Ways & Means mark or
                        // a floor amendment, the engrossed chamber budget is
                        // still a proposal to the other chamber, not an
                        // enacted appropriation. Only the FINAL stage uses
                        // "adopted."
                        const isChamberStage =
                          item.sourceStage === 'HOUSE' || item.sourceStage === 'SENATE'
                        const amountQualifier = isChamberStage
                          ? item.sourceStage === 'HOUSE'
                            ? 'proposed in House budget'
                            : 'proposed in Senate budget'
                          : item.amountAdopted != null
                          ? 'adopted'
                          : item.sourceStage === 'GOVERNOR'
                          ? "governor's proposal"
                          : 'proposal'
                        rendered.push(
                          <div
                            key={`fy-${item.fiscalYear}-${item.sourceStage}`}
                            className="p-3 rounded-lg border bg-slate-50 border-slate-200"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-slate-600">
                                {rowHeading}
                              </span>
                              <StatusBadge status={item.status} type="budget" />
                            </div>
                            <div className="flex items-baseline gap-2">
                              <p className="text-xl font-bold text-slate-900">
                                {formatCurrency(item.amountAdopted ?? item.amountProposed)}
                              </p>
                              <span className="text-xs text-slate-500">{amountQualifier}</span>
                            </div>
                          </div>,
                        )

                        // Inject live amendments block ONCE, after the LAST
                        // next-FY row (so it lands at the bottom of the active
                        // FY's stage group rather than between stages). Skip
                        // the block entirely when no non-ADOPTED amendments
                        // remain after the de-dup filter above.
                        if (
                          idx === lastNextFYIdx &&
                          nextFY &&
                          amendments.length > 0
                        ) {
                          rendered.push(
                            <div
                              key="amendments"
                              className="p-3 rounded-lg border border-blue-200 bg-blue-50"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-[var(--ma-navy)] flex items-center gap-1.5">
                                  <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                                  </span>
                                  Live Amendments Filed — FY{nextFY}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  via malegislature.gov
                                </span>
                              </div>
                              <ul className="space-y-2">
                                {amendments.map((a) => (
                                  <li key={a.id} className="text-xs">
                                    <div className="flex items-start gap-2">
                                      <span className="font-mono font-semibold text-[var(--ma-navy)] shrink-0">
                                        #{a.amendmentNumber}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-slate-800 font-medium leading-snug">
                                          {a.title}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5 text-slate-600 flex-wrap">
                                          {a.chamber && (
                                            <span className="uppercase text-[10px] font-semibold text-slate-500">
                                              {a.chamber}
                                            </span>
                                          )}
                                          {a.filedBy && (
                                            <span>Sponsor: {a.filedBy}</span>
                                          )}
                                          {a.amount !== null && (
                                            <span className="font-semibold text-green-700">
                                              ${a.amount.toLocaleString()}
                                            </span>
                                          )}
                                          <StatusBadge status={a.status} type="amendment" />
                                          {a.sourceUrl && (
                                            <a
                                              href={a.sourceUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-[var(--ma-navy)] hover:underline"
                                            >
                                              View
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>,
                          )
                        }
                      })
                      return rendered
                    })()}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No budget data available.</p>
                )}

                {/* Compact Budget Process Timeline */}
                {data?.budgetProcessSummary && data.budgetProcessSummary.totalCount > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <BudgetProcessCompact summary={data.budgetProcessSummary} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  )
}
