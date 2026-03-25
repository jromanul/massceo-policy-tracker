'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { Pagination } from '@/components/shared/pagination'
import { formatDate, truncate } from '@/lib/utils'
import {
  Search,
  ScrollText,
  DollarSign,
  Lightbulb,
  FileText,
  Bookmark,
  AlertCircle,
  ArrowRight,
  X,
} from 'lucide-react'

interface KnowledgeItem {
  id: number
  title: string
  entryType: string
  excerpt: string | null
  content: string | null
  tags?: { id: number; name: string }[]
  relatedLegislation?: Array<{ id: number; billNumber: string | null; title: string }>
  relatedBudget?: Array<{ id: number; name: string }>
  relatedHearings?: Array<{ id: number; title: string }>
  relatedPolicyIdeas?: Array<{ id: number; title: string }>
  sourceItemType?: string | null
  sourceItemId?: number | null
  isUnresolved?: boolean
  isHandoffNote?: boolean
  createdAt: string
  updatedAt: string
}

interface KnowledgeResponse {
  items: KnowledgeItem[]
  total: number
  page: number
  pageSize: number
  pageCount: number
}

const PAGE_SIZE = 20

const TYPE_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Archived Legislation', value: 'ARCHIVED_LEGISLATION' },
  { label: 'Archived Budget', value: 'ARCHIVED_BUDGET' },
  { label: 'Policy Ideas', value: 'POLICY_IDEA' },
  { label: 'Notes', value: 'NOTE' },
  { label: 'Handoff Notes', value: 'HANDOFF_NOTE' },
  { label: 'Unresolved Questions', value: 'UNRESOLVED_QUESTION' },
  { label: 'Research', value: 'RESEARCH' },
]

const TYPE_ICON_MAP: Record<string, React.ElementType> = {
  ARCHIVED_LEGISLATION: ScrollText,
  ARCHIVED_BUDGET: DollarSign,
  POLICY_IDEA: Lightbulb,
  NOTE: FileText,
  HANDOFF_NOTE: Bookmark,
  UNRESOLVED_QUESTION: AlertCircle,
  RESEARCH: Search,
}

const TYPE_COLOR_MAP: Record<string, string> = {
  ARCHIVED_LEGISLATION: 'bg-blue-100 text-blue-700',
  ARCHIVED_BUDGET: 'bg-green-100 text-green-700',
  POLICY_IDEA: 'bg-violet-100 text-violet-700',
  NOTE: 'bg-slate-100 text-slate-600',
  HANDOFF_NOTE: 'bg-amber-100 text-amber-700',
  UNRESOLVED_QUESTION: 'bg-orange-100 text-orange-700',
  RESEARCH: 'bg-indigo-100 text-indigo-700',
}

function sourceHref(item: KnowledgeItem): string | null {
  if (!item.sourceItemId || !item.sourceItemType) return null
  const type = item.sourceItemType.toLowerCase()
  if (type.includes('legislation')) return `/legislation/${item.sourceItemId}`
  if (type.includes('budget')) return `/budget/${item.sourceItemId}`
  if (type.includes('hearing')) return `/hearings/${item.sourceItemId}`
  if (type.includes('policy')) return `/policy-ideas/${item.sourceItemId}`
  return null
}

