'use client'

import { useEffect, useState, type CSSProperties } from 'react'

// ─── Design tokens (mirror other components) ────────────────────────────────
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

// 49 U.S. state legislatures plus DC covered via OpenStates unified API.
// Massachusetts deliberately excluded — tracked on the dedicated MA Legislation tab.
const PEER_STATES = [
  { code: 'al', name: 'Alabama' },
  { code: 'ak', name: 'Alaska' },
  { code: 'az', name: 'Arizona' },
  { code: 'ar', name: 'Arkansas' },
  { code: 'ca', name: 'California' },
  { code: 'co', name: 'Colorado' },
  { code: 'ct', name: 'Connecticut' },
  { code: 'de', name: 'Delaware' },
  { code: 'fl', name: 'Florida' },
  { code: 'ga', name: 'Georgia' },
  { code: 'hi', name: 'Hawaii' },
  { code: 'id', name: 'Idaho' },
  { code: 'il', name: 'Illinois' },
  { code: 'in', name: 'Indiana' },
  { code: 'ia', name: 'Iowa' },
  { code: 'ks', name: 'Kansas' },
  { code: 'ky', name: 'Kentucky' },
  { code: 'la', name: 'Louisiana' },
  { code: 'me', name: 'Maine' },
  { code: 'md', name: 'Maryland' },
  { code: 'mi', name: 'Michigan' },
  { code: 'mn', name: 'Minnesota' },
  { code: 'ms', name: 'Mississippi' },
  { code: 'mo', name: 'Missouri' },
  { code: 'mt', name: 'Montana' },
  { code: 'ne', name: 'Nebraska' },
  { code: 'nv', name: 'Nevada' },
  { code: 'nh', name: 'New Hampshire' },
  { code: 'nj', name: 'New Jersey' },
  { code: 'nm', name: 'New Mexico' },
  { code: 'ny', name: 'New York' },
  { code: 'nc', name: 'North Carolina' },
  { code: 'nd', name: 'North Dakota' },
  { code: 'oh', name: 'Ohio' },
  { code: 'ok', name: 'Oklahoma' },
  { code: 'or', name: 'Oregon' },
  { code: 'pa', name: 'Pennsylvania' },
  { code: 'ri', name: 'Rhode Island' },
  { code: 'sc', name: 'South Carolina' },
  { code: 'sd', name: 'South Dakota' },
  { code: 'tn', name: 'Tennessee' },
  { code: 'tx', name: 'Texas' },
  { code: 'ut', name: 'Utah' },
  { code: 'vt', name: 'Vermont' },
  { code: 'va', name: 'Virginia' },
  { code: 'wa', name: 'Washington' },
  { code: 'wv', name: 'West Virginia' },
  { code: 'wi', name: 'Wisconsin' },
  { code: 'wy', name: 'Wyoming' },
  { code: 'dc', name: 'District of Columbia' },
]

interface PeerStateBillApi {
  id: number
  state: string
  stateName: string
  billNumber: string
  sessionIdentifier: string | null
  title: string
  shortSummary: string | null
  eoRelevanceSummary: string | null
  sponsor: string | null
  chamber: string | null
  statusText: string | null
  introducedDate: string | null
  lastActionDate: string | null
  lastActionText: string | null
  sourceSystem: string | null
  sourceUrl: string | null
  matchedKeywords: string[]
  lastSyncedAt: string | null
}

interface ApiResponse {
  items: PeerStateBillApi[]
  total: number
  byState: Record<string, { stateName: string; count: number }>
  sinceDate: string
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  // Pin to UTC: peer-state bill introduced/last-action dates are date-only
  // values stored as midnight UTC. Without a fixed timeZone this formats in the
  // viewer's local zone, rendering the previous day for every US visitor.
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function relativeTime(iso: string | null): string {
  if (!iso) return 'never synced'
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const hrs = Math.floor(diff / 3600000)
  if (hrs < 1) return 'just now'
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function LivePeerStateBills() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch('/api/peer-state-bills')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((json: ApiResponse) => setData(json))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

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
    maxWidth: '820px',
    marginBottom: '24px',
  }
  const meta: CSSProperties = {
    fontFamily: tokens.fontMono,
    fontSize: '11px',
    color: tokens.mutedInk,
    marginBottom: '32px',
    padding: '10px 14px',
    backgroundColor: tokens.card,
    border: `1px solid ${tokens.hairline}`,
    borderRadius: '4px',
    display: 'inline-block',
  }

  if (loading) {
    return (
      <div style={container}>
        <div style={kicker}>49 other states + DC · auto-synced via OpenStates · Massachusetts tracked separately</div>
        <h2 style={title}>National Employee Ownership Legislation Tracker</h2>
        <p style={{ ...intro, fontStyle: 'italic', color: tokens.mutedInk }}>
          Loading bills from state legislatures…
        </p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={container}>
        <div style={kicker}>49 other states + DC · auto-synced via OpenStates · Massachusetts tracked separately</div>
        <h2 style={title}>National Employee Ownership Legislation Tracker</h2>
        <div
          style={{
            ...meta,
            color: tokens.statusSuspended,
            border: `1px solid ${tokens.statusSuspended}`,
          }}
        >
          Could not load live legislation feed: {error ?? 'unknown error'}
        </div>
      </div>
    )
  }

