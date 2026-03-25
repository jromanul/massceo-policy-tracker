'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { POLICY_DISPOSITION_OPTIONS } from '@/lib/constants'
import { Save, X } from 'lucide-react'

interface PolicyIdeaFormData {
  title: string
  issueArea: string
  description: string
  backgroundContext: string
  proposedAction: string
  disposition: string
  nextAction: string
  nextActionDue: string
  staffAnalysis: string
  boardDiscussionNotes: string
  externalLinks: string
  tags: string
}

const defaultForm: PolicyIdeaFormData = {
  title: '',
  issueArea: '',
  description: '',
  backgroundContext: '',
  proposedAction: '',
  disposition: 'SUBMITTED',
  nextAction: '',
  nextActionDue: '',
  staffAnalysis: '',
  boardDiscussionNotes: '',
  externalLinks: '',
  tags: '',
}

const ISSUE_AREAS = [
  'Worker Ownership',
  'Tax Policy',
  'Capital Access',
  'Technical Assistance',
  'Workforce Development',
  'Other',
]

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

export default function PolicyIdeaNewPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<PolicyIdeaFormData>(defaultForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof PolicyIdeaFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setFormData((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const payload = {
      ...formData,
      tags: formData.tags ? formData.tags.split(',').map((s) => s.trim()).filter(Boolean) : [],
      externalLinks: formData.externalLinks
        ? formData.externalLinks.split('\n').map((s) => s.trim()).filter(Boolean)
        : [],
    }

    try {
      const res = await fetch('/api/policy-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const json = await res.json()
        router.push(`/policy-ideas/${json.data?.id ?? json.id}`)
      } else {
        const json = await res.json()
        setError(json.error ?? 'Failed to submit idea.')
      }
    } catch {
      setError('An unexpected error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <Breadcrumbs items={[{ label: 'EOAB Policy Ideas', href: '/policy-ideas' }, { label: 'Submit Idea' }]} />
      <PageHeader
        title="Submit Policy Idea"
        description="Submit a new policy idea for EOAB consideration."
        actions={<Link href="/policy-ideas"><Button variant="outline" size="sm"><X size={15} />Cancel</Button></Link>}
      />

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic */}
        <Card>
          <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Title" required>
              <input type="text" value={formData.title} onChange={set('title')} required
                placeholder="Brief, descriptive title for the policy idea"
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Issue Area">
                <select value={formData.issueArea} onChange={set('issueArea')}
                  className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500">
                  <option value="">— Select —</option>
                  {ISSUE_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </FormField>
              <FormField label="Disposition" required>
                <select value={formData.disposition} onChange={set('disposition')} required
                  className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500">
                  {POLICY_DISPOSITION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <Card>
          <CardHeader><CardTitle>Policy Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Description" required>
              <textarea value={formData.description} onChange={set('description')} rows={4} required
                placeholder="Describe the policy idea in detail..."
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 resize-y" />
            </FormField>
            <FormField label="Background &amp; Context">
              <textarea value={formData.backgroundContext} onChange={set('backgroundContext')} rows={3}
                placeholder="What is the background context or motivation for this idea?"
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 resize-y" />
            </FormField>
            <FormField label="Proposed Action">
              <textarea value={formData.proposedAction} onChange={set('proposedAction')} rows={3}
                placeholder="What specific action is being proposed?"
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 resize-y" />
            </FormField>
          </CardContent>
        </Card>

        {/* Staff */}
        <Card>
          <CardHeader><CardTitle>Staff Notes (Internal)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Staff Analysis">
              <textarea value={formData.staffAnalysis} onChange={set('staffAnalysis')} rows={3}
                placeholder="Staff analysis of feasibility, implications, etc..."
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 resize-y" />
            </FormField>
            <FormField label="Board Discussion Notes">
              <textarea value={formData.boardDiscussionNotes} onChange={set('boardDiscussionNotes')} rows={3}
                placeholder="Notes from board discussion sessions..."
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 resize-y" />
            </FormField>
          </CardContent>
        </Card>

        {/* Next Action & Tracking */}
        <Card>
          <CardHeader><CardTitle>Next Action &amp; Tracking</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Next Action">
              <input type="text" value={formData.nextAction} onChange={set('nextAction')}
                placeholder="What needs to happen next?"
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
            </FormField>
            <FormField label="Next Action Due">
              <input type="date" value={formData.nextActionDue} onChange={set('nextActionDue')}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
            </FormField>
            <FormField label="Tags" hint="Comma-separated">
              <input type="text" value={formData.tags} onChange={set('tags')}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
            </FormField>
            <FormField label="External Links" hint="One URL per line">
              <textarea value={formData.externalLinks} onChange={set('externalLinks')} rows={2}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 resize-y" />
            </FormField>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3 justify-end">
          <Link href="/policy-ideas"><Button type="button" variant="outline">Cancel</Button></Link>
          <Button type="submit" disabled={submitting}>
            <Save size={15} />
            {submitting ? 'Submitting…' : 'Submit Idea'}
          </Button>
        </div>
      </form>
    </div>
  )
}
