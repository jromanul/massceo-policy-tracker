'use client'

import React, { useState, type CSSProperties } from 'react'
import { LEVERS, ENTRIES, type Lever, type PolicyEntry, type PolicyStatus } from './policyData'

// ─── Design tokens ──────────────────────────────────────────────────────────
// maAccent = "Mayflower blue" — the deep navy associated with the Massachusetts
// Commonwealth seal and Pilgrim heritage. maBg is a light blue tint.
const tokens = {
  ink: '#1a1f2e',
  subtleInk: '#4a5165',
  mutedInk: '#8a8e9a',
  hairline: '#e4e2dc',
  page: '#faf8f4',
  card: '#ffffff',
  maAccent: '#1e3a5f',
  maBg: '#eef2f7',
  statusActive: '#2d6a4f',
  statusPending: '#b8860b',
  statusSuspended: '#a63a2a',
  statusNone: '#8a8e9a',
  fontDisplay: "'Fraunces', 'Times New Roman', Georgia, serif",
  fontBody:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontMono: "'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace",
}

const STATUS_META: Record<PolicyStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: tokens.statusActive },
  pending: { label: 'Pending', color: tokens.statusPending },
  suspended: { label: 'Suspended', color: tokens.statusSuspended },
  none: { label: 'None', color: tokens.statusNone },
}

// ─── Sub-components ─────────────────────────────────────────────────────────

/**
 * Render a citation string that may contain markdown-style links:
 *   "HB 25-1021 ([leg.colorado.gov](https://leg.colorado.gov/bills/hb25-1021))"
 *
 * Splits the string on `[label](url)` patterns and renders each match as a
 * clickable <a> tag (opens in a new tab, with rel="noopener noreferrer").
 * Plain text passes through unchanged.
 */