  // Flat chronological sort across all peer states: newest last-action date
  // first, oldest last. Uses introducedDate as a fallback when lastActionDate
  // is absent. Quiet-state roll-up still uses the state-level grouping so the
  // bottom of the section can surface "these peer states had nothing since
  // January 2025."
  const freshnessScore = (b: PeerStateBillApi): number => {
    const ts = b.lastActionDate ?? b.introducedDate
    return ts ? new Date(ts).getTime() : 0
  }
  const allBillsSorted = [...data.items].sort(
    (a, b) => freshnessScore(b) - freshnessScore(a),
  )

  const billsByState: Record<string, PeerStateBillApi[]> = {}
  for (const b of data.items) {
    if (!billsByState[b.state]) billsByState[b.state] = []
    billsByState[b.state].push(b)
  }
  const statesWithBills = PEER_STATES.filter(
    (s) => (billsByState[s.code] ?? []).length > 0,
  )
  const statesWithoutBills = PEER_STATES.filter((s) => (billsByState[s.code] ?? []).length === 0)

  const lastSync = data.items[0]?.lastSyncedAt ?? null

  if (data.total === 0) {
    return (
      <div style={container}>
        <div style={kicker}>49 other states + DC · auto-synced via OpenStates · Massachusetts tracked separately</div>
        <h2 style={title}>National Employee Ownership Legislation Tracker</h2>
        <p style={intro}>
          A live feed of employee-ownership legislation across the 49 other U.S. states plus DC (Massachusetts is tracked separately on the MA Legislation tab),
          pulled from the{' '}
          <a
            href="https://openstates.org/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: tokens.maAccent, textDecoration: 'underline' }}
          >
            OpenStates API
          </a>
          . Shows bills with activity since {formatDate(data.sinceDate)}.
        </p>
        <div style={meta}>
          No bills synced yet. Trigger a sync via{' '}
          <code style={{ fontFamily: tokens.fontMono }}>POST /api/peer-state-bills/sync</code>.
        </div>
      </div>
    )
  }

  return (
    <div style={container}>
      <div style={kicker}>49 other states + DC · auto-synced via OpenStates · Massachusetts tracked separately</div>
      <h2 style={title}>National Employee Ownership Legislation Tracker</h2>
      <p style={intro}>
        A live feed of employee-ownership legislation across all 49 other states (plus DC),
        pulled from the{' '}
        <a
          href="https://openstates.org/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: tokens.maAccent, textDecoration: 'underline' }}
        >
          OpenStates API
        </a>
        . Includes both pending bills and bills enacted since January 2025. We only keep
        bills whose title or summary mentions one of these terms:{' '}
        <em>employee ownership</em>, <em>employee owned</em>, <em>employee-owned</em>,{' '}
        <em>ESOP</em> (Employee Stock Ownership Plan), <em>EOT</em> (Employee Ownership
        Trust), <em>worker cooperative</em>, <em>worker co-op</em>, or <em>co-op</em>.
      </p>

      <div style={meta}>
        {data.total} bills · {statesWithBills.length} of {PEER_STATES.length} jurisdictions (49
        states + DC) currently have active employee-ownership legislation · sorted by most recent
        action (newest first) · last refreshed {relativeTime(lastSync)}
      </div>

      <div>
        {allBillsSorted.map((b) => (
          <LiveBillCard key={b.id} bill={b} />
        ))}
      </div>

      <QuietStatesSection states={statesWithoutBills} />
    </div>
  )
}

