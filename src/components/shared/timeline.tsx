import { formatDate } from '@/lib/utils'
import { Clock } from 'lucide-react'

export interface TimelineEntry {
  id: number | string
  action: string
  description?: string | null
  createdAt: string | Date
  /** Alias for createdAt */
  date?: string | Date
}

interface TimelineProps {
  entries: TimelineEntry[]
  emptyMessage?: string
  className?: string
}

export function Timeline({
  entries,
  emptyMessage = 'No history entries yet.',
  className = '',
}: TimelineProps) {
  if (!entries || entries.length === 0) {
    return (
      <div className={`text-sm text-slate-500 py-6 text-center ${className}`}>
        {emptyMessage}
      </div>
    )
  }

  const sorted = [...entries].sort((a, b) => {
    const dateA = new Date(a.date ?? a.createdAt).getTime()
    const dateB = new Date(b.date ?? b.createdAt).getTime()
    return dateB - dateA
  })

  return (
    <ol className={`relative border-l border-slate-200 ml-3 space-y-6 ${className}`}>
      {sorted.map((entry) => {
        const displayDate = entry.date ?? entry.createdAt
        return (
          <li key={entry.id} className="ml-6">
            <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 ring-4 ring-white">
              <Clock size={12} className="text-slate-500" />
            </span>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-slate-900">{entry.action}</p>
                <time
                  dateTime={new Date(displayDate).toISOString()}
                  className="text-xs text-slate-400 shrink-0"
                >
                  {formatDate(displayDate)}
                </time>
              </div>
              {entry.description && (
                <p className="text-sm text-slate-600">{entry.description}</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