function KnowledgeCard({ item }: { item: KnowledgeItem }) {
  const Icon = TYPE_ICON_MAP[item.entryType] ?? FileText
  const colorClass = TYPE_COLOR_MAP[item.entryType] ?? 'bg-slate-100 text-slate-600'
  const typeLabel = TYPE_OPTIONS.find((o) => o.value === item.entryType)?.label ?? item.entryType
  const src = sourceHref(item)

  return (
    <Card className={`${item.isUnresolved ? 'border-orange-200' : ''} ${item.isHandoffNote ? 'border-amber-200' : ''}`}>
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-md mt-0.5 ${colorClass}`}>
            <Icon size={15} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
                {typeLabel}
              </span>
              {item.isUnresolved && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700">
                  Unresolved
                </span>
              )}
              {item.isHandoffNote && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">
                  Handoff Note
                </span>
              )}
            </div>

            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              {src ? (
                <Link href={src} className="hover:underline">{item.title}</Link>
              ) : (
                item.title
              )}
            </h3>

            {(item.excerpt || item.content) && (
              <p className="text-sm text-slate-600 mb-2 leading-relaxed">
                {truncate(item.excerpt ?? item.content ?? '', 200)}
              </p>
            )}

            {/* Related links */}
            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
              {(item.relatedLegislation ?? []).slice(0, 2).map((l) => (
                <Link key={l.id} href={`/legislation/${l.id}`} className="flex items-center gap-1 hover:text-slate-700">
                  <ScrollText size={11} />
                  {l.billNumber ?? truncate(l.title, 25)}
                </Link>
              ))}
              {(item.relatedBudget ?? []).slice(0, 2).map((b) => (
                <Link key={b.id} href={`/budget/${b.id}`} className="flex items-center gap-1 hover:text-slate-700">
                  <DollarSign size={11} />
                  {truncate(b.name, 25)}
                </Link>
              ))}
              {(item.relatedHearings ?? []).slice(0, 2).map((h) => (
                <Link key={h.id} href={`/hearings/${h.id}`} className="flex items-center gap-1 hover:text-slate-700">
                  <ArrowRight size={11} />
                  {truncate(h.title, 25)}
                </Link>
              ))}
              {(item.relatedPolicyIdeas ?? []).slice(0, 2).map((p) => (
                <Link key={p.id} href={`/policy-ideas/${p.id}`} className="flex items-center gap-1 hover:text-slate-700">
                  <Lightbulb size={11} />
                  {truncate(p.title, 25)}
                </Link>
              ))}
            </div>

            <div className="mt-2 flex items-center gap-3 flex-wrap">
              <span className="text-xs text-slate-400">{formatDate(item.updatedAt)}</span>
              {src && item.sourceItemType && (
                <Link href={src} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  <ArrowRight size={10} />
                  Archived from {item.sourceItemType.replace(/_/g, ' ').toLowerCase()}
                </Link>
              )}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.tags.slice(0, 4).map((tag) => (
                    <span key={tag.id} className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-500">
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
              {src && !item.sourceItemType && (
                <Link href={src} className="ml-auto text-xs text-blue-600 hover:underline flex items-center gap-1">
                  View source <ArrowRight size={11} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function KnowledgePage() {
  const [data, setData] = useState<KnowledgeResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [entryType, setEntryType] = useState('')
  const [page, setPage] = useState(1)

  const inputRef = useRef<HTMLInputElement>(null)

  const fetchData = useCallback(async (q: string, type: string, p: number) => {
    setLoading(true)
    setSearched(true)
    const params = new URLSearchParams()
    if (q) params.set('search', q)
    if (type) params.set('entryType', type)
    params.set('page', String(p))
    params.set('pageSize', String(PAGE_SIZE))

    try {
      const res = await fetch(`/api/knowledge?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setData(json.data ?? json)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(search, entryType, page)
  }, [search, entryType, page, fetchData])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
    if (searchInput || entryType) {
      fetchData(searchInput, entryType, 1)
    }
  }

  const handleClear = () => {
    setSearchInput('')
    setSearch('')
    setEntryType('')
    setData(null)
    setSearched(false)
    setPage(1)
    inputRef.current?.focus()
  }

  const items = data?.items ?? []

  // Separate handoff notes and unresolved questions for prominence
  const handoffNotes = items.filter((i) => i.isHandoffNote || i.entryType === 'HANDOFF_NOTE')
  const unresolved = items.filter((i) => i.isUnresolved || i.entryType === 'UNRESOLVED_QUESTION')
  const regular = items.filter(
    (i) => !i.isHandoffNote && i.entryType !== 'HANDOFF_NOTE' && !i.isUnresolved && i.entryType !== 'UNRESOLVED_QUESTION',
  )

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Knowledge / Archive"
        description="Search across all tracked items, archived records, notes, handoff notes, and research."
      />

      {/* Search bar */}
      <form onSubmit={handleSearch} className="space-y-3">
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              ref={inputRef}
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search across all records — bills, budget, hearings, policy ideas, notes..."
              className="w-full pl-11 pr-4 py-3 text-base border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors shadow-sm"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-5 py-3 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Search
          </button>
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-slate-600">Filter by type:</span>
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setEntryType(opt.value)
                setPage(1)
                if (search || opt.value) fetchData(search, opt.value, 1)
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                entryType === opt.value
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
          {(search || entryType) && (
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X size={11} />
              Clear
            </button>
          )}
        </div>
      </form>

      {/* Results */}
      {!searched ? (
        <div className="py-16 text-center">
          <Search size={40} className="text-slate-200 mx-auto mb-4" />
          <h3 className="text-base font-medium text-slate-600 mb-1">Search the Knowledge Base</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            Search across all legislation, budget items, hearings, policy ideas, notes, handoff notes, and archived records.
          </p>
        </div>
      ) : loading ? (
        <div className="py-12 text-center text-sm text-slate-500">Searching…</div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-slate-500">No results found for your search.</p>
          <p className="text-xs text-slate-400 mt-1">Try different keywords or remove filters.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary */}
          <p className="text-sm text-slate-500">
            Found <strong>{data?.total ?? items.length}</strong> result{data?.total !== 1 ? 's' : ''}
            {search ? ` for "${search}"` : ''}
          </p>

          {/* Handoff Notes — prominently shown first */}
          {handoffNotes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Bookmark size={16} className="text-amber-500" />
                <h2 className="text-sm font-semibold text-slate-700">Handoff Notes ({handoffNotes.length})</h2>
              </div>
              <div className="space-y-3">
                {handoffNotes.map((item) => <KnowledgeCard key={item.id} item={item} />)}
              </div>
            </div>
          )}

          {/* Unresolved Questions — prominently shown */}
          {unresolved.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={16} className="text-orange-500" />
                <h2 className="text-sm font-semibold text-slate-700">Unresolved Questions ({unresolved.length})</h2>
              </div>
              <div className="space-y-3">
                {unresolved.map((item) => <KnowledgeCard key={item.id} item={item} />)}
              </div>
            </div>
          )}

          {/* Regular results */}
          {regular.length > 0 && (
            <div>
              {(handoffNotes.length > 0 || unresolved.length > 0) && (
                <h2 className="text-sm font-semibold text-slate-700 mb-3">Other Results ({regular.length})</h2>
              )}
              <div className="space-y-3">
                {regular.map((item) => <KnowledgeCard key={item.id} item={item} />)}
              </div>
            </div>
          )}

          {/* Pagination */}
          {(data?.pageCount ?? 1) > 1 && (
            <Pagination
              page={page}
              pageCount={data?.pageCount ?? 1}
              total={data?.total}
              pageSize={PAGE_SIZE}
              onPageChange={(p) => setPage(p)}
            />
          )}
        </div>
      )}
    </div>
  )
}
