'use client'

import { type CSSProperties } from 'react'
import { BILLS_TO_WATCH, LEVERS, type BillToWatch, type LeverId } from './policyData'

// ─── Design tokens (same values as PolicyMatrix) ────────────────────────────
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

const LEVER_LABEL: Record<LeverId, string> = LEVERS.reduce(
  (acc, l) => {
    acc[l.id] = l.title
    return acc
  },
  {} as Record<LeverId, string>,
)

// ─── Sub-components ─────────────────────────────────────────────────────────

function LeverTag({ lever }: { lever: LeverId }) {
  const style: CSSProperties = {
    display: 'inline-block',
    padding: '3px 9px',
    fontFamily: tokens.fontBody,
    fontSize: '10px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: tokens.subtleInk,
    border: `1px solid ${tokens.hairline}`,
    borderRadius: '10px',
    backgroundColor: tokens.card,
    whiteSpace: 'nowrap',
  }
  return <span style={style}>{LEVER_LABEL[lever]}</span>
}

function BillCard({ bill }: { bill: BillToWatch }) {
  // MA and peer-state bills render identically. `bill.isMA` is used only
  // for section partitioning ("Massachusetts — Pending" vs "Peer States"),
  // not for visual emphasis.
  const card: CSSProperties = {
    backgroundColor: tokens.card,
    border: `1px solid ${tokens.hairline}`,
    borderRadius: '6px',
    padding: '20px 22px',
    marginBottom: '14px',
  }
  const topRow: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '4px',
    flexWrap: 'wrap',
  }
  const stateText: CSSProperties = {
    fontFamily: tokens.fontMono,
    fontSize: '11px',
    color: tokens.mutedInk,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 600,
    marginBottom: '6px',
  }
  const billNumber: CSSProperties = {
    fontFamily: tokens.fontDisplay,
    fontSize: '22px',
    fontWeight: 500,
    color: tokens.ink,
    lineHeight: 1.2,
    margin: 0,
  }
  const sponsor: CSSProperties = {
    fontFamily: tokens.fontBody,
    fontSize: '13px',
    fontStyle: 'italic',
    color: tokens.subtleInk,
    marginTop: '6px',
  }
  const summary: CSSProperties = {
    fontFamily: tokens.fontBody,
    fontSize: '14px',
    color: tokens.ink,
    lineHeight: 1.65,
    marginTop: '14px',
  }
  const footer: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginTop: '16px',
    paddingTop: '14px',
    borderTop: `1px solid ${tokens.hairline}`,
  }
  const footerLabel: CSSProperties = {
    fontFamily: tokens.fontBody,
    fontSize: '10px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: tokens.mutedInk,
    marginBottom: '6px',
  }
  const statusText: CSSProperties = {
    fontFamily: tokens.fontMono,
    fontSize: '12.5px',
    color: tokens.ink,
    lineHeight: 1.5,
  }
  const relevanceText: CSSProperties = {
    fontFamily: tokens.fontBody,
    fontSize: '12.5px',
    color: tokens.subtleInk,
    lineHeight: 1.6,
  }

  return (
    <article style={card}>
      <div style={topRow}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={stateText}>{bill.state}</div>
          <h4 style={billNumber}>{bill.billNumber}</h4>
          <div style={sponsor}>{bill.sponsor}</div>
        </div>
        <LeverTag lever={bill.lever} />
      </div>

      <p style={summary}>{bill.summary}</p>

      <div style={footer}>
        <div>
          <div style={footerLabel}>Status</div>
          <div style={statusText}>{bill.status}</div>
        </div>
        <div>
          <div style={footerLabel}>Relevance to MA</div>
          <div style={relevanceText}>{bill.relevanceToMA}</div>
        </div>
      </div>
    </article>
  )
}

function SectionHeading({ title }: { title: string }) {
  const style: CSSProperties = {
    fontFamily: tokens.fontDisplay,
    fontSize: '22px',
    fontWeight: 500,
    color: tokens.ink,
    margin: 0,
    marginBottom: '16px',
    paddingBottom: '10px',
    borderBottom: `2px solid ${tokens.ink}`,
    display: 'inline-block',
  }
  return <h3 style={style}>{title}</h3>
}

// ─── Module-scope helpers (also consumed by LivePeerStateBills) ────────────

// Parse the freshest explicit date out of a bill's `status` string and use
// it to sort newest legislative action first. Status lines are hand-written
// prose (e.g. "Passed Senate unanimously June 12, 2025; placed on Special
// Appropriations Table…"), so we look for every `Month DD, YYYY` — or
// `M/D/YYYY` — pattern in the string and take the latest. Bills without any
// parseable date sort to the bottom (0).
const DATE_PATTERNS: RegExp[] = [
  /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/gi,
  /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{1,2},?\s+\d{4}\b/gi,
  /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
]

function latestDateIn(text: string): number {
  let best = 0
  for (const re of DATE_PATTERNS) {
    const matches = text.match(re) ?? []
    for (const m of matches) {
      const t = new Date(m).getTime()
      if (!Number.isNaN(t) && t > best) best = t
    }
  }
  return best
}

export function curatedPeerBillsSorted(): BillToWatch[] {
  return BILLS_TO_WATCH.filter((b) => !b.isMA).sort(
    (a, b) => latestDateIn(b.status) - latestDateIn(a.status),
  )
}

export { BillCard }

// ─── Main component ─────────────────────────────────────────────────────────

export default function BillsWatchlist() {
  const byRecency = (a: BillToWatch, b: BillToWatch) =>
    latestDateIn(b.status) - latestDateIn(a.status)

  const maBills = BILLS_TO_WATCH.filter((b) => b.isMA).sort(byRecency)

  const container: CSSProperties = {
    fontFamily: tokens.fontBody,
    color: tokens.ink,
    marginTop: '56px',
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
    fontSize: '30px',
    fontWeight: 400,
    color: tokens.ink,
    lineHeight: 1.2,
    letterSpacing: '-0.01em',
    margin: 0,
    marginBottom: '16px',
  }
  const intro: CSSProperties = {
    fontFamily: tokens.fontBody,
    fontSize: '15px',
    color: tokens.subtleInk,
    lineHeight: 1.7,
    maxWidth: '780px',
    marginBottom: '36px',
  }
  const sectionSpacer: CSSProperties = {
    marginBottom: '40px',
  }

  return (
    <div style={container}>
      <div style={kicker}>Bills to Watch</div>
      <h2 style={title}>Pending Legislation in Massachusetts</h2>
      <p style={intro}>
        The matrix above maps policy that currently <em>is</em>. This watchlist maps policy
        that <em>could change</em>: active MA bills that would alter the state comparison if
        enacted. Peer-state legislation — both hand-curated with MA relevance notes and
        auto-synced from the OpenStates API — appears in the &ldquo;Peer States&rdquo; section
        below.
      </p>

      <div style={sectionSpacer}>
        <SectionHeading title="Massachusetts — Pending" />
        {maBills.length === 0 ? (
          <p
            style={{
              fontFamily: tokens.fontBody,
              fontSize: '13px',
              color: tokens.mutedInk,
              fontStyle: 'italic',
            }}
          >
            No pending MA bills currently tracked.
          </p>
        ) : (
          maBills.map((bill, idx) => <BillCard key={`ma-${idx}`} bill={bill} />)
        )}
      </div>
    </div>
  )
}
