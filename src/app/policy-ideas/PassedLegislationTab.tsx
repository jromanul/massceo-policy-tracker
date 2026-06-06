'use client'

import { type CSSProperties } from 'react'
import PolicyMatrix from '../other-state-centers/PolicyMatrix'

// ─── Design tokens (match the pending-legislation tab for visual coherence) ─
const tokens = {
  ink: '#1a1f2e',
  subtleInk: '#4a5165',
  mutedInk: '#8a8e9a',
  hairline: '#e4e2dc',
  page: '#faf8f4',
  card: '#ffffff',
  maAccent: '#1e3a5f',
  maBg: '#eef2f7',
  fontDisplay: "'Fraunces', 'Times New Roman', Georgia, serif",
  fontBody:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontMono: "'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace",
}

export default function PassedLegislationTab() {
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

  return (
    <div style={page}>
      <div style={inner}>
        <PolicyMatrix />
      </div>
    </div>
  )
}
