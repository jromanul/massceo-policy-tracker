// ─── Class Name Merger ────────────────────────────────────────────────────────

/**
 * Merges class name strings, filtering out falsy values.
 * Lightweight alternative to clsx/classnames — no external dependency needed.
 */
export function cn(
  ...classes: (string | undefined | null | false | 0)[]
): string {
  return classes.filter(Boolean).join(' ')
}

// ─── Budget Item Narrative ────────────────────────────────────────────────────

/**
 * Resolves the user-visible narrative for a BudgetItem. The schema carries two
 * legacy text fields:
 *
 *   - `notes` — used by manual writes (the FY27 House $25K + SWM $0 updates
 *     applied during the May 2026 process were written here).
 *   - `significanceToMassCEO` — used by the original seed data and some
 *     ingestion paths.
 *
 * Different render sites historically read different fields, which let stale
 * pre-passage narrative leak into the UI even after fresh updates landed.
 * This helper picks `notes` whenever present, falling back to
 * `significanceToMassCEO` so older seed rows still render. Everywhere a
 * BudgetItem narrative is shown to a user, route through this helper.
 */
export function getBudgetItemNarrative(item: {
  notes?: string | null
  significanceToMassCEO?: string | null
}): string | null {
  return item.notes?.trim() || item.significanceToMassCEO?.trim() || null
}

// ─── Massachusetts Fiscal Year ────────────────────────────────────────────────

/**
 * Returns the current Massachusetts state fiscal year. MA fiscal years run
 * July 1 – June 30 and are named after the year in which they end. So:
 *   - July 1, 2025 – June 30, 2026 = FY2026
 *   - July 1, 2026 – June 30, 2027 = FY2027
 *
 * Used to anchor budget-page filters and labels off the current date instead
 * of hardcoded fiscal-year constants.
 */
export function getCurrentMaFiscalYear(now: Date = new Date()): number {
  return now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear()
}

/**
 * Returns the Massachusetts fiscal year currently being budgeted by the
 * legislature. The House and Senate debate the next FY's budget during the
 * spring of the current FY (e.g. FY27 budget is debated Jan–June 2026).
 *
 * Convention: returns the next FY whenever we're still inside the current FY
 * (i.e. always one year ahead of `getCurrentMaFiscalYear`). This matches the
 * orchestrator's `targetFY = currentFY + 1` framing.
 */
export function getActiveBudgetFiscalYear(now: Date = new Date()): number {
  return getCurrentMaFiscalYear(now) + 1
}

// ─── Date Formatting ──────────────────────────────────────────────────────────

/**
 * Formats a Date object or ISO string to a human-readable date.
 *
 * Pinned to UTC, NOT Eastern. Nearly every date in this app is a DATE-ONLY
 * value (a bill's action date, a hearing's calendar day, a budget stage date)
 * that upstream sources and our scrapers persist as midnight UTC —
 * e.g. "2026-01-22T00:00:00.000Z" means "January 22", not an instant. Pinning
 * the formatter to America/New_York shifted those midnight-UTC values back into
 * the previous evening, rendering "Jan 21" for a Jan 22 date (an off-by-one for
 * every US viewer). Formatting in UTC preserves the intended calendar day. For
 * the rare value that carries a real time-of-day, only the date part is shown
 * here, so UTC remains correct.
 * Output: "Jan 15, 2025"
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/**
 * Formats a Date to a short date string for inputs (YYYY-MM-DD).
 */
export function formatDateInput(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

// ─── Currency Formatting ──────────────────────────────────────────────────────

/**
 * Formats a number or Prisma Decimal (coerced to number) as USD currency.
 * Output: "$1,234,567"  (no cents unless non-zero)
 */
export function formatCurrency(
  amount: number | string | null | undefined,
): string {
  if (amount === null || amount === undefined || amount === '') return '—'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(num)
}

// ─── String Utilities ─────────────────────────────────────────────────────────

/**
 * Truncates a string to the given length, appending "…" if truncated.
 */
export function truncate(
  str: string | null | undefined,
  length: number,
): string {
  if (!str) return ''
  if (str.length <= length) return str
  return str.slice(0, length).trimEnd() + '…'
}

/**
 * Returns initials from a full name (up to 2 characters).
 * "Jane Doe" → "JD", "Alice" → "A"
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (
    parts[0].charAt(0).toUpperCase() +
    parts[parts.length - 1].charAt(0).toUpperCase()
  )
}

/**
 * Converts a number of bytes to a human-readable file size string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Builds a query string from an object, omitting null/undefined/empty-string values.
 */
export function buildQueryString(
  params: Record<string, string | number | boolean | null | undefined>,
): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== null && v !== undefined && v !== '',
  ) as [string, string | number | boolean][]
  if (entries.length === 0) return ''
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()
}