function renderCitation(text: string): React.ReactNode[] {
  const pattern = /\[([^\]]+)\]\(([^)]+)\)/g
  const out: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      out.push(text.slice(lastIndex, match.index))
    }
    const [, label, url] = match
    out.push(
      <a
        key={`l${key++}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: tokens.maAccent, textDecoration: 'underline' }}
      >
        {label}
      </a>,
    )
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) {
    out.push(text.slice(lastIndex))
  }
  return out
}

function StatusPill({ status }: { status: PolicyStatus }) {
  const meta = STATUS_META[status]
  const style: CSSProperties = {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '10px',
    border: `1px solid ${meta.color}`,
    color: meta.color,
    fontFamily: tokens.fontBody,
    fontSize: '10px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
    backgroundColor: 'transparent',
  }
  return <span style={style}>{meta.label}</span>
}

function Legend() {
  const wrap: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px 20px',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: tokens.card,
    border: `1px solid ${tokens.hairline}`,
    borderRadius: '6px',
    marginBottom: '28px',
  }
  const label: CSSProperties = {
    fontFamily: tokens.fontBody,
    fontSize: '11px',
    color: tokens.subtleInk,
    fontWeight: 500,
  }
  const maSwatch: CSSProperties = {
    display: 'inline-block',
    width: '14px',
    height: '14px',
    borderLeft: `3px solid ${tokens.maAccent}`,
    backgroundColor: tokens.maBg,
    marginRight: '6px',
    verticalAlign: 'middle',
  }
  return (
    <div style={wrap}>
      <span style={{ ...label, fontWeight: 600, color: tokens.ink, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em' }}>
        Legend
      </span>
      {(['active', 'pending', 'suspended', 'none'] as PolicyStatus[]).map((s) => (
        <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <StatusPill status={s} />
        </span>
      ))}
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
        <span style={maSwatch} />
        <span style={label}>Massachusetts</span>
      </span>
    </div>
  )
}

function sortEntries(entries: PolicyEntry[]): PolicyEntry[] {
  // MA first (preserving array order for multiple MA entries), then alphabetical by state.
  // Within same state, preserve the original array order (important for CO which has
  // two entries in conversion-tax-credit).
  const indexed = entries.map((e, i) => ({ e, i }))
  return indexed
    .sort((a, b) => {
      if (a.e.isMA && !b.e.isMA) return -1
      if (!a.e.isMA && b.e.isMA) return 1
      // Same MA status — alphabetical by state, fallback to original order
      const stateCmp = a.e.state.localeCompare(b.e.state)
      if (stateCmp !== 0) return stateCmp
      return a.i - b.i
    })
    .map((x) => x.e)
}

function LeverSection({
  lever,
  entries,
  initialOpen,
}: {
  lever: Lever
  entries: PolicyEntry[]
  initialOpen: boolean
}) {
  const [open, setOpen] = useState(initialOpen)
  const sorted = sortEntries(entries)

  const sectionStyle: CSSProperties = {
    backgroundColor: tokens.card,
    border: `1px solid ${tokens.hairline}`,
    borderRadius: '6px',
    marginBottom: '20px',
    overflow: 'hidden',
  }
  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    cursor: 'pointer',
    borderBottom: open ? `1px solid ${tokens.hairline}` : 'none',
    userSelect: 'none',
  }
  const toggleStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    border: `1px solid ${tokens.hairline}`,
    borderRadius: '3px',
    fontFamily: tokens.fontMono,
    fontSize: '14px',
    lineHeight: 1,
    color: tokens.subtleInk,
    backgroundColor: tokens.page,
    flexShrink: 0,
  }
  const titleStyle: CSSProperties = {
    fontFamily: tokens.fontDisplay,
    fontSize: '20px',
    fontWeight: 500,
    color: tokens.ink,
    lineHeight: 1.3,
    margin: 0,
  }
  const descStyle: CSSProperties = {
    fontFamily: tokens.fontBody,
    fontSize: '13px',
    color: tokens.subtleInk,
    lineHeight: 1.5,
    marginTop: '4px',
  }
  const countStyle: CSSProperties = {
    fontFamily: tokens.fontMono,
    fontSize: '11px',
    color: tokens.mutedInk,
    marginLeft: 'auto',
    flexShrink: 0,
  }

  return (
    <section style={sectionStyle}>
      <div
        style={headerStyle}
        onClick={() => setOpen(!open)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen(!open)
          }
        }}
      >
        <span style={toggleStyle} aria-label={open ? 'Collapse section' : 'Expand section'}>
          {open ? '−' : '+'}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={titleStyle}>{lever.title}</h3>
          <p style={descStyle}>{lever.description}</p>
        </div>
        <span style={countStyle}>
          {sorted.length} {sorted.length === 1 ? 'state' : 'entries'}
        </span>
      </div>
      {open && <LeverTable entries={sorted} />}
    </section>
  )
}

function LeverTable({ entries }: { entries: PolicyEntry[] }) {
  const tableWrap: CSSProperties = {
    overflowX: 'auto',
  }
  const table: CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: tokens.fontBody,
    fontSize: '13px',
    color: tokens.ink,
  }
  const th: CSSProperties = {
    textAlign: 'left',
    fontFamily: tokens.fontBody,
    fontSize: '10px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: tokens.mutedInk,
    padding: '12px 16px',
    borderBottom: `1px solid ${tokens.hairline}`,
    backgroundColor: tokens.page,
    verticalAlign: 'top',
  }

  return (
    <div style={tableWrap}>
      <table style={table}>
        <thead>
          <tr>
            <th style={{ ...th, width: '150px' }}>State / Status</th>
            <th style={{ ...th, minWidth: '280px' }}>Mechanism</th>
            <th style={{ ...th, minWidth: '240px' }}>Key Parameters</th>
            <th style={{ ...th, minWidth: '200px' }}>Citation / Effective</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, idx) => (
            <EntryRow key={`${entry.state}-${idx}`} entry={entry} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EntryRow({ entry }: { entry: PolicyEntry }) {
  // Massachusetts rows are highlighted in Mayflower blue across the comparison
  // matrix. Non-MA rows render on white. No "anchor" labels or badges — the
  // blue tint + left rule is the sole indicator of the MA row identity.
  const isMA = !!entry.isMA
  const rowBase: CSSProperties = {
    borderBottom: `1px solid ${tokens.hairline}`,
    backgroundColor: isMA ? tokens.maBg : tokens.card,
    verticalAlign: 'top',
  }
  const firstCell: CSSProperties = {
    padding: '16px',
    borderLeft: isMA
      ? `3px solid ${tokens.maAccent}`
      : '3px solid transparent',
    verticalAlign: 'top',
  }
  const cell: CSSProperties = {
    padding: '16px',
    verticalAlign: 'top',
    lineHeight: 1.55,
  }
  const stateName: CSSProperties = {
    fontFamily: tokens.fontDisplay,
    fontSize: '15px',
    fontWeight: 500,
    color: isMA ? tokens.maAccent : tokens.ink,
    marginBottom: '6px',
    lineHeight: 1.2,
  }
  const mechanism: CSSProperties = {
    color: tokens.ink,
    fontSize: '13px',
  }
  const parameters: CSSProperties = {
    color: tokens.subtleInk,
    fontSize: '12.5px',
  }
  const citation: CSSProperties = {
    fontFamily: tokens.fontMono,
    fontSize: '11.5px',
    color: tokens.subtleInk,
    marginBottom: '6px',
    wordBreak: 'break-word' as const,
  }
  const effective: CSSProperties = {
    fontFamily: tokens.fontBody,
    fontSize: '11.5px',
    color: tokens.mutedInk,
    fontStyle: 'italic',
  }
  return (
    <tr style={rowBase}>
      <td style={firstCell}>
        <div style={stateName}>{entry.state}</div>
        <StatusPill status={entry.status} />
      </td>
      <td style={cell}>
        <div style={mechanism}>{entry.mechanism}</div>
      </td>
      <td style={cell}>
        <div style={parameters}>{entry.parameters}</div>
      </td>
      <td style={cell}>
        <div style={citation}>{renderCitation(entry.citation)}</div>
        <div style={effective}>{entry.effective}</div>
      </td>
    </tr>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function PolicyMatrix() {
  const OPEN_BY_DEFAULT = new Set(['conversion-tax-credit', 'capital-gains'])

  const container: CSSProperties = {
    fontFamily: tokens.fontBody,
    color: tokens.ink,
  }
  const kicker: CSSProperties = {
    fontFamily: tokens.fontMono,
    fontSize: '11px',
    color: tokens.mutedInk,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '10px',
  }
  const title: CSSProperties = {
    fontFamily: tokens.fontDisplay,
    fontSize: '34px',
    fontWeight: 400,
    color: tokens.ink,
    lineHeight: 1.15,
    letterSpacing: '-0.01em',
    margin: 0,
    marginBottom: '18px',
  }

  return (
    <div style={container}>
      <div style={kicker}>MassCEO Policy &amp; Legislative Tracker · Peer State Policy Overview</div>
      <h2 style={title}>Comparative Employee Ownership Policy Across States</h2>

      <Legend />

      {LEVERS.map((lever) => {
        const entries = ENTRIES.filter((e) => e.lever === lever.id)
        return (
          <LeverSection
            key={lever.id}
            lever={lever}
            entries={entries}
            initialOpen={OPEN_BY_DEFAULT.has(lever.id)}
          />
        )
      })}
    </div>
  )
}
