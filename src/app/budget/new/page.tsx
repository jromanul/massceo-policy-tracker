'use client'

import { FormEvent, useState } from 'react'
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

const defaultForm: BudgetFormData = {
  name: '',
  fiscalYear: '2027',
  sourceStage: 'GOVERNOR',
  proposedAmount: '',
  adoptedAmount: '',
  priorYearAmount: '',
  accountLine: '',
  status: 'PROPOSED',
  description: '',
  notes: '',
  boardDiscussionStatus: 'NOT_DISCUSSED',
  tags: '',
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

export default function BudgetNewPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<BudgetFormData>(defaultForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof BudgetFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setFormData((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
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
      const res = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const json = await res.json()
        router.push(`/budget/${json.data?.id ?? json.id}`)
      } else {
        const json = await res.json()
        setError(json.error ?? 'Failed to create budget item.')
      }
    } catch {
      setError('An unexpected error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <Breadcrumbs items={[{ label: 'Budget', href: '/budget' }, { label: 'New Item' }]} />

      <PageHeader
        title="Add Budget Item"
        actions={
          <Link href="/budget">
            <Button variant="outline" size="sm"><X size={15} />Cancel</Button>
          </Link>
        }
      />

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic */}
        <Card>
          <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <FormField label="Name" required>
                <input type="text" value={formData.name} onChange={set('name')} required
                  placeholder="Budget line item name"
                  className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
              </FormField>
            </div>
            <FormField label="Fiscal Year" required>
              <input type="number" value={formData.fiscalYear} onChange={set('fiscalYear')} required
                placeholder="2027"
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
            </FormField>
            <FormField label="Budget Stage" required>
              <select value={formData.sourceStage} onChange={set('sourceStage')} required
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500">
                {BUDGET_SOURCE_STAGES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </FormField>
            <FormField label="Account Line" hint="e.g. 7002-0010">
              <input type="text" value={formData.accountLine} onChange={set('accountLine')}
                placeholder="0000-0000"
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
            </FormField>
          </CardContent>
        </Card>

        {/* Amounts */}
        <Card>
          <CardHeader><CardTitle>Amounts</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Proposed Amount ($)">
              <input type="number" value={formData.proposedAmount} onChange={set('proposedAmount')}
                placeholder="0"
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
            </FormField>
            <FormField label="Adopted Amount ($)">
              <input type="number" value={formData.adoptedAmount} onChange={set('adoptedAmount')}
                placeholder="0"
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
            </FormField>
            <FormField label="Prior Year Amount ($)">
              <input type="number" value={formData.priorYearAmount} onChange={set('priorYearAmount')}
                placeholder="0"
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
            </FormField>
          </CardContent>
        </Card>

        {/* Status */}
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

        {/* Description & Notes */}
        <Card>
          <CardHeader><CardTitle>Description &amp; Notes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Description">
              <textarea value={formData.description} onChange={set('description')} rows={3}
                placeholder="What does this line item fund?"
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 resize-y" />
            </FormField>
            <FormField label="Staff Notes">
              <textarea value={formData.notes} onChange={set('notes')} rows={3}
                placeholder="Internal tracking notes..."
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 resize-y" />
            </FormField>
            <FormField label="Tags" hint="Comma-separated">
              <input type="text" value={formData.tags} onChange={set('tags')}
                placeholder="EO, Worker Ownership"
                className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
            </FormField>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3 justify-end">
          <Link href="/budget"><Button type="button" variant="outline">Cancel</Button></Link>
          <Button type="submit" disabled={submitting}>
            <Save size={15} />
            {submitting ? 'Saving…' : 'Save Item'}
          </Button>
        </div>
      </form>
    </div>
  )
}
