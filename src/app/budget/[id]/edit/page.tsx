'use client'

import { FormEvent, useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  BUDGET_STATUS_OPTIONS,
  BUDGET_SOURCE_STAGES,
  BOARD_DISCUSSION_STATUS_OPTIONS,
} from '@/lib/constants'
import { Save, X } from 'lucide-react'

interface BudgetFormData {
  name: string
  fiscalYear: string
  sourceStage: string
  proposedAmount: string
  adoptedAmount: string
  priorYearAmount: string
  accountLine: string
  status: string
  description: string
  notes: string
  boardDiscussionStatus: string
  tags: string
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

export default function BudgetEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [formData, setFormData] = useState<BudgetFormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/budget/${id}`)
      .then((r) => r.json())
      .then((json) => {
        const item = json.data ?? json
        setFormData({
          name: item.name ?? '',
          fiscalYear: item.fiscalYear ? String(item.fiscalYear) : '',
          sourceStage: item.sourceStage ?? 'GOVERNOR',
          proposedAmount: item.proposedAmount != null ? String(item.proposedAmount) : '',
          adoptedAmount: item.adoptedAmount != null ? String(item.adoptedAmount) : '',
          priorYearAmount: item.priorYearAmount != null ? String(item.priorYearAmount) : '',
          accountLine: item.accountLine ?? '',
          status: item.status ?? 'PROPOSED',
          description: item.description ?? '',
          notes: item.notes ?? '',
          boardDiscussionStatus: item.boardDiscussionStatus ?? 'NOT_DISCUSSED',
          tags: Array.isArray(item.tags) ? item.tags.map((t: { name: string }) => t.name).join(', ') : '',
        })
      })
      .catch(() => setError('Failed to load budget item.'))
      .finally(() => setLoading(false))
  }, [id])

  const set = (key: keyof BudgetFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setFormData((prev) => prev ? { ...prev, [key]: e.target.value } : prev)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!formData) return
    setSubmitting(true)
    setError(null)

    const payload = {
      ...formData,
      fiscalYear: formData.fiscalYear ? parseInt(formData.fiscalYear) : null,
      proposedAmount: formData.proposedAmount ? parseFloat(formData.proposedAmount) : null,
      adoptedAmount: formData.adoptedAmount ? parseFloat(formData.adoptedAmount) : null,
      priorYearAmount: formData.priorYearAmount ? parseFloat(formData.priorYearAmount) : null,
      tags: formData.tags ? formData.tags.split(',').map((s) => s.trim()).filter(Boolean) : [],
    }

    try {
      const res = await fetch(`/api/budget/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        router.push(`/budget/${id}`)
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
  if (!formData) return <div className="py-12 text-center text-sm text-red-500">Failed to load item.</div>

  return (
    <div className="space-y-5 max-w-4xl">
      <Breadcrumbs items={[{ label: 'Budget', href: '/budget' }, { label: formData.name, href: `/budget/${id}` }, { label: 'Edit' }]} />
      <PageHeader title="Edit Budget Item" actions={
        <Link href={`/budget/${id}`}><Button variant="outline" size="sm"><X size={15} />Cancel</Button></Link>
      } />

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <FormField label="Name" required>
                <input type="text" value={formData.name} onChange={set('name')} required
                  className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
              </FormField>
            </div>
            <FormField label="Fiscal Year" required>
              <input type="number" value={formData.fiscalYear} onChange={set('fiscalYear')} required
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
            </FormField>
            <FormField label="Budget Stage" required>
              <select value={formData.sourceStage} onChange={set('sourceStage')} required
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500">
                {BUDGET_SOURCE_STAGES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </FormField>
            <FormField label="Account Line">
              <input type="text" value={formData.accountLine} onChange={set('accountLine')}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Amounts</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Proposed Amount ($)">
              <input type="number" value={formData.proposedAmount} onChange={set('proposedAmount')}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
            </FormField>
            <FormField label="Adopted Amount ($)">
              <input type="number" value={formData.adoptedAmount} onChange={set('adoptedAmount')}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
            </FormField>
            <FormField label="Prior Year Amount ($)">
              <input type="number" value={formData.priorYearAmount} onChange={set('priorYearAmount')}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Status</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Status" required>
              <select value={formData.status} onChange={set('status')} required
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500">
                {BUDGET_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </FormField>
            <FormField label="Board Discussion Status">
              <select value={formData.boardDiscussionStatus} onChange={set('boardDiscussionStatus')}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500">
                {BOARD_DISCUSSION_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Description &amp; Notes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Description">
              <textarea value={formData.description} onChange={set('description')} rows={3}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 resize-y" />
            </FormField>
            <FormField label="Staff Notes">
              <textarea value={formData.notes} onChange={set('notes')} rows={3}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 resize-y" />
            </FormField>
            <FormField label="Tags" hint="Comma-separated">
              <input type="text" value={formData.tags} onChange={set('tags')}
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
            </FormField>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3 justify-end">
          <Link href={`/budget/${id}`}><Button type="button" variant="outline">Cancel</Button></Link>
          <Button type="submit" disabled={submitting}>
            <Save size={15} />
            {submitting ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}
