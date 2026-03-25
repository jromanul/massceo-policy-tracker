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
import {
  BOARD_INTEREST_DISPLAY,
  HEARING_STATUS_DISPLAY,
  resolveCommitteeName,
} from '@/lib/constants'
import { formatDate, truncate } from '@/lib/utils'
import { Edit, Archive, ExternalLink, Calendar, Tag as TagIcon } from 'lucide-react'
import { getLegislativeItem as fetchLegislativeItem } from '@/services/legislation'
import { AmendmentsPanel } from '@/components/shared/amendments-panel'

interface LegislativeItemDetail {
  id: number
  billNumber: string | null
  title: string
  jurisdiction: string
  chamber: string | null
  status: string
  priority: string
  session: string | null
  sponsor: string | null
  coSponsors: string[] | null
  committee: string | null
  summary: string | null
  notes: string | null
  relevanceMassCEO: string | null
  relevanceEOAB: string | null
  boardInterestLevel: string | null
  hearingDates: string[] | null
  reportingDeadlines: string[] | null
  nextMilestone: string | null
  issueCategory: string | null
  externalLinks: string[] | null
  isArchived: boolean
  createdAt: string
  updatedAt: string
  statusDate: string | null
  dataSource?: string
  sourceUrl?: string | null
  sourceExternalId?: string | null
  lastSyncedAt?: string | null
  sourceRetrievedAt?: string | null
  rawSourceStatus?: string | null
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
  relatedHearings?: Array<{
    id: number
    title: string
    startDatetime: string
    status: string
  }>
  relatedBudgetItems?: Array<{
    id: number
    name: string
    fiscalYear: number | null
    status: string
  }>
  relatedPolicyIdeas?: Array<{
    id: number
    title: string
    disposition: string
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

async function getLegislativeItem(id: string): Promise<LegislativeItemDetail | null> {
  try {
    const numId = parseInt(id)
    if (isNaN(numId)) return null
    const raw = await fetchLegislativeItem(numId)
    if (!raw) return null
    // Serialize dates & map field names to match page interface
    const item = JSON.parse(JSON.stringify(raw))
    return {
      ...item,
      // Text fields
      summary: item.shortSummary ?? item.summary ?? null,
      notes: item.detailedNotes ?? null,
      committee: item.assignedCommittee ?? item.committee ?? null,
      sponsor: item.primarySponsor ?? item.sponsor ?? null,
      nextMilestone: item.nextExpectedMilestone ?? item.nextMilestone ?? null,
      relevanceMassCEO: item.relevanceToMassCEO ?? item.relevanceMassCEO ?? null,
      relevanceEOAB: item.relevanceToEOAB ?? item.relevanceEOAB ?? null,
      isArchived: item.archived ?? item.isArchived ?? false,
      // Notes relation → notesList (avoid collision with text 'notes')
      notesList: (item.notes ?? []).filter((n: any) => typeof n === 'object' && n.id).map((n: any) => ({
        id: n.id,
        content: n.content,
        governanceLabel: n.governanceLabel,
        createdAt: n.createdAt,
      })),
      relatedHearings: (item.hearings ?? []).map((h: any) => ({
        id: h.id,
        title: h.title,
        startDatetime: h.date ?? h.startDatetime,
        status: h.status,
      })),
      relatedBudgetItems: (item.budgetItems ?? []).map((b: any) => ({
        id: b.id,
        name: b.name,
        fiscalYear: b.fiscalYear,
        status: b.status,
      })),
      relatedPolicyIdeas: (item.policyIdeas ?? []).map((p: any) => ({
        id: p.id,
        title: p.title,
        disposition: p.disposition,
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
    console.error('[LegislationDetail] Failed to load:', e)
    return null
  }
}

export default async function LegislationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const item = await getLegislativeItem(id)

  if (!item) notFound()

  const relatedGroups = [
    {
      label: 'Hearings',
      records: (item.relatedHearings ?? []).map((h) => ({
        id: h.id,
        title: h.title,
        subtitle: formatDate(h.startDatetime),
        href: `/hearings/${h.id}`,
        badge: HEARING_STATUS_DISPLAY[h.status as keyof typeof HEARING_STATUS_DISPLAY] ?? h.status,
        badgeColor: 'bg-blue-100 text-blue-800',
      })),
    },
    {
      label: 'Budget Items',
      records: (item.relatedBudgetItems ?? []).map((b) => ({
        id: b.id,
        title: b.name,
        subtitle: b.fiscalYear ? `FY${b.fiscalYear}` : undefined,
        href: `/budget/${b.id}`,
        badge: b.status,
        badgeColor: 'bg-green-100 text-green-800',
      })),
    },
    {
      label: 'Policy Ideas',
      records: (item.relatedPolicyIdeas ?? []).map((p) => ({
        id: p.id,
        title: p.title,
        href: `/policy-ideas/${p.id}`,
        badge: p.disposition,
        badgeColor: 'bg-violet-100 text-violet-800',
      })),
    },
  ]

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: 'Legislation', href: '/legislation' },
          { label: item.billNumber ?? item.title },
        ]}
      />

      <PageHeader
        title={item.title}
        description={item.billNumber ? `${item.billNumber}${item.session ? ` · ${item.session}` : ''}` : undefined}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/legislation/${item.id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit size={15} />
                Edit
              </Button>
            </Link>
            {!item.isArchived && (
              <Button variant="outline" size="sm">
                <Archive size={15} />
                Archive
              </Button>
            )}
          </div>
        }
      />

      {/* Key info badges */}
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-700">
          {item.jurisdiction === 'MASSACHUSETTS' ? 'Massachusetts' : 'Federal'}
        </span>
        <StatusBadge status={item.status} type="legislative" />
        {item.chamber && (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-700">
            {item.chamber.charAt(0) + item.chamber.slice(1).toLowerCase()}
          </span>
        )}
        {item.boardInterestLevel && item.boardInterestLevel !== 'NONE' && (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-800">
            Board Interest:{' '}
            {BOARD_INTEREST_DISPLAY[item.boardInterestLevel as keyof typeof BOARD_INTEREST_DISPLAY] ?? item.boardInterestLevel}
          </span>
        )}
        {item.isArchived && (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-zinc-200 text-zinc-600">
            Archived
          </span>
        )}
      </div>

      {/* Source Metadata */}
      <SourceMetadataCard
        dataSource={item.dataSource ?? 'MANUAL'}
        sourceUrl={item.sourceUrl}
        sourceExternalId={item.sourceExternalId}
        lastSyncedAt={item.lastSyncedAt}
        sourceRetrievedAt={item.sourceRetrievedAt}
        rawSourceStatus={item.rawSourceStatus}
        normalizedStatus={item.status}
        jurisdiction={item.jurisdiction}
        statusType="legislative"
      />

      {/* Tabs */}
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
              {/* Summary */}
              {item.summary && (
                <Card>
                  <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{item.summary}</p>
                  </CardContent>
                </Card>
              )}

              {/* Original Source */}
              {item.externalLinks && item.externalLinks.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <ExternalLink size={14} className="text-slate-400" />
                  <span className="text-slate-500">Source:</span>
                  <a
                    href={item.externalLinks[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate"
                  >
                    {item.externalLinks[0]}
                  </a>
                </div>
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

              {/* Relevance */}
              {(item.relevanceMassCEO || item.relevanceEOAB) && (
                <Card>
                  <CardHeader><CardTitle>Relevance</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {item.relevanceMassCEO && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          Relevance to MassCEO
                        </p>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{item.relevanceMassCEO}</p>
                      </div>
                    )}
                    {item.relevanceEOAB && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          Relevance to EOAB
                        </p>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{item.relevanceEOAB}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Details</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {item.sponsor && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Sponsor</p>
                      <p className="text-sm text-slate-700">{item.sponsor}</p>
                    </div>
                  )}
                  {item.coSponsors && item.coSponsors.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Co-Sponsors</p>
                      <p className="text-sm text-slate-700">{item.coSponsors.join(', ')}</p>
                    </div>
                  )}
                  {item.committee && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Committee</p>
                      <p className="text-sm text-slate-700">{resolveCommitteeName(item.committee)}</p>
                      {resolveCommitteeName(item.committee) !== item.committee && (
                        <code className="text-xs text-slate-400">{item.committee}</code>
                      )}
                    </div>
                  )}
                  {item.issueCategory && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Issue Category</p>
                      <p className="text-sm text-slate-700">{item.issueCategory}</p>
                    </div>
                  )}
                  {item.statusDate && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Status Date</p>
                      <p className="text-sm text-slate-700">{formatDate(item.statusDate)}</p>
                    </div>
                  )}
                  {item.lastSyncedAt && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Last Synced</p>
                      <p className="text-sm text-slate-700">{formatDate(item.lastSyncedAt)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Last Updated</p>
                    <p className="text-sm text-slate-700">{formatDate(item.updatedAt)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Scheduling */}
              {(item.hearingDates?.length || item.reportingDeadlines?.length || item.nextMilestone) && (
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><Calendar size={15} />Scheduling</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {item.hearingDates && item.hearingDates.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Hearing Dates</p>
                        {item.hearingDates.map((d, i) => (
                          <p key={i} className="text-sm text-slate-700">{formatDate(d)}</p>
                        ))}
                      </div>
                    )}
                    {item.reportingDeadlines && item.reportingDeadlines.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Reporting Deadlines</p>
                        {item.reportingDeadlines.map((d, i) => (
                          <p key={i} className="text-sm text-slate-700">{formatDate(d)}</p>
                        ))}
                      </div>
                    )}
                    {item.nextMilestone && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Next Milestone</p>
                        <p className="text-sm text-slate-700">{item.nextMilestone}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><TagIcon size={15} />Tags</CardTitle></CardHeader>
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

              {/* External Links */}
              {item.externalLinks && item.externalLinks.length > 0 && (
                <Card>
                  <CardHeader><CardTitle>External Links</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-1.5">
                      {item.externalLinks.map((link, i) => (
                        <li key={i}>
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink size={12} />
                            {truncate(link, 50)}
                          </a>
                        </li>
                      ))}
                    </ul>
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
                parentType="legislation"
                parentId={item.id}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="pt-5">
          <Card>
            <CardHeader><CardTitle>Change History</CardTitle></CardHeader>
            <CardContent>
              <Timeline entries={item.history ?? []} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Related Tab */}
        <TabsContent value="related" className="pt-5">
          <Card>
            <CardHeader><CardTitle>Related Records</CardTitle></CardHeader>
            <CardContent>
              <RelatedRecordsPanel groups={relatedGroups} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="pt-5">
          <Card>
            <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
            <CardContent>
              <AttachmentPanel attachments={item.documents ?? []} readonly />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
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
                        {note.governanceLabel && (
                          <GovernanceLabel label={note.governanceLabel} />
                        )}
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
