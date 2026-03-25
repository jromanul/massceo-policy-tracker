import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 pb-5 border-b border-[var(--border)]">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] tracking-tight truncate">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-[var(--muted-foreground)] leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
      )}
    </div>
  )
}
