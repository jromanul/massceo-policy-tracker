import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/ui/status-badge'
import { Timeline } from '@/components/shared/timeline'
import { AttachmentPanel } from '@/components/shared/attachment-panel'
import { RelatedRecordsPanel } from '@/components/shared/related-records-panel'
import { GovernanceLabel } from '@/components/shared/governance-label'
import { SourceMetadataCard } from '@/components/shared/source-metadata-card'
import { BOARD_DISCUSSION_STATUS_DISPLAY, BUDGET_SOURCE_STAGES } from '@/lib/constants'
import { formatDate, formatCurrency, truncate } from '@/lib/utils'
import { Edit, TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react'
import { getBudgetItem as fetchBudgetItem } from '@/services/budget'
import { AmendmentsPanel } from '@/components/shared/amendments-panel'

interface BudgetItemDetail {
  id: number
  name: string
  fiscalYear: number | null
  sourceStage: string
  proposedAmount: string | number | null
  adoptedAmount: string | number | null
  priorYearAmount: string | number | null
  status: string
  priority: string
  description: string | null
  notes: string | null
  accountLine: string | null
  boardDiscussionStatus: string | null
  isArchived: boolean
  createdAt: string
  updatedAt: string
  dataSource?: string
  sourceUrl?: string | null
  sourceExternalId?: string | null
  lastSyncedAt?: string | null
  rawSourceStatus?: string | null
  budgetStages?: Array<{
    id: number
    stage: string
    amount: string | number | null
    sourceUrl: string | null
    sourceRetrievedAt: string | null
    provenance: string | null
    notes: string | null
  }>
  tags?: { id: number; name: string }[]
  documents?: Array<{
    id: number
    fileName: string
    fileSize: number | null
    mimeType: string | null
    url: string | null
    uploadedAt: string | null
  }>
  history?: Array<{
    id: number
    action: string
    description: string | null
    createdAt: string
  }>
  notesList?: Array<{
    id: number
    content: string
    governanceLabel: string | null
    createdAt: string
  }>
  relatedLegislation?: Array<{
    id: number
    title: string
    billNumber: string | null
    status: string
  }>
  relatedHearings?: Array<{
    id: number
    title: string
    startDatetime: string
    status: string
  }>
  amendments?: Array<{
    id: number
    amendmentNumber: string | null
    title: string
    type: string
    description: string | null
    filedBy: string | null
    stage: string | null
    chamber: string | null
    amount: string | number | null
    status: string
    statusDate: string | null
    eoRelevanceNotes: string | null
    sourceUrl: string | null
    createdAt: string
  }>
}

async function getBudgetItem(id: string): Promise<BudgetItemDetail | null> {
  try {
    const numId = parseInt(id)
    if (isNaN(numId)) return null
    const raw = await fetchBudgetItem(numId)
    if (!raw) return null
    const item = JSON.parse(JSON.stringify(raw))
    return {
      ...item,
      proposedAmount: item.amountProposed ?? item.proposedAmount ?? null,
      adoptedAmount: item.amountAdopted ?? item.adoptedAmount ?? null,
      priorYearAmount: item.priorYearAmount ?? null,
      accountLine: item.lineItemNumber ?? item.accountLine ?? null,
      isArchived: item.archived ?? item.isArchived ?? false,
      notesList: (item.notes_rel ?? item.notesList ?? []).map((n: any) => ({
        id: n.id,
        content: n.content,
        governanceLabel: n.governanceLabel,
        createdAt: n.createdAt,
      })),
      relatedLegislation: (item.legislativeItems ?? []).map((l: any) => ({
        id: l.id,
        title: l.title,
        billNumber: l.billNumber,
        status: l.status,
      })),
      relatedHearings: (item.hearings ?? []).map((h: any) => ({
        id: h.id,
        title: h.title,
        startDatetime: h.date ?? h.startDatetime,
        status: h.status,
      })),
      amendments: (item.amendments ?? []).map((a: any) => ({
        id: a.id,
        amendmentNumber: a.amendmentNumber,
        title: a.title,
        type: a.type,
        description: a.description,
        filedBy: a.filedBy,
        stage: a.stage,
        chamber: a.chamber,
        amount: a.amount,
        status: a.status,
        statusDate: a.statusDate,
        eoRelevanceNotes: a.eoRelevanceNotes,
        sourceUrl: a.sourceUrl,
        createdAt: a.createdAt,
      })),
    }
  } catch (e) {
    console.error('[BudgetDetail] Failed to load:', e)
    return null
  }
}

function AmountDelta({ current, prior }: { current: number | string | null; prior: number | string | null }) {
  if (current == null || prior == null) return null
  const curr = typeof current === 'string' ? parseFloat(current) : current
  const priorNum = typeof prior === 'string' ? parseFloat(prior) : prior
  if (isNaN(curr) || isNaN(priorNum)) return null

  const delta = curr - priorNum
  const pct = priorNum !== 0 ? ((delta / priorNum) * 100).toFixed(1) : null

  if (Math.abs(delta) < 1) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
        <Minus size={12} /> No change from prior year
      </span>
    )
  }

  const isPositive = delta > 0
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
      {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {isPositive ? '+' : ''}{formatCurrency(delta)}
      {pct && ` (${isPositive ? '+' : ''}${pct}%)`} vs. prior year
    </span>
  )
}

