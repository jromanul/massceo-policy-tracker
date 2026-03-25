'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import {
  JURISDICTION_OPTIONS,
  LEGISLATIVE_STATUS_OPTIONS,
  CHAMBER_OPTIONS,
  BOARD_INTEREST_OPTIONS,
} from '@/lib/constants'
import { Save, X } from 'lucide-react'
import Link from 'next/link'

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

const defaultForm: LegislationFormData = {
  jurisdiction: 'MASSACHUSETTS',
  billNumber: '',
  session: '',
  title: '',
  chamber: '',
  summary: '',
  notes: '',
  sponsor: '',
  coSponsors: '',
  committee: '',
  status: 'FILED',
  statusDate: '',
  issueCategory: '',
  boardInterestLevel: 'NONE',
  relevanceMassCEO: '',
  relevanceEOAB: '',
  hearingDates: '',
  reportingDeadlines: '',
  nextMilestone: '',
  tags: '',
  externalLinks: '',
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="border-b border-slate-200 pb-2 mb-4">
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">{title}</h2>
    </div>
  )
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

export default function LegislationNewPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<LegislationFormData>(defaultForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof LegislationFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setFormData((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
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
      const res = await fetch('/api/legislation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const json = await res.json()
        const newId = json.data?.id ?? json.id
        router.push(`/legislation/${newId}`)
      } else {
        const json = await res.json()
        setError(json.error ?? 'Failed to create bill.')
      }
    } catch {
      setError('An unexpected error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <Breadcrumbs
        items={[
          { label: 'Legislation', href: '/legislation' },
          { label: 'New Bill' },
        ]}
      />

      <PageHeader
        title="Add New Bill"
        description="Create a new legislative item to track."
        actions={
          <Link href="/legislation">
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
            <SectionHeader title="" />
            <FormField label="Jurisdiction" required>
              <select
                value={formData.jurisdiction}
                onChange={set('jurisdiction')}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500"
                required
              >
                {JURISDICTION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Bill Number" hint="e.g. H.123, S.456, HR 1234">
              <input
                type="text"
                value={formData.billNumber}
                onChange={set('billNumber')}
                placeholder="H.123"
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </FormField>
            <FormField label="Session" hint="e.g. 194th General Court">
              <input
                type="text"
                value={formData.session}
                onChange={set('session')}
                placeholder="194th General Court"
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </FormField>
            <FormField label="Title" required>
              <input
                type="text"
                value={formData.title}
                onChange={set('title')}
                placeholder="Full title of the bill"
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 sm:col-span-2"
                required
              />
            </FormField>
            <FormField label="Chamber">
              <select
                value={formData.chamber}
                onChange={set('chamber')}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                <option value="">— Select —</option>
                {CHAMBER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </FormField>
          </CardContent>
        </Card>

        {/* Details */}
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Summary">
              <textarea
                value={formData.summary}
                onChange={set('summary')}
                rows={4}
                placeholder="Brief summary of the bill..."
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 resize-y"
              />
            </FormField>
            <FormField label="Staff Notes">
              <textarea
                value={formData.notes}
                onChange={set('notes')}
                rows={3}
                placeholder="Internal notes..."
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 resize-y"
              />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Sponsor">
                <input
                  type="text"
                  value={formData.sponsor}
                  onChange={set('sponsor')}
                  placeholder="Primary sponsor"
                  className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </FormField>
              <FormField label="Co-Sponsors" hint="Comma-separated">
                <input
                  type="text"
                  value={formData.coSponsors}
                  onChange={set('coSponsors')}
                  placeholder="Sen. Smith, Rep. Jones"
                  className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </FormField>
              <FormField label="Committee">
                <input
                  type="text"
                  value={formData.committee}
                  onChange={set('committee')}
                  placeholder="Committee name"
                  className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader><CardTitle>Status</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Status" required>
              <select
                value={formData.status}
                onChange={set('status')}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500"
                required
              >
                {LEGISLATIVE_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Status Date">
              <input
                type="date"
                value={formData.statusDate}
                onChange={set('statusDate')}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </FormField>
            <FormField label="Issue Category">
              <input
                type="text"
                value={formData.issueCategory}
                onChange={set('issueCategory')}
                placeholder="e.g. Worker Ownership, Tax Policy"
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </FormField>
            <FormField label="Board Interest Level">
              <select
                value={formData.boardInterestLevel}
                onChange={set('boardInterestLevel')}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                {BOARD_INTEREST_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </FormField>
          </CardContent>
        </Card>

        {/* Relevance */}
        <Card>
          <CardHeader><CardTitle>Relevance</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Relevance to MassCEO">
              <textarea
                value={formData.relevanceMassCEO}
                onChange={set('relevanceMassCEO')}
                rows={3}
                placeholder="How does this relate to MassCEO's mission and priorities?"
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 resize-y"
              />
            </FormField>
            <FormField label="Relevance to EOAB">
              <textarea
                value={formData.relevanceEOAB}
                onChange={set('relevanceEOAB')}
                rows={3}
                placeholder="How does this relate to the EOAB's work?"
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 resize-y"
              />
            </FormField>
          </CardContent>
        </Card>

        {/* Scheduling */}
        <Card>
          <CardHeader><CardTitle>Scheduling</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Hearing Dates" hint="Comma-separated dates (YYYY-MM-DD)">
              <input
                type="text"
                value={formData.hearingDates}
                onChange={set('hearingDates')}
                placeholder="2025-03-15, 2025-04-10"
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </FormField>
            <FormField label="Reporting Deadlines" hint="Comma-separated dates">
              <input
                type="text"
                value={formData.reportingDeadlines}
                onChange={set('reportingDeadlines')}
                placeholder="2025-05-01"
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </FormField>
            <FormField label="Next Milestone">
              <input
                type="text"
                value={formData.nextMilestone}
                onChange={set('nextMilestone')}
                placeholder="Committee vote expected..."
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </FormField>
          </CardContent>
        </Card>

        {/* Tags & Links */}
        <Card>
          <CardHeader><CardTitle>Tags &amp; External Links</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Tags" hint="Comma-separated tag names">
              <input
                type="text"
                value={formData.tags}
                onChange={set('tags')}
                placeholder="EO, Tax Credit, Budget"
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </FormField>
            <FormField label="External Links" hint="One URL per line">
              <textarea
                value={formData.externalLinks}
                onChange={set('externalLinks')}
                rows={3}
                placeholder="https://malegislature.gov/Bills/194/H123&#10;https://..."
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 resize-y"
              />
            </FormField>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center gap-3 justify-end">
          <Link href="/legislation">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={submitting}>
            <Save size={15} />
            {submitting ? 'Saving…' : 'Save Bill'}
          </Button>
        </div>
      </form>
    </div>
  )
}
