import { ReactNode } from 'react';

type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'outline'
  | 'destructive'
  | 'governance-staff'
  | 'governance-monitoring'
  | 'governance-board-idea'
  | 'governance-board-discussion'
  | 'governance-recommendation'
  | 'governance-archived';

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-800 text-white',
  secondary: 'bg-slate-100 text-slate-700',
  outline: 'border border-slate-300 text-slate-700 bg-transparent',
  destructive: 'bg-red-100 text-red-700',
  'governance-staff': 'bg-blue-100 text-blue-800',
  'governance-monitoring': 'bg-amber-100 text-amber-800',
  'governance-board-idea': 'bg-violet-100 text-violet-800',
  'governance-board-discussion': 'bg-indigo-100 text-indigo-800',
  'governance-recommendation': 'bg-emerald-100 text-emerald-800',
  'governance-archived': 'bg-slate-100 text-slate-500',
};

export function Badge({ variant = 'default', className = '', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
