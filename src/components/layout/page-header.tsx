import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  kicker?: string // small uppercase eyebrow above the title (e.g. "Briefing · Q2 2026")
}

/**
 * Commonwealth-style page header. Larger, more deliberate hierarchy:
 *   - kicker (optional): uppercase monospace eyebrow in muted blue
 *   - title:   24 px navy, tight tracking
 *   - description: calm secondary ink
 * Anchored beneath a thin navy rule to frame the page like a briefing slide.
 */
export function PageHeader({ title, description, actions, kicker }: PageHeaderProps) {
  return (
    <div className="mb-8 pb-6 border-b border-[var(--border)]">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="min-w-0">
          {kicker && (
            <p
              className="mb-2 font-mono text-[11px] uppercase"
              style={{
                color: 'var(--ma-navy)',
                letterSpacing: '0.12em',
                fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, monospace",
              }}
            >
              {kicker}
            </p>
          )}
          <h1
            className="text-[26px] sm:text-[28px] font-semibold tracking-tight leading-tight"
            style={{ color: 'var(--ma-navy-ink)' }}
          >
            {title}
          </h1>
          {description && (
            <p
              className="mt-2 text-[14px] leading-relaxed max-w-3xl"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
        )}
      </div>
    </div>
  )
}
