'use client'

import { ShieldCheck, PenLine, FlaskConical } from 'lucide-react'
import { getContentClass, CONTENT_CLASS_CONFIG, type ContentClass } from '@/lib/source-metadata'

const BADGE_STYLES: Record<ContentClass, { color: string; icon: typeof ShieldCheck }> = {
  authoritative_external: {
    color: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    icon: ShieldCheck,
  },
  internal_manual: {
    color: 'bg-slate-100 text-slate-700',
    icon: PenLine,
  },
  sample_demo: {
    color: 'bg-amber-50 text-amber-700 border border-amber-200',
    icon: FlaskConical,
  },
}

interface ContentClassBadgeProps {
  dataSource: string
  compact?: boolean
}

export function ContentClassBadge({ dataSource, compact = true }: ContentClassBadgeProps) {
  const contentClass = getContentClass(dataSource)
  const config = CONTENT_CLASS_CONFIG[contentClass]
  const style = BADGE_STYLES[contentClass]
  const Icon = style.icon

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${style.color}`}>
        <Icon size={11} />
        {config.label}
      </span>
    )
  }

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${style.color}`}>
      <Icon size={12} />
      <span>{config.label}</span>
      <span className="text-[10px] opacity-70">— {config.description}</span>
    </div>
  )
}
