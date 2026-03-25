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

// ─── Date Formatting ──────────────────────────────────────────────────────────

/**
 * Formats a Date object or ISO string to a human-readable date.
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
