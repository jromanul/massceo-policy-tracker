'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  total?: number
  pageSize?: number
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  total,
  pageSize,
}: PaginationProps) {
  if (pageCount <= 1) return null

  const startRecord = total && pageSize ? (page - 1) * pageSize + 1 : undefined
  const endRecord = total && pageSize ? Math.min(page * pageSize, total) : undefined

  const pages: number[] = []
  const maxVisible = 7
  if (pageCount <= maxVisible) {
    for (let i = 1; i <= pageCount; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push(-1) // ellipsis
    for (let i = Math.max(2, page - 1); i <= Math.min(pageCount - 1, page + 1); i++) {
      pages.push(i)
    }
    if (page < pageCount - 2) pages.push(-2) // ellipsis
    pages.push(pageCount)
  }

  return (
    <div className="flex items-center justify-between gap-4">
      {total !== undefined && startRecord !== undefined && (
        <span className="text-sm text-slate-500">
          {startRecord}–{endRecord} of {total}
        </span>
      )}
      <div className="flex items-center gap-1 ml-auto">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        {pages.map((p, i) =>
          p < 0 ? (
            <span key={`ellipsis-${i}`} className="px-2 text-slate-400">…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`min-w-[32px] px-2 py-1.5 text-sm rounded-md border transition-colors ${
                page === p
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          className="p-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
