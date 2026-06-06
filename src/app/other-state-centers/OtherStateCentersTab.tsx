'use client'

import { type CSSProperties } from 'react'
import LivePeerStateBills from './LivePeerStateBills'

// ─── Design tokens (same values as children components) ────────────────────
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

export default function OtherStateCentersTab() {
  const page: CSSProperties = {
    backgroundColor: tokens.page,
    minHeight: '100%',
    padding: '40px 32px 60px',
    margin: '-24px -24px 0',
  }
  const inner: CSSProperties = {
    maxWidth: '1180px',
    margin: '0 auto',
  }
  const footer: CSSProperties = {
    marginTop: '64px',
    paddingTop: '24px',
    borderTop: `1px solid ${tokens.hairline}`,
    fontFamily: tokens.fontMono,
    fontSize: '11px',
    color: tokens.mutedInk,
    lineHeight: 1.7,
    maxWidth: '1180px',
  }

  return (
    <div style={page}>
      <div style={inner}>
        <LivePeerStateBills />
        <div style={footer}>
          Peer-state legislation flows from the OpenStates API (live, since January 2025),
          filtered to matches on <em>employee ownership</em>, <em>employee owned</em>,{' '}
          <em>employee-owned</em>, <em>ESOP</em>, <em>EOT</em>, <em>worker cooperative</em>,{' '}
          <em>worker co-op</em>, or <em>co-op</em>. Massachusetts-specific bills continue to
          be tracked on the &ldquo;MA Legislation&rdquo; tab, which syncs directly from
          malegislature.gov. The comparative state-by-state policy matrix (enacted and
          pending laws by lever) lives on the &ldquo;Peer State Policy Overview&rdquo; tab.
        </div>
      </div>
    </div>
  )
}
