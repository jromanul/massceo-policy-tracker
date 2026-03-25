'use client'

import { Suspense, useState, useCallback, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
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
import {
  JURISDICTION_OPTIONS,
  LEGISLATIVE_STATUS_OPTIONS,
  CHAMBER_OPTIONS,
  TRACKING_TIER_OPTIONS,
  resolveCommitteeName,
} from '@/lib/constants'
import { formatDate, truncate } from '@/lib/utils'
import { ExternalLink, Plus, ScrollText } from 'lucide-react'

const SOURCE_LABELS: Record<string, { label: string; short: string }> = {
  MA_LEGISLATURE: { label: 'MA Legislature', short: 'malegislature.gov' },
  CONGRESS_GOV: { label: 'Congress.gov', short: 'congress.gov' },
  CSV_IMPORT: { label: 'CSV Import', short: 'CSV' },
  JSON_IMPORT: { label: 'JSON Import', short: 'JSON' },
  MANUAL: { label: 'Manual', short: 'Manual' },
  SEED: { label: 'Sample', short: 'Sample' },
}

interface LegislativeItem {
  id: number
  billNumber: string | null
  title: string
  jurisdiction: string
  status: string
  priority: string
  chamber: string | null
  committee: string | null
  updatedAt: string
  dataSource?: string
  sourceUrl?: string | null
}

interface LegislationResponse {
  items: LegislativeItem[]
  total: number
  page: number
  pageSize: number
  pageCount: number
}

const PAGE_SIZE = 25

export default function LegislationListPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-sm text-slate-500">Loading...</div>}>
      <LegislationListContent />
    </Suspense>
  )
}

function LegislationListContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [data, setData] = useState<LegislationResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [jurisdiction, setJurisdiction] = useState(searchParams.get('jurisdiction') ?? '')
  const [status, setStatus] = useState(searchParams.get('status') ?? '')
  const [chamber, setChamber] = useState(searchParams.get('chamber') ?? '')
  const [contentClass, setContentClass] = useState('')
  const [trackingTier, setTrackingTier] = useState(searchParams.get('trackingTier') ?? '')
  const [archived, setArchived] = useState(searchParams.get('archived') === 'true')

  const [page, setPage] = useState(Number(searchParams.get('page') ?? '1'))

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (jurisdiction) params.set('jurisdiction', jurisdiction)
    if (status) params.set('status', status)
    if (chamber) params.set('chamber', chamber)
    if (contentClass) params.set('contentClass', contentClass)
    if (trackingTier) params.set('trackingTier', trackingTier)

    if (archived) params.set('archived', 'all')
    params.set('page', String(page))
    params.set('pageSize', String(PAGE_SIZE))

    try {
      const res = await fetch(`/api/legislation?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setData(json.data ?? json)
      }
    } finally {
      setLoading(false)
    }
  }, [search, jurisdiction, status, chamber, contentClass, trackingTier, archived, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleFilterChange = (key: string, value: string) => {
    setPage(1)
    if (key === 'jurisdiction') setJurisdiction(value)
    if (key === 'status') setStatus(value)
    if (key === 'chamber') setChamber(value)
    if (key === 'contentClass') setContentClass(value)
    if (key === 'trackingTier') setTrackingTier(value)
  }

  const handleClearFilters = () => {
    setJurisdiction('')
    setStatus('')
    setChamber('')
    setContentClass('')
    setTrackingTier('')

    setArchived(false)
    setSearch('')
    setPage(1)
  }

  const columns: ColumnDef<LegislativeItem, unknown>[] = [
    {
      accessorKey: 'billNumber',
      header: 'Bill #',
      cell: ({ row }) => (
        <Link
          href={`/legislation/${row.original.id}`}
          className="font-medium text-slate-800 hover:underline whitespace-nowrap"
        >
          {row.original.billNumber ?? '—'}
        </Link>
      ),
    },
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <Link
          href={`/legislation/${row.original.id}`}
          className="hover:underline text-slate-700"
        >
          {truncate(row.original.title, 60)}
        </Link>
      ),
    },
    {
      accessorKey: 'jurisdiction',
      header: 'Jurisdiction',
      cell: ({ getValue }) => (
        <span className="text-slate-600 text-xs">
          {getValue() as string === 'MASSACHUSETTS' ? 'MA' : 'Federal'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => (
        <StatusBadge status={getValue() as string} type="legislative" />
      ),
    },
    {
      accessorKey: 'committee',
      header: 'Committee',
      cell: ({ getValue }) => (
        <span className="text-sm text-slate-600">{truncate(resolveCommitteeName(getValue() as string) ?? '', 40) || '—'}</span>
      ),
    },
    {
      accessorKey: 'dataSource',
      header: 'Source',
      cell: ({ row }) => {
        const ds = row.original.dataSource
        const url = row.original.sourceUrl
        const info = ds ? SOURCE_LABELS[ds] : undefined
        if (!info) return null
        if (url) {
          return (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              <ExternalLink size={11} />
              {info.short}
            </a>
          )
        }
        return <span className="text-xs text-slate-500">{info.label}</span>
      },
    },
    {
      accessorKey: 'updatedAt',
      header: 'Last Action',
      cell: ({ getValue }) => (
        <span className="text-sm text-slate-500 whitespace-nowrap">
          {formatDate(getValue() as string)}
        </span>
      ),
    },
  ]

  const items = data?.items ?? []

  return (
    <div className="space-y-5">
      <PageHeader
        title="Legislation"
        description="Track MA and federal legislation relevant to MassCEO."
        actions={
          <Link href="/legislation/new">
            <Button size="sm">
              <Plus size={16} />
              Add Bill
            </Button>
          </Link>
        }
      />

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <SearchInput
            placeholder="Search bills by title, number, or keyword..."
            defaultValue={search}
            onChange={(val) => { setSearch(val); setPage(1) }}
            className="flex-1 max-w-md"
          />
        </div>

        <FilterBar
          filters={[
            { key: 'jurisdiction', label: 'Jurisdiction', options: JURISDICTION_OPTIONS as { label: string; value: string }[] },
            { key: 'status', label: 'Status', options: LEGISLATIVE_STATUS_OPTIONS as { label: string; value: string }[] },
            { key: 'chamber', label: 'Chamber', options: CHAMBER_OPTIONS as { label: string; value: string }[] },
{ key: 'trackingTier', label: 'Tracking Tier', options: TRACKING_TIER_OPTIONS as { label: string; value: string }[] },
          ]}
          values={{ jurisdiction, status, chamber, trackingTier }}
          onChange={handleFilterChange}
          onClear={handleClearFilters}
        />
        <FilterToggle
          label="Include enacted / archived"
          checked={archived}
          onChange={(val) => { setArchived(val); setPage(1) }}
        />
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">Loading…</div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No legislation found"
          description="Try adjusting your filters or search terms, or add a new bill."
          icon={<ScrollText size={48} />}
          action={
            <Link href="/legislation/new">
              <Button size="sm" variant="outline">Add Bill</Button>
            </Link>
          }
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
