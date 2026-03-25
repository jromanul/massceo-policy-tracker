import { ReactNode, ElementType } from 'react';
import { Button } from './button';

interface EmptyStateProps {
  icon?: ElementType;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 py-16 px-6 text-center ${className}`}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
          <Icon size={24} strokeWidth={1.5} />
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        {description && (
          <p className="text-sm text-slate-500 max-w-xs mx-auto">{description}</p>
        )}
      </div>
      {action && (
        <Button variant="outline" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
