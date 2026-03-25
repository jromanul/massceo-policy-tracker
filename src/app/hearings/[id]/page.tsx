import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/ui/status-badge'
import { AttachmentPanel } from '@/components/shared/attachment-panel'
import { RelatedRecordsPanel } from '@/components/shared/related-records-panel'
import { GovernanceLabel } from '@/components/shared/governance-label'
import { SourceMetadataCard } from '@/components/shared/source-metadata-card'
import { resolveCommitteeName } from '@/lib/constants'
import { formatDate, truncate } from '@/lib/utils'
import { Edit, MapPin, Clock, Users, Tag as TagIcon } from 'lucide-react'
import { getHearing as fetchHearing } from '@/services/hearings'

interface HearingDetail {
  id: number
  title: string
  startDatetime: string
  endDatetime: string | null
  location: string | null
  locationType: string | null
  jurisdiction: string
  hearingType: string
  committee: string | null
  status: string
  summary: string | null
  prepNotes: string | null
  followUpNotes: string | null
  isArchived: boolean
  createdAt: string
  updatedAt: string
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
  notesList?: Array<{
    id: number
    content: string
    governanceLabel: string | null
    createdAt: string
  }>
  legislativeItems?: Array<{
    id: number
    title: string
    billNumber: string | null
    status: string
  }>
  budgetItems?: Array<{
    id: number
    name: string
    fiscalYear: number | null
    status: string
  }>
}

async function getHearing(id: string): Promise<HearingDetail | null> {
  try {
    const numId = parseInt(id)
    if (isNaN(numId)) return null
    const raw = await fetchHearing(numId)
    if (!raw) return null
    const item = JSON.parse(JSON.stringify(raw))
    return {
      ...item,
      startDatetime: item.date ?? item.startDatetime,
      endDatetime: item.endTime ?? item.endDatetime ?? null,
      hearingType: item.eventType ?? item.hearingType,
      committee: item.committeeOrBody ?? item.committee ?? null,
      prepNotes: item.preparationNotes ?? item.prepNotes ?? null,
      isArchived: item.archived ?? item.isArchived ?? false,
      // Notes relation → notesList (avoid collision with Note[] relation)
      notesList: (Array.isArray(item.notes) ? item.notes : []).map((n: any) => ({
        id: n.id,
        content: n.content,
        governanceLabel: n.governanceLabel,
        createdAt: n.createdAt,
      })),
    }
  } catch (e) {
    console.error('[HearingDetail] Failed to load:', e)
    return null
  }
}

export default async function HearingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const item = await getHearing(id)

  if (!item) notFound()

  const start = new Date(item.startDatetime)
  const end = item.endDatetime ? new Date(item.endDatetime) : null

  const relatedGroups = [
    {
      label: 'Related Legislation',
      records: (item.legislativeItems ?? []).map((l) => ({
        id: l.id,
        title: l.billNumber ? `${l.billNumber} — ${truncate(l.title, 45)}` : truncate(l.title, 55),
        href: `/legislation/${l.id}`,
        badge: l.status,
        badgeColor: 'bg-blue-100 text-blue-800',
      })),
    },
    {
      label: 'Related Budget Items',
      records: (item.budgetItems ?? []).map((b) => ({
        id: b.id,
        title: b.name,
        subtitle: b.fiscalYear ? `FY${b.fiscalYear}` : undefined,
        href: `/budget/${b.id}`,
        badge: b.status,
        badgeColor: 'bg-green-100 text-green-800',
      })),
    },
  ]

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: 'Hearings', href: '/hearings' },
          { label: item.title },
        ]}
      />

      <PageHeader
        title={item.title}
        description={`${item.hearingType} · ${start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`}
        actions={
          <Link href={`/hearings/${item.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit size={15} />
              Edit
            </Button>
          </Link>
        }
      />

      {/* Key info */}
      <div className="flex flex-wrap gap-2">
        <StatusBadge status={item.status} type="hearing" />
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-700">
          {item.jurisdiction === 'MASSACHUSETTS' ? 'Massachusetts' : 'Federal'}
        </span>
        {item.isArchived && (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-zinc-200 text-zinc-600">Archived</span>
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
        statusType="hearing"
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="related">Related</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="pt-5 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              {/* Event Details Card */}
              <Card>
                <CardHeader><CardTitle>Event Details</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Clock size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-sm text-slate-600">
                        {start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        {end && ` – ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
                      </p>
                    </div>
                  </div>
                  {item.location && (
                    <div className="flex items-start gap-3">
                      <MapPin size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-slate-700">{item.location}</p>
                        {item.locationType && (
                          <p className="text-xs text-slate-500">{item.locationType}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {item.committee && (
                    <div className="flex items-start gap-3">
                      <Users size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-slate-700">{resolveCommitteeName(item.committee)}</p>
                        {resolveCommitteeName(item.committee) !== item.committee && (
                          <code className="text-xs text-slate-400">{item.committee}</code>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Summary */}
              {item.summary && (
                <Card>
                  <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{item.summary}</p>
                  </CardContent>
                </Card>
              )}

              {/* Prep Notes */}
              {item.prepNotes && (
                <Card>
                  <CardHeader><CardTitle>Prep Notes</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{item.prepNotes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Follow-up Notes */}
              {item.followUpNotes && (
                <Card>
                  <CardHeader><CardTitle>Follow-up Notes</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{item.followUpNotes}</p>
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
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Type</p>
                    <p className="text-sm text-slate-700">{item.hearingType}</p>
                  </div>
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
            </div>
          </div>
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
