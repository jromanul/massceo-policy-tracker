'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { SearchInput } from '@/components/ui/search-input'
import { StatusBadge } from '@/components/ui/status-badge'
import { FilterBar, FilterSelect } from '@/components/shared/filter-bar'
import { EmptyState } from '@/components/shared/empty-state'
import { Pagination } from '@/components/shared/pagination'
import { HEARING_STATUS_OPTIONS, HEARING_TYPE_OPTIONS, JURISDICTION_OPTIONS, resolveCommitteeName } from '@/lib/constants'
import { formatDate, truncate } from '@/lib/utils'
import { SourceLabel } from '@/components/shared/source-label'
import { Plus, CalendarDays, List, Calendar } from 'lucide-react'

interface HearingItem {
  id: number
  title: string
  startDatetime: string
  endDatetime: string | null
  location: string | null
  committee: string | null
  jurisdiction: string
  hearingType: string
  status: string
  relatedBills?: string | null
  updatedAt: string
  dataSource?: string
}

interface HearingsResponse {
  items: HearingItem[]
  total: number
  page: number
  pageSize: number
  pageCount: number
}

const PAGE_SIZE = 25

type ViewMode = 'table' | 'calendar'

interface CalendarEvent {
  id: number
  title: string
  start: Date
  end: Date
  status: string
  resource: HearingItem
}

const STATUS_EVENT_COLORS: Record<string, string> = {
  UPCOMING: '#3b82f6',
  COMPLETED: '#22c55e',
  CANCELED: '#ef4444',
  MONITORING_ONLY: '#94a3b8',
}

