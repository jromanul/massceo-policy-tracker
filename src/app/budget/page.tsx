'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { SearchInput } from '@/components/ui/search-input'
import { StatusBadge } from '@/components/ui/status-badge'
import { FilterBar } from '@/components/shared/filter-bar'
import { EmptyState } from '@/components/shared/empty-state'
import { Pagination } from '@/components/shared/pagination'
import {
  BUDGET_STATUS_OPTIONS,
  BUDGET_SOURCE_STAGES,
} from '@/lib/constants'
import { formatDate, formatCurrency, truncate } from '@/lib/utils'
import { SourceLabel } from '@/components/shared/source-label'
import { Plus, DollarSign, TrendingUp, BarChart3, Layers } from 'lucide-react'

interface BudgetItem {
  id: number
  name: string
  fiscalYear: number | null
  sourceStage: string
  proposedAmount: string | number | null
  adoptedAmount: string | number | null
  status: string
  priority: string
  updatedAt: string
  lastActionDate: string | null
  dataSource?: string
}

interface BudgetHighlights {
  totalProposed: number | null
  totalAdopted: number | null
  byStage: Record<string, number>
  priorYearTotal: number | null
}

interface BudgetResponse {
  items: BudgetItem[]
  total: number
  page: number
  pageSize: number
  pageCount: number
  highlights?: BudgetHighlights
}

const PAGE_SIZE = 25
const CURRENT_FY = 2027

function HighlightCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'slate',
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ElementType
  color?: string
}) {
  const colorMap: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
  }
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0 ${colorMap[color]}`}>
            <Icon size={18} />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500">{title}</p>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function BudgetListPage() {
  const [data, setData] = useState<BudgetResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [fiscalYear, setFiscalYear] = useState('')
  const [sourceStage, setSourceStage] = useState('')
  const [status, setStatus] = useState('')
  const [contentClass, setContentClass] = useState('')
  const [page, setPage] = useState(1)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (fiscalYear) params.set('fiscalYear', fiscalYear)
    if (sourceStage) params.set('sourceStage', sourceStage)
    if (status) params.set('status', status)
    if (contentClass) params.set('contentClass', contentClass)
    params.set('page', String(page))
    params.set('pageSize', String(PAGE_SIZE))

    try {
      const res = await fetch(`/api/budget?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setData(json.data ?? json)
      }
    } finally {
      setLoading(false)
    }
  }, [search, fiscalYear, sourceStage, status, contentClass, page])

  useEffect(() => { fetchData() }, [fetchData])

  const handleFilterChange = (key: string, value: string) => {
    setPage(1)
    if (key === 'fiscalYear') setFiscalYear(value)
    if (key === 'sourceStage') setSourceStage(value)
    if (key === 'status') setStatus(value)
    if (key === 'contentClass') setContentClass(value)
  }

  const highlights = data?.highlights
  const totalProposed = highlights?.totalProposed
  const totalAdopted = highlights?.totalAdopted
  const delta = totalProposed != null && highlights?.priorYearTotal != null
    ? totalProposed - highlights.priorYearTotal
    : null
  const stageCount = highlights?.byStage ? Object.keys(highlights.byStage).length : 0

  const columns: ColumnDef<BudgetItem, unknown>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <Link href={`/budget/${row.original.id}`} className="font-medium text-slate-800 hover:underline">
          {truncate(row.original.name, 55)}
        </Link>
      ),
    },
    {
      accessorKey: 'fiscalYear',
      header: 'FY',
      cell: ({ getValue }) => (
        <span className="text-sm text-slate-700">
          {getValue() ? `FY${getValue()}` : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'sourceStage',
      header: 'Stage',
      cell: ({ getValue }) => {
        const stage = getValue() as string
        const label = BUDGET_SOURCE_STAGES.find((s) => s.value === stage)?.label ?? stage
        return <span className="text-sm text-slate-600">{label}</span>
      },
    },
    {
      accessorKey: 'proposedAmount',
      header: 'Proposed',
      cell: ({ getValue }) => (
        <span className="text-sm font-mono text-slate-700">{formatCurrency(getValue() as number)}</span>
      ),
    },
    {
      accessorKey: 'adoptedAmount',
      header: 'Adopted',
      cell: ({ getValue }) => (
        <span className="text-sm font-mono text-slate-700">{formatCurrency(getValue() as number)}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => (
        <StatusBadge status={getValue() as string} type="budget" />
      ),
    },
    {
      accessorKey: 'dataSource',
      header: 'Source',
      cell: ({ getValue }) => {
        const ds = getValue() as string | undefined
        return ds ? <SourceLabel dataSource={ds} /> : null
      },
    },
    {
      accessorKey: 'lastActionDate',
      header: 'Last Action',
      cell: ({ row }) => {
        const date = row.original.lastActionDate
        return (
          <span className="text-xs text-slate-500 whitespace-nowrap">
            {date ? formatDate(date) : '—'}
          </span>
        )
      },
    },
  ]

  const fyOptions = [2025, 2026, 2027, 2028].map((y) => ({ label: `FY${y}`, value: String(y) }))
  const items = data?.items ?? []

  return (
    <div className="space-y-5">
      <PageHeader
        title="Budget Items"
        description="Track MassCEO budget line items across fiscal years and budget stages."
        actions={
          <Link href="/budget/new">
            <Button size="sm">
              <Plus size={16} />
              Add Budget Item
            </Button>
          </Link>
        }
      />

      {/* Highlights */}
      {fiscalYear && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <HighlightCard
            title={`Proposed (FY${fiscalYear})`}
            value={formatCurrency(totalProposed)}
            icon={DollarSign}
            color="blue"
          />
          <HighlightCard
            title={`Adopted (FY${fiscalYear})`}
            value={formatCurrency(totalAdopted)}
            icon={BarChart3}
            color="green"
          />
          <HighlightCard
            title="vs. Prior Year"
            value={delta !== null ? (delta >= 0 ? `+${formatCurrency(delta)}` : formatCurrency(delta)) : '—'}
            icon={TrendingUp}
            color={delta !== null && delta >= 0 ? 'green' : 'orange'}
          />
          <HighlightCard
            title="Line Items"
            value={String(data?.total ?? items.length)}
            subtitle={`FY${fiscalYear}`}
            icon={Layers}
            color="slate"
          />
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <SearchInput
            placeholder="Search budget items..."
            onChange={(val) => { setSearch(val); setPage(1) }}
            className="flex-1 max-w-md"
          />
        </div>
        <FilterBar
          filters={[
            { key: 'fiscalYear', label: 'Fiscal Year', options: fyOptions },
            { key: 'sourceStage', label: 'Stage', options: BUDGET_SOURCE_STAGES as { label: string; value: string }[] },
            { key: 'status', label: 'Status', options: BUDGET_STATUS_OPTIONS as { label: string; value: string }[] },
          ]}
          values={{ fiscalYear, sourceStage, status }}
          onChange={handleFilterChange}
          onClear={() => { setFiscalYear(''); setSourceStage(''); setStatus(''); setContentClass(''); setPage(1) }}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">Loading…</div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No budget items found"
          description="Try adjusting your filters or add a new budget item."
          icon={<DollarSign size={48} />}
          action={<Link href="/budget/new"><Button size="sm" variant="outline">Add Budget Item</Button></Link>}
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
