'use client'

import { FormEvent, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  JURISDICTION_OPTIONS,
  LEGISLATIVE_STATUS_OPTIONS,
  CHAMBER_OPTIONS,
  BOARD_INTEREST_OPTIONS,
} from '@/lib/constants'
import { Save, X } from 'lucide-react'

interface LegislationFormData {
  jurisdiction: string
  billNumber: string
  session: string
  title: string
  chamber: string
  summary: string
  notes: string
  sponsor: string
  coSponsors: string
  committee: string
  status: string
  statusDate: string
  issueCategory: string
  boardInterestLevel: string
  relevanceMassCEO: string
  relevanceEOAB: string
  hearingDates: string
  reportingDeadlines: string
  nextMilestone: string
  tags: string
  externalLinks: string
}

function FormField({
  label,
  required,
  children,
  hint,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

export default function LegislationEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [formData, setFormData] = useState<LegislationFormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/legislation/${id}`)
      .then((r) => r.json())
      .then((json) => {
        const item = json.data ?? json
        setFormData({
          jurisdiction: item.jurisdiction ?? 'MASSACHUSETTS',
          billNumber: item.billNumber ?? '',
          session: item.session ?? '',
          title: item.title ?? '',
          chamber: item.chamber ?? '',
          summary: item.summary ?? '',
          notes: item.notes ?? '',
          sponsor: item.sponsor ?? '',
          coSponsors: Array.isArray(item.coSponsors) ? item.coSponsors.join(', ') : '',
          committee: item.committee ?? '',
          status: item.status ?? 'FILED',
          statusDate: item.statusDate ? item.statusDate.slice(0, 10) : '',
          issueCategory: item.issueCategory ?? '',
          boardInterestLevel: item.boardInterestLevel ?? 'NONE',
          relevanceMassCEO: item.relevanceMassCEO ?? '',
          relevanceEOAB: item.relevanceEOAB ?? '',
          hearingDates: Array.isArray(item.hearingDates) ? item.hearingDates.join(', ') : '',
          reportingDeadlines: Array.isArray(item.reportingDeadlines) ? item.reportingDeadlines.join(', ') : '',
          nextMilestone: item.nextMilestone ?? '',
          tags: Array.isArray(item.tags) ? item.tags.map((t: { name: string }) => t.name).join(', ') : '',
          externalLinks: Array.isArray(item.externalLinks) ? item.externalLinks.join('\n') : '',
        })
      })
      .catch(() => setError('Failed to load bill data.'))
      .finally(() => setLoading(false))
  }, [id])

  const set = (key: keyof LegislationFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setFormData((prev) => prev ? { ...prev, [key]: e.target.value } : prev)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!formData) return
    setSubmitting(true)
    setError(null)

    const payload = {
      ...formData,
      coSponsors: formData.coSponsors
        ? formData.coSponsors.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      hearingDates: formData.hearingDates
        ? formData.hearingDates.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      reportingDeadlines: formData.reportingDeadlines
        ? formData.reportingDeadlines.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      tags: formData.tags
        ? formData.tags.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      externalLinks: formData.externalLinks
        ? formData.externalLinks.split('\n').map((s) => s.trim()).filter(Boolean)
        : [],
    }

    try {
      const res = await fetch(`/api/legislation/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        router.push(`/legislation/${id}`)
      } else {
        const json = await res.json()
        setError(json.error ?? 'Failed to update bill.')
      }
    } catch {
      setError('An unexpected error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="py-12 text-center text-sm text-slate-500">Loading…</div>
  if (!formData) return <div className="py-12 text-center text-sm text-red-500">Failed to load bill.</div>

  return (
    <div className="space-y-5 max-w-4xl">
      <Breadcrumbs
        items={[
          { label: 'Legislation', href: '/legislation' },
          { label: formData.billNumber || formData.title, href: `/legislation/${id}` },
          { label: 'Edit' },
        ]}
      />

      <PageHeader
        title="Edit Bill"
        actions={
          <Link href={`/legislation/${id}`}>
            <Button variant="outline" size="sm">
              <X size={15} />
              Cancel
            </Button>
          </Link>
        }
      />

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Jurisdiction" required>
              <select value={formData.jurisdiction} onChange={set('jurisdiction')}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500" required>
                {JURISDICTION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </FormField>
            <FormField label="Bill Number">
              <input type="text" value={formData.billNumber} onChange={set('billNumber')}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
            </FormField>
            <FormField label="Session">
              <input type="text" value={formData.session} onChange={set('session')}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
            </FormField>
            <FormField label="Title" required>
              <input type="text" value={formData.title} onChange={set('title')} required
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
            </FormField>
            <FormField label="Chamber">
              <select value={formData.chamber} onChange={set('chamber')}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500">
                <option value="">— Select —</option>
                {CHAMBER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </FormField>
          </CardContent>
        </Card>

        {/* Details */}
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Summary">
              <textarea value={formData.summary} onChange={set('summary')} rows={4}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 resize-y" />
            </FormField>
            <FormField label="Staff Notes">
              <textarea value={formData.notes} onChange={set('notes')} rows={3}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 resize-y" />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Sponsor">
                <input type="text" value={formData.sponsor} onChange={set('sponsor')}
                  className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
              </FormField>
              <FormField label="Co-Sponsors" hint="Comma-separated">
                <input type="text" value={formData.coSponsors} onChange={set('coSponsors')}
                  className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
              </FormField>
              <FormField label="Committee">
                <input type="text" value={formData.committee} onChange={set('committee')}
                  className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader><CardTitle>Status</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Status" required>
              <select value={formData.status} onChange={set('status')} required
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500">
                {LEGISLATIVE_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </FormField>
            <FormField label="Status Date">
              <input type="date" value={formData.statusDate} onChange={set('statusDate')}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
            </FormField>
            <FormField label="Issue Category">
              <input type="text" value={formData.issueCategory} onChange={set('issueCategory')}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
            </FormField>
            <FormField label="Board Interest Level">
              <select value={formData.boardInterestLevel} onChange={set('boardInterestLevel')}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500">
                {BOARD_INTEREST_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </FormField>
          </CardContent>
        </Card>

        {/* Relevance */}
        <Card>
          <CardHeader><CardTitle>Relevance</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Relevance to MassCEO">
              <textarea value={formData.relevanceMassCEO} onChange={set('relevanceMassCEO')} rows={3}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 resize-y" />
            </FormField>
            <FormField label="Relevance to EOAB">
              <textarea value={formData.relevanceEOAB} onChange={set('relevanceEOAB')} rows={3}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 resize-y" />
            </FormField>
          </CardContent>
        </Card>

        {/* Scheduling */}
        <Card>
          <CardHeader><CardTitle>Scheduling</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Hearing Dates" hint="Comma-separated dates">
              <input type="text" value={formData.hearingDates} onChange={set('hearingDates')}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
            </FormField>
            <FormField label="Reporting Deadlines" hint="Comma-separated dates">
              <input type="text" value={formData.reportingDeadlines} onChange={set('reportingDeadlines')}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
            </FormField>
            <FormField label="Next Milestone">
              <input type="text" value={formData.nextMilestone} onChange={set('nextMilestone')}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
            </FormField>
          </CardContent>
        </Card>

        {/* Tags & Links */}
        <Card>
          <CardHeader><CardTitle>Tags &amp; External Links</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Tags" hint="Comma-separated">
              <input type="text" value={formData.tags} onChange={set('tags')}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
            </FormField>
            <FormField label="External Links" hint="One URL per line">
              <textarea value={formData.externalLinks} onChange={set('externalLinks')} rows={3}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 resize-y" />
            </FormField>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3 justify-end">
          <Link href={`/legislation/${id}`}>
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={submitting}>
            <Save size={15} />
            {submitting ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}
