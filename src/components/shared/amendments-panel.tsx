'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import {
  AMENDMENT_TYPE_DISPLAY,
  AMENDMENT_STATUS_OPTIONS,
  AMENDMENT_TYPE_OPTIONS,
  BUDGET_SOURCE_STAGES,
  CHAMBER_OPTIONS,
} from '@/lib/constants'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Plus, FileEdit } from 'lucide-react'

interface AmendmentItem {
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
}

interface AmendmentsPanelProps {
  amendments: AmendmentItem[]
  parentType: 'budget' | 'legislation'
  parentId: number
}

export function AmendmentsPanel({ amendments, parentType, parentId }: AmendmentsPanelProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    title: '',
    amendmentNumber: '',
    type: 'AMENDMENT',
    description: '',
    filedBy: '',
    stage: '',
    chamber: '',
    amount: '',
    status: 'FILED',
    statusDate: '',
    eoRelevanceNotes: '',
    sourceUrl: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        type: form.type,
        status: form.status,
      }
      if (form.amendmentNumber) payload.amendmentNumber = form.amendmentNumber
      if (form.description) payload.description = form.description
      if (form.filedBy) payload.filedBy = form.filedBy
      if (form.stage) payload.stage = form.stage
      if (form.chamber) payload.chamber = form.chamber
      if (form.amount) payload.amount = parseFloat(form.amount)
      if (form.statusDate) payload.statusDate = form.statusDate
      if (form.eoRelevanceNotes) payload.eoRelevanceNotes = form.eoRelevanceNotes
      if (form.sourceUrl) payload.sourceUrl = form.sourceUrl

      if (parentType === 'budget') payload.budgetItemId = parentId
      else payload.legislativeItemId = parentId

      const res = await fetch('/api/amendments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setForm({
          title: '', amendmentNumber: '', type: 'AMENDMENT', description: '',
          filedBy: '', stage: '', chamber: '', amount: '', status: 'FILED',
          statusDate: '', eoRelevanceNotes: '', sourceUrl: '',
        })
        setShowForm(false)
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  const stageLabel = (stage: string | null) => {
    if (!stage) return null
    return BUDGET_SOURCE_STAGES.find((s) => s.value === stage)?.label ?? stage
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {amendments.length === 0
            ? 'No amendments or earmarks recorded.'
            : `${amendments.length} amendment${amendments.length !== 1 ? 's' : ''} / earmark${amendments.length !== 1 ? 's' : ''}`}
        </p>
        <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : <><Plus size={14} /> Add</>}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Amendment #</label>
              <input
                type="text"
                value={form.amendmentNumber}
                onChange={(e) => setForm({ ...form, amendmentNumber: e.target.value })}
                placeholder="e.g. Amendment 123"
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              >
                {AMENDMENT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Filed By</label>
              <input
                type="text"
                value={form.filedBy}
                onChange={(e) => setForm({ ...form, filedBy: e.target.value })}
                placeholder="Legislator name(s)"
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Stage</label>
              <select
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              >
                <option value="">—</option>
                {BUDGET_SOURCE_STAGES.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Chamber</label>
              <select
                value={form.chamber}
                onChange={(e) => setForm({ ...form, chamber: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              >
                <option value="">—</option>
                {CHAMBER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Amount</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="Dollar amount"
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              >
                {AMENDMENT_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Status Date</label>
              <input
                type="date"
                value={form.statusDate}
                onChange={(e) => setForm({ ...form, statusDate: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Source URL</label>
              <input
                type="url"
                value={form.sourceUrl}
                onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">EO Relevance Notes</label>
            <textarea
              value={form.eoRelevanceNotes}
              onChange={(e) => setForm({ ...form, eoRelevanceNotes: e.target.value })}
              placeholder="Why this amendment matters for employee ownership..."
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              rows={2}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={saving || !form.title.trim()}>
              {saving ? 'Saving...' : 'Save Amendment'}
            </Button>
          </div>
        </form>
      )}

      {amendments.length > 0 && (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">#</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Title</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Filed By</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Stage</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {amendments.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{a.amendmentNumber ?? '—'}</td>
                  <td className="px-3 py-2">
                    <div className="text-slate-800 font-medium">{a.title}</div>
                    {a.eoRelevanceNotes && (
                      <div className="text-xs text-slate-500 mt-0.5">{a.eoRelevanceNotes}</div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${a.type === 'EARMARK' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
                      {AMENDMENT_TYPE_DISPLAY[a.type as keyof typeof AMENDMENT_TYPE_DISPLAY] ?? a.type}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{a.filedBy ?? '—'}</td>
                  <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                    {a.amount != null ? formatCurrency(a.amount) : '—'}
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={a.status} type="amendment" />
                  </td>
                  <td className="px-3 py-2 text-slate-600 text-xs">{stageLabel(a.stage) ?? '—'}</td>
                  <td className="px-3 py-2 text-slate-500 text-xs whitespace-nowrap">
                    {a.statusDate ? formatDate(a.statusDate) : formatDate(a.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