function LiveBillCard({ bill }: { bill: PeerStateBillApi }) {
  const card: CSSProperties = {
    backgroundColor: tokens.card,
    border: `1px solid ${tokens.hairline}`,
    borderRadius: '6px',
    padding: '16px 18px',
    marginBottom: '10px',
  }
  const topRow: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '6px',
    flexWrap: 'wrap',
  }
  const billNumber: CSSProperties = {
    fontFamily: tokens.fontDisplay,
    fontSize: '17px',
    fontWeight: 500,
    color: tokens.ink,
    lineHeight: 1.3,
    margin: 0,
  }
  const title: CSSProperties = {
    fontFamily: tokens.fontBody,
    fontSize: '13.5px',
    color: tokens.ink,
    lineHeight: 1.55,
    marginTop: '4px',
  }
  const sponsor: CSSProperties = {
    fontFamily: tokens.fontBody,
    fontSize: '12px',
    fontStyle: 'italic',
    color: tokens.subtleInk,
    marginTop: '4px',
  }
  const footer: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '14px 24px',
    marginTop: '10px',
    paddingTop: '10px',
    borderTop: `1px solid ${tokens.hairline}`,
    fontFamily: tokens.fontMono,
    fontSize: '11px',
    color: tokens.mutedInk,
  }
  const label: CSSProperties = {
    fontWeight: 600,
    color: tokens.subtleInk,
    marginRight: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }
  const link: CSSProperties = {
    color: tokens.maAccent,
    textDecoration: 'underline',
  }
  const session: CSSProperties = {
    fontFamily: tokens.fontMono,
    fontSize: '10.5px',
    color: tokens.mutedInk,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }
  const kwBadge: CSSProperties = {
    display: 'inline-block',
    padding: '1px 6px',
    marginRight: '4px',
    marginBottom: '4px',
    fontFamily: tokens.fontMono,
    fontSize: '10px',
    color: tokens.subtleInk,
    border: `1px solid ${tokens.hairline}`,
    borderRadius: '2px',
    backgroundColor: tokens.page,
  }

  const stateBadge: CSSProperties = {
    display: 'inline-block',
    padding: '2px 8px',
    marginBottom: '6px',
    fontFamily: tokens.fontMono,
    fontSize: '10px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: tokens.maAccent,
    backgroundColor: tokens.maBg,
    border: `1px solid ${tokens.hairline}`,
    borderRadius: '2px',
  }

  return (
    <article style={card}>
      <div style={topRow}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={stateBadge}>
            {bill.stateName} · {bill.state.toUpperCase()}
          </div>
          <h4 style={billNumber}>{bill.billNumber}</h4>
          <div style={title}>{bill.title}</div>
          {bill.sponsor && <div style={sponsor}>{bill.sponsor}</div>}
        </div>
        {bill.sessionIdentifier && <span style={session}>{bill.sessionIdentifier}</span>}
      </div>

      {bill.eoRelevanceSummary ? (
        // Curated 1–2 sentence explanation of how the bill advances employee
        // ownership. Set by MassCEO staff; preserved across scraper runs.
        <p
          style={{
            fontFamily: tokens.fontBody,
            fontSize: '13px',
            color: tokens.ink,
            lineHeight: 1.6,
            marginTop: '10px',
            paddingLeft: '10px',
            borderLeft: `3px solid ${tokens.maAccent}`,
          }}
        >
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: tokens.maAccent,
              display: 'block',
              marginBottom: '3px',
            }}
          >
            How this advances employee ownership
          </span>
          {bill.eoRelevanceSummary}
        </p>
      ) : (
        bill.shortSummary &&
        bill.shortSummary !== bill.title && (
          <p
            style={{
              fontFamily: tokens.fontBody,
              fontSize: '12.5px',
              color: tokens.subtleInk,
              lineHeight: 1.6,
              marginTop: '8px',
            }}
          >
            {bill.shortSummary.length > 280
              ? `${bill.shortSummary.slice(0, 280)}…`
              : bill.shortSummary}
          </p>
        )
      )}

      <div style={footer}>
        {bill.lastActionDate && (
          <span>
            <span style={label}>Last action</span>
            {formatDate(bill.lastActionDate)}
            {bill.lastActionText ? ` — ${bill.lastActionText}` : ''}
          </span>
        )}
        {bill.introducedDate && (
          <span>
            <span style={label}>Introduced</span>
            {formatDate(bill.introducedDate)}
          </span>
        )}
        {bill.sourceUrl && (
          <a href={bill.sourceUrl} target="_blank" rel="noopener noreferrer" style={link}>
            View at state legislature →
          </a>
        )}
      </div>

      {bill.matchedKeywords && bill.matchedKeywords.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          {bill.matchedKeywords.slice(0, 5).map((kw) => (
            <span key={kw} style={kwBadge}>
              {kw}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}

function QuietStatesSection({ states }: { states: Array<{ code: string; name: string }> }) {
  if (states.length === 0) return null

  const wrap: CSSProperties = {
    marginTop: '40px',
    padding: '20px 22px',
    backgroundColor: tokens.card,
    border: `1px solid ${tokens.hairline}`,
    borderRadius: '6px',
  }
  const heading: CSSProperties = {
    fontFamily: tokens.fontDisplay,
    fontSize: '17px',
    fontWeight: 500,
    color: tokens.ink,
    margin: 0,
    marginBottom: '6px',
  }
  const blurb: CSSProperties = {
    fontFamily: tokens.fontBody,
    fontSize: '13px',
    color: tokens.subtleInk,
    marginBottom: '14px',
    lineHeight: 1.6,
  }
  const pillRow: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  }
  const pill: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'baseline',
    gap: '6px',
    padding: '4px 10px',
    fontFamily: tokens.fontBody,
    fontSize: '12px',
    color: tokens.subtleInk,
    backgroundColor: tokens.page,
    border: `1px solid ${tokens.hairline}`,
    borderRadius: '12px',
  }
  const codeStyle: CSSProperties = {
    fontFamily: tokens.fontMono,
    fontSize: '10px',
    color: tokens.mutedInk,
    textTransform: 'uppercase',
  }

  return (
    <div style={wrap}>
      <h3 style={heading}>States with no current employee-ownership bills</h3>
      <p style={blurb}>
        These states were searched on the most recent sync but returned no bills matching the
        employee-ownership keywords listed above, with any activity since January 2025. New
        bills will appear here automatically as they are filed.
      </p>
      <div style={pillRow}>
        {states.map((s) => (
          <span key={s.code} style={pill}>
            {s.name} <span style={codeStyle}>{s.code}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
