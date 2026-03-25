import { PRIORITY_COLORS, PRIORITY_DISPLAY } from '@/lib/constants';

interface PriorityBadgeProps {
  priority: string;
  className?: string;
  showIcon?: boolean;
}

export function PriorityBadge({
  priority,
  className = '',
  showIcon = false,
}: PriorityBadgeProps) {
  const colorClass =
    PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] ??
    'bg-slate-100 text-slate-600';
  const label =
    PRIORITY_DISPLAY[priority as keyof typeof PRIORITY_DISPLAY] ?? priority;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass} ${className}`}
    >
      {showIcon && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-current opacity-70 shrink-0"
          aria-hidden="true"
        />
      )}
      {label}
    </span>
  );
}
