'use client'

import { FormEvent, useState, useEffect, use } from 'react'
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

const HEARING_TYPES = ['Hearing', 'Committee Vote', 'Conference', 'Session', 'Briefing', 'Meeting', 'Other']
const LOCATION_TYPES = ['In Person', 'Virtual', 'Hybrid']

function toDatetimeLocal(dt: string | null | undefined): string {
  if (!dt) return ''
  const d = new Date(dt)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 16)
}

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

export default function HearingEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [formData, setFormData] = useState<HearingFormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/hearings/${id}`)
      .then((r) => r.json())
      .then((json) => {
        const item = json.data ?? json
        setFormData({
          title: item.title ?? '',
          startDatetime: toDatetimeLocal(item.startDatetime),
          endDatetime: toDatetimeLocal(item.endDatetime),
          location: item.location ?? '',
          locationType: item.locationType ?? '',
          jurisdiction: item.jurisdiction ?? 'MASSACHUSETTS',
          hearingType: item.hearingType ?? 'Hearing',
          committee: item.committee ?? '',
          status: item.status ?? 'UPCOMING',
          summary: item.summary ?? '',
          prepNotes: item.prepNotes ?? '',
          followUpNotes: item.followUpNotes ?? '',
          tags: Array.isArray(item.tags) ? item.tags.map((t: { name: string }) => t.name).join(', ') : '',
        })
      })
      .catch(() => setError('Failed to load hearing.'))
      .finally(() => setLoading(false))
  }, [id])

  const set = (key: keyof HearingFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setFormData((prev) => prev ? { ...prev, [key]: e.target.value } : prev)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!formData) return
    setSubmitting(true)
    setError(null)

    const payload = {
      ...formData,
      tags: formData.tags ? formData.tags.split(',').map((s) => s.trim()).filter(Boolean) : [],
    }

    try {
      const res = await fetch(`/api/hearings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        router.push(`/hearings/${id}`)
      } else {
        const json = await res.json()
        setError(json.error ?? 'Failed to update.')
      }
    } catch {
      setError('An unexpected error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="py-12 text-center text-sm text-slate-500">Loading…</div>
  if (!formData) return <div className="py-12 text-center text-sm text-red-500">Failed to load hearing.</div>

  return (
    <div className="space-y-5 max-w-3xl">
      <Breadcrumbs items={[{ label: 'Hearings', href: '/hearings' }, { label: formData.title, href: `/hearings/${id}` }, { label: 'Edit' }]} />
      <PageHeader title="Edit Event" actions={
        <Link href={`/hearings/${id}`}><Button variant="outline" size="sm"><X size={15} />Cancel</Button></Link>
      } />

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Event Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Title" required>
              <input type="text" value={formData.title} onChange={set('title')} required
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
              <FormField label="Type" required>
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
                  className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
              </FormField>
              <FormField label="Location">
                <input type="text" value={formData.location} onChange={set('location')}
                  className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
              </FormField>
              <FormField label="Location Type">
                <select value={formData.locationType} onChange={set('locationType')}
                  className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500">
                  <option value="">— Select —</option>
                  {LOCATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </FormField>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Summary">
              <textarea value={formData.summary} onChange={set('summary')} rows={3}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 resize-y" />
            </FormField>
            <FormField label="Prep Notes">
              <textarea value={formData.prepNotes} onChange={set('prepNotes')} rows={3}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 resize-y" />
            </FormField>
            <FormField label="Follow-up Notes">
              <textarea value={formData.followUpNotes} onChange={set('followUpNotes')} rows={3}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 resize-y" />
            </FormField>
            <FormField label="Tags" hint="Comma-separated">
              <input type="text" value={formData.tags} onChange={set('tags')}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
            </FormField>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3 justify-end">
          <Link href={`/hearings/${id}`}><Button type="button" variant="outline">Cancel</Button></Link>
          <Button type="submit" disabled={submitting}>
            <Save size={15} />
            {submitting ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}
