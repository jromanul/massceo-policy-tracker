'use client'

import Link from 'next/link'
import { StatusBadge } from '@/components/ui/status-badge'
import { ExternalLink, DollarSign, CalendarDays, Check, Circle, Info, FileEdit } from 'lucide-react'

export interface AmendmentData {
  id: number
  amendmentNumber: string | null
  title: string
  filedBy: string | null
  chamber: string | null
  stage: string | null
  status: string
  amount: number | null
  sourceUrl: string | null
  eoRelevanceNotes: string | null
}

export interface BudgetProcessStageData {
  id: number
  stageKey: string
  stageOrder: number
  stageLabel: string
  stageDescription: string | null
  stageStatus: string
  stageDate: string | null
  stageDateIsEstimate: boolean
  sourceUrl: string | null
  isAuthoritative: boolean
  massceoNote: string | null
  isCurrent: boolean
  relatedBudgetItem: {
    id: number
    name: string
    lineItemNumber: string | null
    amountProposed: number | null
    amountAdopted: number | null
    status: string
  } | null
  relatedHearing: {
    id: number
    title: string
    date: string
    status: string
  } | null
  amendments?: AmendmentData[]
}

interface BudgetProcessTimelineProps {
  fiscalYear: number
  stages: BudgetProcessStageData[]
  compact?: boolean
  className?: string
}

function formatStageDate(iso: string | null, isEstimate: boolean): string {
  if (!iso) return 'Date TBD'
  const d = new Date(iso)
  // Guard against malformed dates (mixed integer-vs-text storage in legacy
  // BudgetProcessStage rows can occasionally surface a string the libsql
  // adapter fails to coerce). Render "—" rather than the literal "Invalid
  // Date" label that JS would otherwise produce.
  if (isNaN(d.getTime())) return '—'
  // UTC, not Eastern: stage dates are date-only values stored as midnight UTC
  // (e.g. "2026-01-22T00:00:00Z" = "Jan 22"). Formatting in America/New_York
  // shifts midnight UTC back to the previous evening and renders "Jan 21".
  const formatted = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
  return isEstimate ? `Est. ${formatted}` : formatted
}

function StageIcon({ status }: { status: string }) {
  if (status === 'COMPLETED') {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500 ring-4 ring-white">
        <Check size={14} className="text-white" strokeWidth={3} />
      </span>
    )
  }
  if (status === 'CURRENT') {
    return (
      <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 ring-4 ring-white">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-50" />
        <Circle size={10} className="text-white" fill="white" />
      </span>
    )
  }
  if (status === 'NOT_YET_AVAILABLE') {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-white ring-4 ring-white">
        <Circle size={8} className="text-slate-300" />
      </span>
    )
  }
  // UPCOMING
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-slate-300 bg-white ring-4 ring-white">
      <Circle size={8} className="text-slate-300" />
    </span>
  )
}

