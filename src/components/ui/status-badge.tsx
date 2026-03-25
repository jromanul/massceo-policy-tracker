import {
  LEGISLATIVE_STATUS_COLORS,
  LEGISLATIVE_STATUS_DISPLAY,
  BUDGET_STATUS_COLORS,
  BUDGET_STATUS_DISPLAY,
  HEARING_STATUS_COLORS,
  HEARING_STATUS_DISPLAY,
  POLICY_DISPOSITION_COLORS,
  POLICY_DISPOSITION_DISPLAY,
  BOARD_DISCUSSION_STATUS_COLORS,
  BOARD_DISCUSSION_STATUS_DISPLAY,
  AMENDMENT_STATUS_COLORS,
  AMENDMENT_STATUS_DISPLAY,
} from '@/lib/constants';

type StatusType =
  | 'legislative'
  | 'budget'
  | 'hearing'
  | 'policy'
  | 'boardDiscussion'
  | 'amendment';

interface StatusBadgeProps {
  status: string;
  type?: StatusType;
  className?: string;
}

function resolveColors(
  status: string,
  type: StatusType
): { colorClass: string; label: string } {
  switch (type) {
    case 'legislative':
      return {
        colorClass:
          LEGISLATIVE_STATUS_COLORS[status as keyof typeof LEGISLATIVE_STATUS_COLORS] ??
          'bg-slate-100 text-slate-600',
        label:
          LEGISLATIVE_STATUS_DISPLAY[status as keyof typeof LEGISLATIVE_STATUS_DISPLAY] ??
          status,
      };
    case 'budget':
      return {
        colorClass:
          BUDGET_STATUS_COLORS[status as keyof typeof BUDGET_STATUS_COLORS] ??
          'bg-slate-100 text-slate-600',
        label:
          BUDGET_STATUS_DISPLAY[status as keyof typeof BUDGET_STATUS_DISPLAY] ?? status,
      };
    case 'hearing':
      return {
        colorClass:
          HEARING_STATUS_COLORS[status as keyof typeof HEARING_STATUS_COLORS] ??
          'bg-slate-100 text-slate-600',
        label:
          HEARING_STATUS_DISPLAY[status as keyof typeof HEARING_STATUS_DISPLAY] ?? status,
      };
    case 'policy':
      return {
        colorClass:
          POLICY_DISPOSITION_COLORS[status as keyof typeof POLICY_DISPOSITION_COLORS] ??
          'bg-slate-100 text-slate-600',
        label:
          POLICY_DISPOSITION_DISPLAY[status as keyof typeof POLICY_DISPOSITION_DISPLAY] ??
          status,
      };
    case 'boardDiscussion':
      return {
        colorClass:
          BOARD_DISCUSSION_STATUS_COLORS[
            status as keyof typeof BOARD_DISCUSSION_STATUS_COLORS
          ] ?? 'bg-slate-100 text-slate-600',
        label:
          BOARD_DISCUSSION_STATUS_DISPLAY[
            status as keyof typeof BOARD_DISCUSSION_STATUS_DISPLAY
          ] ?? status,
      };
    case 'amendment':
      return {
        colorClass:
          AMENDMENT_STATUS_COLORS[status as keyof typeof AMENDMENT_STATUS_COLORS] ??
          'bg-slate-100 text-slate-600',
        label:
          AMENDMENT_STATUS_DISPLAY[status as keyof typeof AMENDMENT_STATUS_DISPLAY] ??
          status,
      };
    default:
      return { colorClass: 'bg-slate-100 text-slate-600', label: status };
  }
}

export function StatusBadge({
  status,
  type = 'legislative',
  className = '',
}: StatusBadgeProps) {
  const { colorClass, label } = resolveColors(status, type);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass} ${className}`}
    >
      {label}
    </span>
  );
}
