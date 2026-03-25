import { GOVERNANCE_LABEL_COLORS, GOVERNANCE_LABEL_DISPLAY } from '@/lib/constants'

interface GovernanceLabelProps {
  label: string
  className?: string
}

export function GovernanceLabel({ label, className = '' }: GovernanceLabelProps) {
  const colorClass =
    GOVERNANCE_LABEL_COLORS[label as keyof typeof GOVERNANCE_LABEL_COLORS] ??
    'bg-slate-100 text-slate-600'
  const display =
    GOVERNANCE_LABEL_DISPLAY[label as keyof typeof GOVERNANCE_LABEL_DISPLAY] ?? label

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass} ${className}`}
    >
      {display}
    </span>
  )
}