// Simple monthly calendar grid component (no external dependency)
function MonthlyCalendar({
  events,
  onEventClick,
}: {
  events: CalendarEvent[]
  onEventClick: (id: number) => void
}) {
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const eventsForDay = (day: number) => {
    return events.filter((ev) => {
      const d = ev.start
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
    })
  }

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <button onClick={prevMonth} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 text-sm font-medium">
          ‹ Prev
        </button>
        <h3 className="text-base font-semibold text-slate-800">{monthName}</h3>
        <button onClick={nextMonth} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 text-sm font-medium">
          Next ›
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-slate-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="px-2 py-2 text-center text-xs font-semibold text-slate-500">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          const isToday =
            day !== null &&
            today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === day
          const dayEvents = day !== null ? eventsForDay(day) : []

          return (
            <div
              key={i}
              className="min-h-[90px] border-b border-r border-slate-100 p-1 last:border-r-0"
            >
              {day !== null && (
                <>
                  <div
                    className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday ? 'bg-slate-800 text-white' : 'text-slate-600'
                    }`}
                  >
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <button
                        key={ev.id}
                        onClick={() => onEventClick(ev.id)}
                        className="block w-full text-left px-1.5 py-0.5 rounded text-[11px] font-medium text-white truncate"
                        style={{ backgroundColor: STATUS_EVENT_COLORS[ev.status] ?? '#94a3b8' }}
                      >
                        {ev.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="text-[10px] text-slate-400 px-1">+{dayEvents.length - 3} more</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function HearingsListPage() {
  const [data, setData] = useState<HearingsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('table')

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [jurisdiction, setJurisdiction] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [hearingType, setHearingType] = useState('')
  const [contentClass, setContentClass] = useState('')
  const [page, setPage] = useState(1)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    if (jurisdiction) params.set('jurisdiction', jurisdiction)
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)
    if (hearingType) params.set('hearingType', hearingType)
    if (contentClass) params.set('contentClass', contentClass)
    params.set('page', String(page))
    params.set('pageSize', viewMode === 'calendar' ? '200' : String(PAGE_SIZE))

    try {
      const res = await fetch(`/api/hearings?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setData(json.data ?? json)
      }
    } finally {
      setLoading(false)
    }
  }, [search, status, jurisdiction, hearingType, dateFrom, dateTo, contentClass, page, viewMode])

  useEffect(() => { fetchData() }, [fetchData])

  const handleFilterChange = (key: string, value: string) => {
    setPage(1)
    if (key === 'status') setStatus(value)
    if (key === 'jurisdiction') setJurisdiction(value)
    if (key === 'hearingType') setHearingType(value)
    if (key === 'contentClass') setContentClass(value)
  }

  const calendarEvents: CalendarEvent[] = (data?.items ?? []).map((h) => ({
    id: h.id,
    title: h.title,
    start: new Date(h.startDatetime),
    end: h.endDatetime ? new Date(h.endDatetime) : new Date(new Date(h.startDatetime).getTime() + 2 * 60 * 60 * 1000),
    status: h.status,
    resource: h,
  }))

  const columns: ColumnDef<HearingItem, unknown>[] = [
    {
      accessorKey: 'startDatetime',
      header: 'Date',
      cell: ({ getValue }) => {
        const dt = new Date(getValue() as string)
        return (
          <div className="whitespace-nowrap">
            <p className="text-sm font-medium text-slate-800">{formatDate(dt)}</p>
            <p className="text-xs text-slate-500">
              {dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </p>
          </div>
        )
      },
    },
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <Link href={`/hearings/${row.original.id}`} className="font-medium text-slate-800 hover:underline">
          {truncate(row.original.title, 55)}
        </Link>
      ),
    },
    {
      accessorKey: 'hearingType',
      header: 'Type',
      cell: ({ getValue }) => (
        <span className="text-sm text-slate-600">{getValue() as string}</span>
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
      accessorKey: 'jurisdiction',
      header: 'Jurisdiction',
      cell: ({ getValue }) => (
        <span className="text-xs text-slate-600">{getValue() as string === 'MASSACHUSETTS' ? 'MA' : 'Federal'}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => <StatusBadge status={getValue() as string} type="hearing" />,
    },
    {
      id: 'relatedBills',
      header: 'Related Bills',
      cell: ({ row }) => (
        <span className="text-xs text-slate-500">{truncate(row.original.relatedBills, 30) || '—'}</span>
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
  ]

  const items = data?.items ?? []

  return (
    <div className="space-y-5">
      <PageHeader
        title="Hearings &amp; Calendar"
        description="Track legislative hearings, committee sessions, and key events."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-slate-300 rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'table' ? 'bg-slate-800 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <List size={15} />
                Table
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'calendar' ? 'bg-slate-800 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Calendar size={15} />
                Calendar
              </button>
            </div>
            <Link href="/hearings/new">
              <Button size="sm">
                <Plus size={16} />
                Add Event
              </Button>
            </Link>
          </div>
        }
      />

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <SearchInput
            placeholder="Search hearings..."
            onChange={(val) => { setSearch(val); setPage(1) }}
            className="flex-1 max-w-md"
          />
        </div>
        <FilterBar>
          <FilterSelect
            label="Status"
            value={status}
            onChange={(val) => handleFilterChange('status', val)}
            options={HEARING_STATUS_OPTIONS as { label: string; value: string }[]}
          />
          <FilterSelect
            label="Jurisdiction"
            value={jurisdiction}
            onChange={(val) => handleFilterChange('jurisdiction', val)}
            options={JURISDICTION_OPTIONS as { label: string; value: string }[]}
          />
          <FilterSelect
            label="Type"
            value={hearingType}
            onChange={(val) => handleFilterChange('hearingType', val)}
            options={HEARING_TYPE_OPTIONS as { label: string; value: string }[]}
          />
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-600">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
              className="text-sm border border-slate-300 rounded-md bg-white text-slate-700 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-600">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
              className="text-sm border border-slate-300 rounded-md bg-white text-slate-700 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>
          {(status || jurisdiction || hearingType || dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => { setStatus(''); setJurisdiction(''); setHearingType(''); setContentClass(''); setDateFrom(''); setDateTo(''); setPage(1) }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-slate-500 hover:text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
            >
              Clear
            </button>
          )}
        </FilterBar>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">Loading…</div>
      ) : viewMode === 'calendar' ? (
        <MonthlyCalendar
          events={calendarEvents}
          onEventClick={(id) => window.location.href = `/hearings/${id}`}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="No hearings found"
          description="Try adjusting your filters or add a new event."
          icon={<CalendarDays size={48} />}
          action={<Link href="/hearings/new"><Button size="sm" variant="outline">Add Event</Button></Link>}
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