export default async function BudgetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const item = await getBudgetItem(id)

  if (!item) notFound()

  const stageName = BUDGET_SOURCE_STAGES.find((s) => s.value === item.sourceStage)?.label ?? item.sourceStage

  const relatedGroups = [
    {
      label: 'Legislation',
      records: (item.relatedLegislation ?? []).map((l) => ({
        id: l.id,
        title: l.billNumber ? `${l.billNumber} — ${truncate(l.title, 45)}` : truncate(l.title, 55),
        href: `/legislation/${l.id}`,
        badge: l.status,
        badgeColor: 'bg-blue-100 text-blue-800',
      })),
    },
    {
      label: 'Hearings',
      records: (item.relatedHearings ?? []).map((h) => ({
        id: h.id,
        title: h.title,
        subtitle: formatDate(h.startDatetime),
        href: `/hearings/${h.id}`,
        badge: h.status,
        badgeColor: 'bg-blue-100 text-blue-800',
      })),
    },
  ]

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: 'Budget', href: '/budget' },
          { label: item.name },
        ]}
      />

      <PageHeader
        title={item.name}
        description={[item.fiscalYear ? `FY${item.fiscalYear}` : null, stageName, item.accountLine ? `Line ${item.accountLine}` : null].filter(Boolean).join(' · ')}
        actions={
          <Link href={`/budget/${item.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit size={15} />
              Edit
            </Button>
          </Link>
        }
      />

      {/* Key info */}
      <div className="flex flex-wrap gap-2">
        {item.fiscalYear && (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-700">
            FY{item.fiscalYear}
          </span>
        )}
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700">
          {stageName}
        </span>
        <StatusBadge status={item.status} type="budget" />
        {item.boardDiscussionStatus && (
          <StatusBadge status={item.boardDiscussionStatus} type="boardDiscussion" />
        )}
        {item.isArchived && (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-zinc-200 text-zinc-600">
            Archived
          </span>
        )}
      </div>

      <SourceMetadataCard
        dataSource={item.dataSource ?? 'MANUAL'}
        sourceUrl={item.sourceUrl}
        sourceExternalId={item.sourceExternalId}
        lastSyncedAt={item.lastSyncedAt}
        rawSourceStatus={item.rawSourceStatus}
        normalizedStatus={item.status}
        statusType="budget"
        budgetStages={item.budgetStages}
      />

      {item.dataSource === 'SEED' && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-sm text-amber-800">
            This budget item contains seed data{item.accountLine ? ` tracking MA line item ${item.accountLine}` : ''}.
            It should be replaced with authoritative data from budget.digital.mass.gov when available.
          </p>
        </div>
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="amendments">Amendments</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="related">Related</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="pt-5 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              {/* Amounts */}
              <Card>
                <CardHeader><CardTitle>Budget Amounts</CardTitle></CardHeader>
                <CardContent>
                  {item.proposedAmount == null && item.adoptedAmount == null && item.priorYearAmount == null ? (
                    <p className="text-sm text-slate-500">No budget amounts recorded.</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        {item.proposedAmount != null && (
                          <div className="p-3 bg-blue-50 rounded-md">
                            <p className="text-xs text-slate-500 mb-0.5">Proposed</p>
                            <p className="text-xl font-bold text-slate-900">{formatCurrency(item.proposedAmount)}</p>
                          </div>
                        )}
                        {item.adoptedAmount != null && (
                          <div className="p-3 bg-green-50 rounded-md">
                            <p className="text-xs text-slate-500 mb-0.5">Adopted</p>
                            <p className="text-xl font-bold text-slate-900">{formatCurrency(item.adoptedAmount)}</p>
                          </div>
                        )}
                        {item.priorYearAmount != null && (
                          <div className="p-3 bg-slate-50 rounded-md">
                            <p className="text-xs text-slate-500 mb-0.5">Prior Year</p>
                            <p className="text-xl font-bold text-slate-900">{formatCurrency(item.priorYearAmount)}</p>
                          </div>
                        )}
                      </div>
                      {item.priorYearAmount != null && (
                        <AmountDelta current={item.proposedAmount} prior={item.priorYearAmount} />
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Original Source */}
              {item.accountLine && (
                <div className="flex items-center gap-2 text-sm">
                  <ExternalLink size={14} className="text-slate-400" />
                  <span className="text-slate-500">Source:</span>
                  <a
                    href={item.sourceUrl ?? `https://budget.digital.mass.gov/summary/fy${item.fiscalYear ?? 27}/budget-line-items/${(item.accountLine as string).replace(/-/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    MA Budget Line {item.accountLine}
                  </a>
                </div>
              )}

              {item.description && (
                <Card>
                  <CardHeader><CardTitle>Description</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              {item.notes && (
                <Card>
                  <CardHeader><CardTitle>Staff Notes</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{item.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Details</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {item.accountLine && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Account Line</p>
                      <p className="text-sm text-slate-700 font-mono">{item.accountLine}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Last Updated</p>
                    <p className="text-sm text-slate-700">{formatDate(item.updatedAt)}</p>
                  </div>
                </CardContent>
              </Card>

              {item.tags && item.tags.length > 0 && (
                <Card>
                  <CardHeader><CardTitle>Tags</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1.5">
                      {item.tags.map((tag) => (
                        <span key={tag.id} className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-600">
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="amendments" className="pt-5">
          <Card>
            <CardHeader><CardTitle>Amendments & Earmarks</CardTitle></CardHeader>
            <CardContent>
              <AmendmentsPanel
                amendments={item.amendments ?? []}
                parentType="budget"
                parentId={item.id}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="pt-5">
          <Card>
            <CardHeader><CardTitle>Change History</CardTitle></CardHeader>
            <CardContent>
              <Timeline entries={item.history ?? []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="related" className="pt-5">
          <Card>
            <CardHeader><CardTitle>Related Records</CardTitle></CardHeader>
            <CardContent>
              <RelatedRecordsPanel groups={relatedGroups} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="pt-5">
          <Card>
            <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
            <CardContent>
              <AttachmentPanel attachments={item.documents ?? []} readonly />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="pt-5">
          <Card>
            <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
            <CardContent>
              {(!item.notesList || item.notesList.length === 0) ? (
                <p className="text-sm text-slate-500">No notes yet.</p>
              ) : (
                <ul className="space-y-4">
                  {item.notesList.map((note) => (
                    <li key={note.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {note.governanceLabel && <GovernanceLabel label={note.governanceLabel} />}
                        <span className="text-xs text-slate-400 ml-auto">
                          {formatDate(note.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.content}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