function FullTimeline({ stages, fiscalYear }: { stages: BudgetProcessStageData[]; fiscalYear: number }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-slate-400 mb-4">
        {stages.filter((s) => s.stageStatus === 'COMPLETED').length} of {stages.length} stages complete
      </p>
      <ol className="relative border-l-2 border-slate-200 ml-3 space-y-6">
        {stages.map((stage) => (
          <li key={stage.id} className="ml-6">
            <span className="absolute -left-[15px]">
              <StageIcon status={stage.stageStatus} />
            </span>

            <div className="flex flex-col gap-1">
              {/* Header row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-sm font-semibold ${
                      stage.stageStatus === 'COMPLETED'
                        ? 'text-green-700'
                        : stage.isCurrent
                        ? 'text-[var(--ma-navy)]'
                        : stage.stageStatus === 'NOT_YET_AVAILABLE'
                        ? 'text-slate-400 italic'
                        : 'text-slate-700'
                    }`}
                  >
                    {stage.stageLabel}
                  </span>
                  <StatusBadge status={stage.stageStatus} type="budgetProcess" />
                </div>
                <span
                  className={`text-xs shrink-0 ${
                    stage.stageDateIsEstimate ? 'text-slate-400 italic' : 'text-slate-500'
                  }`}
                >
                  {formatStageDate(stage.stageDate, stage.stageDateIsEstimate)}
                </span>
              </div>

              {/* Description */}
              {stage.stageDescription && (
                <p className="text-xs text-slate-500 leading-relaxed">
                  {stage.stageDescription}
                </p>
              )}

              {/* MassCEO Note — informational context on what this stage means
                  for MassCEO funding. Uses an info icon and slate-tinted card so
                  it reads as an explanatory note rather than a warning. */}
              {stage.massceoNote && (
                <div className="flex items-start gap-2 mt-1 p-2 bg-slate-50 border border-slate-200 rounded-md">
                  <Info size={12} className="text-[var(--ma-navy)] mt-0.5 shrink-0" />
                  <p className="text-xs text-slate-700">{stage.massceoNote}</p>
                </div>
              )}

              {/* Links row */}
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {stage.sourceUrl && (
                  <a
                    href={stage.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[var(--ma-navy)] hover:underline"
                  >
                    <ExternalLink size={11} />
                    Official source
                  </a>
                )}
                {stage.relatedBudgetItem && (
                  <Link
                    href={`/budget/${stage.relatedBudgetItem.id}`}
                    className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-800 hover:underline"
                  >
                    <DollarSign size={11} />
                    {stage.relatedBudgetItem.lineItemNumber ?? 'Budget item'}
                  </Link>
                )}
                {stage.relatedHearing && (
                  <Link
                    href={`/hearings/${stage.relatedHearing.id}`}
                    className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-800 hover:underline"
                  >
                    <CalendarDays size={11} />
                    Related hearing
                  </Link>
                )}
              </div>

              {/* Employee-ownership amendments for House/Senate debate stages */}
              {stage.amendments && stage.amendments.length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <FileEdit size={13} className="text-[var(--ma-navy)]" />
                    <span className="text-xs font-semibold text-[var(--ma-navy)]">
                      Employee-ownership amendments filed ({stage.amendments.length})
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {stage.amendments.map((a) => (
                      <li key={a.id} className="text-xs">
                        <div className="flex items-start gap-2">
                          <span className="font-mono font-semibold text-[var(--ma-navy)] shrink-0">
                            #{a.amendmentNumber}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-slate-800 font-medium leading-snug">{a.title}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-slate-500">
                              {a.filedBy && <span>Sponsor: {a.filedBy}</span>}
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
                                  className="inline-flex items-center gap-0.5 text-[var(--ma-navy)] hover:underline"
                                >
                                  <ExternalLink size={10} />
                                  View
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Show empty-state note for debate stages with no amendments */}
              {stage.amendments &&
                stage.amendments.length === 0 &&
                (stage.stageKey === 'HOUSE_DEBATE' || stage.stageKey === 'SENATE_DEBATE') && (
                  <p className="text-xs text-slate-400 italic mt-2">
                    No employee-ownership amendments filed yet for this stage. Data refreshes daily at 2 AM ET from malegislature.gov.
                  </p>
                )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

function CompactTimeline({
  stages,
  fiscalYear,
}: {
  stages: BudgetProcessStageData[]
  fiscalYear: number
}) {
  const completedCount = stages.filter((s) => s.stageStatus === 'COMPLETED').length
  const currentStage = stages.find((s) => s.isCurrent)
  const nextStage = stages.find(
    (s) => s.stageStatus === 'UPCOMING' || s.stageStatus === 'NOT_YET_AVAILABLE'
  )
  const progress = stages.length > 0 ? (completedCount / stages.length) * 100 : 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600">
          FY{fiscalYear} Budget Process
        </span>
        <span className="text-xs text-slate-400">
          {completedCount} of {stages.length} stages
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all"
          style={{ width: `${Math.max(progress, 3)}%` }}
        />
      </div>

      {/* Current stage */}
      {currentStage && (
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-blue-500" />
          <span className="text-xs font-medium text-slate-700">
            {currentStage.stageLabel}
          </span>
          <StatusBadge status="CURRENT" type="budgetProcess" />
        </div>
      )}

      {/* Next stage */}
      {nextStage && (
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-slate-300" />
          <span className="text-xs text-slate-500">
            Next: {nextStage.stageLabel}
          </span>
          {nextStage.stageDate && (
            <span className="text-xs text-slate-400 italic">
              {formatStageDate(nextStage.stageDate, nextStage.stageDateIsEstimate)}
            </span>
          )}
        </div>
      )}

      <Link
        href="/budget"
        className="text-xs text-[var(--ma-navy)] hover:underline inline-flex items-center gap-1"
      >
        View full timeline →
      </Link>
    </div>
  )
}

export function BudgetProcessTimeline({
  fiscalYear,
  stages,
  compact = false,
  className = '',
}: BudgetProcessTimelineProps) {
  if (!stages || stages.length === 0) {
    return (
      <p className={`text-sm text-slate-500 py-4 ${className}`}>
        No budget process timeline available for FY{fiscalYear}.
      </p>
    )
  }

  if (compact) {
    return (
      <div className={className}>
        <CompactTimeline stages={stages} fiscalYear={fiscalYear} />
      </div>
    )
  }

  return (
    <div className={className}>
      <FullTimeline stages={stages} fiscalYear={fiscalYear} />
    </div>
  )
}
