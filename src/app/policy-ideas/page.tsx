'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { SearchInput } from '@/components/ui/search-input'
import { StatusBadge } from '@/components/ui/status-badge'
import { FilterBar, FilterToggle } from '@/components/shared/filter-bar'
import { EmptyState } from '@/components/shared/empty-state'
import { Pagination } from '@/components/shared/pagination'
import { POLICY_DISPOSITION_OPTIONS } from '@/lib/constants'
import { formatDate, truncate } from '@/lib/utils'
import { SourceLabel } from '@/components/shared/source-label'
import { Plus, Lightbulb, Info } from 'lucide-react'

interface PolicyIdea {
  id: number
  title: string
  issueArea: string | null
  disposition: string
  nextAction: string | null
  createdAt: string
  isArchived: boolean
  dataSource?: string
}

interface PolicyIdeasResponse {
  items: PolicyIdea[]
  total: number
  page: number
  pageSize: number
  pageCount: number
}

const PAGE_SIZE = 25

const ISSUE_AREA_OPTIONS = [
  'Worker Ownership',
  'Tax Policy',
  'Capital Access',
  'Technical Assistance',
  'Workforce Development',
  'Other',
].map((v) => ({ label: v, value: v }))

export default function PolicyIdeasListPage() {
  const [data, setData] = useState<PolicyIdeasResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [disposition, setDisposition] = useState('')
  const [issueArea, setIssueArea] = useState('')
  const [contentClass, setContentClass] = useState('')
  const [archived, setArchived] = useState(false)
  const [page, setPage] = useState(1)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (disposition) params.set('disposition', disposition)
    if (issueArea) params.set('issueArea', issueArea)
    if (contentClass) params.set('contentClass', contentClass)
    params.set('archived', archived ? 'true' : 'false')
    params.set('page', String(page))
    params.set('pageSize', String(PAGE_SIZE))

    try {
      const res = await fetch(`/api/policy-ideas?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setData(json.data ?? json)
      }
    } finally {
      setLoading(false)
    }
  }, [search, disposition, issueArea, contentClass, archived, page])

  useEffect(() => { fetchData() }, [fetchData])

  const handleFilterChange = (key: string, value: string) => {
    setPage(1)
    if (key === 'disposition') setDisposition(value)
    if (key === 'issueArea') setIssueArea(value)
    if (key === 'contentClass') setContentClass(value)
  }

  const columns: ColumnDef<PolicyIdea, unknown>[] = [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <Link href={`/policy-ideas/${row.original.id}`} className="font-medium text-slate-800 hover:underline">
          {truncate(row.original.title, 60)}
        </Link>
      ),
    },
    {
      accessorKey: 'issueArea',
      header: 'Issue Area',
      cell: ({ getValue }) => (
        <span className="text-sm text-slate-600">{getValue() as string || '—'}</span>
      ),
    },
    {
      accessorKey: 'updatedAt',
      header: 'Last Action',
      cell: ({ getValue }) => (
        <span className="text-sm text-slate-500 whitespace-nowrap">{formatDate(getValue() as string)}</span>
      ),
    },
    {
      accessorKey: 'disposition',
      header: 'Disposition',
      cell: ({ getValue }) => <StatusBadge status={getValue() as string} type="policy" />,
    },
    {
      accessorKey: 'nextAction',
      header: 'Next Action',
      cell: ({ getValue }) => (
        <span className="text-sm text-slate-600">{truncate(getValue() as string, 40) || '—'}</span>
      ),
    },
    {
      id: 'source',
      header: 'Source',
      cell: ({ row }) =>
        row.original.dataSource ? (
          <SourceLabel dataSource={row.original.dataSource} />
        ) : (
          <span className="text-sm text-slate-400">—</span>
        ),
    },
  ]

  const items = data?.items ?? []

  return (
    <div className="space-y-5">
      <PageHeader
        title="EOAB Policy Ideas"
        description="Policy ideas submitted by the Employee Ownership Advisory Board."
        actions={
          <Link href="/policy-ideas/new">
            <Button size="sm">
              <Plus size={16} />
              Submit Idea
            </Button>
          </Link>
        }
      />

      {/* Governance Notice */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <Info size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          This section contains policy ideas generated by the EOAB. Items here are not official positions
          unless explicitly marked as a <strong>Formal Recommendation</strong>.
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <SearchInput
          placeholder="Search policy ideas..."
          onChange={(val) => { setSearch(val); setPage(1) }}
          className="max-w-md"
        />
        <FilterBar
          filters={[
            { key: 'disposition', label: 'Disposition', options: POLICY_DISPOSITION_OPTIONS as { label: string; value: string }[] },
            { key: 'issueArea', label: 'Issue Area', options: ISSUE_AREA_OPTIONS },
          ]}
          values={{ disposition, issueArea }}
          onChange={handleFilterChange}
          onClear={() => { setDisposition(''); setIssueArea(''); setContentClass(''); setArchived(false); setPage(1) }}
        />
        <FilterToggle
          label="Show archived"
          checked={archived}
          onChange={(val) => { setArchived(val); setPage(1) }}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">Loading…</div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No policy ideas found"
          description="Policy ideas are submitted by EOAB members and staff. Use 'Submit Idea' above to add a new policy proposal."
          icon={<Lightbulb size={48} />}
          action={<Link href="/policy-ideas/new"><Button size="sm" variant="outline">Submit Idea</Button></Link>}
        />
      ) : (
        <>
          <DataTable columns={columns} data={items} />
          <Pagination
            page={page}
            pageCount={data?.pageCount ?? 1}
            total={data?.total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}
