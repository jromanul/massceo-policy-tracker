'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { HEARING_STATUS_OPTIONS, JURISDICTION_OPTIONS } from '@/lib/constants'
import { Save, X } from 'lucide-react'

interface HearingFormData {
  title: string
  startDatetime: string
  endDatetime: string
  location: string
  locationType: string
  jurisdiction: string
  hearingType: string
  committee: string
  status: string
  summary: string
  prepNotes: string
  followUpNotes: string
  tags: string
}

const defaultForm: HearingFormData = {
  title: '',
  startDatetime: '',
  endDatetime: '',
  location: '',
  locationType: '',
  jurisdiction: 'MASSACHUSETTS',
  hearingType: 'Hearing',
  committee: '',
  status: 'UPCOMING',
  summary: '',
  prepNotes: '',
  followUpNotes: '',
  tags: '',
}

const HEARING_TYPES = ['Hearing', 'Committee Vote', 'Conference', 'Session', 'Briefing', 'Meeting', 'Other']
const LOCATION_TYPES = ['In Person', 'Virtual', 'Hybrid']

function FormField({ label, required, children, hint }: {
  label: string; required?: boolean; children: React.ReactNode; hint?: string
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

export default function HearingNewPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<HearingFormData>(defaultForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof HearingFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setFormData((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const payload = {
      ...formData,
      tags: formData.tags ? formData.tags.split(',').map((s) => s.trim()).filter(Boolean) : [],
    }

    try {
      const res = await fetch('/api/hearings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const json = await res.json()
        router.push(`/hearings/${json.data?.id ?? json.id}`)
      } else {
        const json = await res.json()
        setError(json.error ?? 'Failed to create event.')
      }
    } catch {
      setError('An unexpected error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <Breadcrumbs items={[{ label: 'Hearings', href: '/hearings' }, { label: 'New Event' }]} />
      <PageHeader
        title="Add Hearing / Event"
        actions={<Link href="/hearings"><Button variant="outline" size="sm"><X size={15} />Cancel</Button></Link>}
      />

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader><CardTitle>Event Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Title" required>
              <input type="text" value={formData.title} onChange={set('title')} required
                placeholder="Hearing on An Act Relative to..."
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Start Date &amp; Time" required>
                <input type="datetime-local" value={formData.startDatetime} onChange={set('startDatetime')} required
                  className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
              </FormField>
              <FormField label="End Date &amp; Time">
                <input type="datetime-local" value={formData.endDatetime} onChange={set('endDatetime')}
                  className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
              </FormField>
              <FormField label="Hearing Type" required>
                <select value={formData.hearingType} onChange={set('hearingType')} required
                  className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500">
                  {HEARING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </FormField>
              <FormField label="Status" required>
                <select value={formData.status} onChange={set('status')} required
                  className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500">
                  {HEARING_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </FormField>
              <FormField label="Jurisdiction" required>
                <select value={formData.jurisdiction} onChange={set('jurisdiction')} required
                  className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500">
                  {JURISDICTION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </FormField>
              <FormField label="Committee">
                <input type="text" value={formData.committee} onChange={set('committee')}
                  placeholder="Joint Committee on..."
                  className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader><CardTitle>Location</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Location / Room">
              <input type="text" value={formData.location} onChange={set('location')}
                placeholder="Room A-1, State House"
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
            </FormField>
            <FormField label="Location Type">
              <select value={formData.locationType} onChange={set('locationType')}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500">
                <option value="">— Select —</option>
                {LOCATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </FormField>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Summary">
              <textarea value={formData.summary} onChange={set('summary')} rows={3}
                placeholder="Brief description of the event..."
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 resize-y" />
            </FormField>
            <FormField label="Prep Notes">
              <textarea value={formData.prepNotes} onChange={set('prepNotes')} rows={3}
                placeholder="Preparation notes for staff..."
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 resize-y" />
            </FormField>
            <FormField label="Follow-up Notes">
              <textarea value={formData.followUpNotes} onChange={set('followUpNotes')} rows={3}
                placeholder="Notes added after the event..."
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 resize-y" />
            </FormField>
            <FormField label="Tags" hint="Comma-separated">
              <input type="text" value={formData.tags} onChange={set('tags')}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
            </FormField>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3 justify-end">
          <Link href="/hearings"><Button type="button" variant="outline">Cancel</Button></Link>
          <Button type="submit" disabled={submitting}>
            <Save size={15} />
            {submitting ? 'Saving…' : 'Save Event'}
          </Button>
        </div>
      </form>
    </div>
  )
}
