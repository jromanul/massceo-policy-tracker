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
import { formatDate, truncate } from '@/lib/utils'
import { Edit, Archive, Info, Tag as TagIcon } from 'lucide-react'
import { getPolicyIdea as fetchPolicyIdea } from '@/services/policy-ideas'

interface PolicyIdeaDetail {
  id: number
  title: string
  issueArea: string | null
  description: string | null
  backgroundContext: string | null
  proposedAction: string | null
  disposition: string
  nextAction: string | null
  nextActionDue: string | null
  staffAnalysis: string | null
  boardDiscussionNotes: string | null
  externalLinks: string[] | null
  isArchived: boolean
  createdAt: string
  updatedAt: string
  dataSource?: string
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
}

async function getPolicyIdea(id: string): Promise<PolicyIdeaDetail | null> {
  try {
    const numId = parseInt(id)
    if (isNaN(numId)) return null
    const raw = await fetchPolicyIdea(numId)
    if (!raw) return null
    const item = JSON.parse(JSON.stringify(raw))
    return {
      ...item,
      description: item.fullDescription ?? item.shortDescription ?? item.description ?? null,
      backgroundContext: item.rationale ?? item.backgroundContext ?? null,
      staffAnalysis: item.staffNotes ?? item.staffAnalysis ?? null,
      isArchived: item.archived ?? item.isArchived ?? false,
      // Notes relation → notesList (avoid collision with Note[] relation)
      notesList: (Array.isArray(item.notes) ? item.notes : []).map((n: any) => ({
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
    }
  } catch (e) {
    console.error('[PolicyIdeaDetail] Failed to load:', e)
    return null
  }
}

export default async function PolicyIdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const item = await getPolicyIdea(id)

  if (!item) notFound()

  const relatedGroups = [
    {
      label: 'Related Legislation',
      records: (item.relatedLegislation ?? []).map((l) => ({
        id: l.id,
        title: l.billNumber ? `${l.billNumber} — ${truncate(l.title, 45)}` : truncate(l.title, 55),
        href: `/legislation/${l.id}`,
        badge: l.status,
        badgeColor: 'bg-blue-100 text-blue-800',
      })),
    },
  ]

  // Separate notes by governance label for display hierarchy
  const formalRecs = (item.notesList ?? []).filter((n) => n.governanceLabel === 'FORMAL_RECOMMENDATION')
  const boardNotes = (item.notesList ?? []).filter((n) =>
    n.governanceLabel === 'BOARD_DISCUSSION' || n.governanceLabel === 'BOARD_IDEA',
  )
  const staffNotes = (item.notesList ?? []).filter((n) =>
    !['FORMAL_RECOMMENDATION', 'BOARD_DISCUSSION', 'BOARD_IDEA'].includes(n.governanceLabel ?? ''),
  )

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: 'EOAB Policy Ideas', href: '/policy-ideas' },
          { label: item.title },
        ]}
      />

      <PageHeader
        title={item.title}
        description={item.issueArea ? `Issue Area: ${item.issueArea}` : undefined}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/policy-ideas/${item.id}/edit`}>
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

      {/* Key info */}
      <div className="flex flex-wrap gap-2">
        <StatusBadge status={item.disposition} type="policy" />
        {item.issueArea && (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-700">
            {item.issueArea}
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
        normalizedStatus={item.disposition}
        statusType="policy"
      />

      {/* Governance notice */}
      <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <Info size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">
          This is an EOAB policy idea. It is not an official MassCEO position unless marked as a{' '}
          <strong>Formal Recommendation</strong>.
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="related">Related</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="pt-5 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              {item.description && (
                <Card>
                  <CardHeader><CardTitle>Description</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              )}

              {item.backgroundContext && (
                <Card>
                  <CardHeader><CardTitle>Background &amp; Context</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{item.backgroundContext}</p>
                  </CardContent>
                </Card>
              )}

              {item.proposedAction && (
                <Card>
                  <CardHeader><CardTitle>Proposed Action</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{item.proposedAction}</p>
                  </CardContent>
                </Card>
              )}

              {item.staffAnalysis && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CardTitle>Staff Analysis</CardTitle>
                      <GovernanceLabel label="STAFF_ANALYSIS" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{item.staffAnalysis}</p>
                  </CardContent>
                </Card>
              )}

              {item.boardDiscussionNotes && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CardTitle>Board Discussion Notes</CardTitle>
                      <GovernanceLabel label="BOARD_DISCUSSION" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{item.boardDiscussionNotes}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Details</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Date Submitted</p>
                    <p className="text-sm text-slate-700">{formatDate(item.createdAt)}</p>
                  </div>
                  {item.nextAction && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Next Action</p>
                      <p className="text-sm text-slate-700">{item.nextAction}</p>
                      {item.nextActionDue && (
                        <p className="text-xs text-slate-500">Due: {formatDate(item.nextActionDue)}</p>
                      )}
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

              {item.externalLinks && item.externalLinks.length > 0 && (
                <Card>
                  <CardHeader><CardTitle>External Links</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-1.5">
                      {item.externalLinks.map((link, i) => (
                        <li key={i}>
                          <a href={link} target="_blank" rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline truncate block">
                            {truncate(link, 45)}
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

        {/* Notes Tab - highlights governance hierarchy */}
        <TabsContent value="notes" className="pt-5 space-y-6">
          {formalRecs.length > 0 && (
            <Card className="border-emerald-200">
              <CardHeader className="bg-emerald-50">
                <div className="flex items-center gap-2">
                  <CardTitle>Formal Recommendations</CardTitle>
                  <GovernanceLabel label="FORMAL_RECOMMENDATION" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-4">
                  {formalRecs.map((note) => (
                    <NoteItem key={note.id} note={note} />
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {boardNotes.length > 0 && (
            <Card className="border-indigo-200">
              <CardHeader className="bg-indigo-50">
                <div className="flex items-center gap-2">
                  <CardTitle>Board Notes</CardTitle>
                  <GovernanceLabel label="BOARD_DISCUSSION" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-4">
                  {boardNotes.map((note) => (
                    <NoteItem key={note.id} note={note} />
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {staffNotes.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Staff Notes</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {staffNotes.map((note) => (
                    <NoteItem key={note.id} note={note} />
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {(!item.notesList || item.notesList.length === 0) && (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-slate-500">No notes yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function NoteItem({
  note,
}: {
  note: {
    id: number
    content: string
    governanceLabel: string | null
    createdAt: string
  }
}) {
  return (
    <li className="border border-slate-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        {note.governanceLabel && <GovernanceLabel label={note.governanceLabel} />}
        <span className="text-xs text-slate-400 ml-auto">
          {formatDate(note.createdAt)}
        </span>
      </div>
      <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.content}</p>
    </li>
  )
}
