import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

export interface RelatedRecord {
  id: number | string
  title: string
  subtitle?: string | null
  href: string
  badge?: string | null
  badgeColor?: string
}

export interface RelatedRecordsGroup {
  label: string
  records: RelatedRecord[]
}

interface RelatedRecordsPanelProps {
  groups: RelatedRecordsGroup[]
}

export function RelatedRecordsPanel({ groups }: RelatedRecordsPanelProps) {
  const hasAny = groups.some((g) => g.records.length > 0)

  if (!hasAny) {
    return (
      <div className="text-sm text-slate-500 py-6 text-center">
        No related records linked.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        group.records.length > 0 && (
          <div key={group.label}>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              {group.label} ({group.records.length})
            </h4>
            <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
              {group.records.map((record) => (
                <li key={record.id}>
                  <Link
                    href={record.href}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate group-hover:text-slate-700">
                        {record.title}
                      </p>
                      {record.subtitle && (
                        <p className="text-xs text-slate-500 truncate">
                          {record.subtitle}
                        </p>
                      )}
                    </div>
                    {record.badge && (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${record.badgeColor ?? 'bg-slate-100 text-slate-600'}`}>
                        {record.badge}
                      </span>
                    )}
                    <ExternalLink size={13} className="text-slate-400 flex-shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )
      ))}
    </div>
  )
}
