/**
 * EO Relevance Scoring
 *
 * Scores legislative items by relevance to employee ownership,
 * worker ownership, and related topics tracked by MassCEO / EOAB.
 */

interface KeywordEntry {
  phrase: string
  weight: number
}

const EO_RELEVANCE_KEYWORDS: KeywordEntry[] = [
  // Tier 1 — directly about employee ownership (weight 10)
  { phrase: 'employee ownership', weight: 10 },
  { phrase: 'employee-owned', weight: 10 },
  { phrase: 'employee owned', weight: 10 },
  { phrase: 'employee stock ownership', weight: 10 },
  { phrase: 'esop', weight: 10 },
  { phrase: 'worker-owned', weight: 10 },
  { phrase: 'worker owned', weight: 10 },
  { phrase: 'employee ownership trust', weight: 10 },
  { phrase: 'eot', weight: 10 },
  { phrase: 'massceo', weight: 10 },

  // Tier 2 — closely related models and transitions (weight 6)
  { phrase: 'worker cooperative', weight: 6 },
  { phrase: 'worker co-op', weight: 6 },
  { phrase: 'cooperative development', weight: 6 },
  { phrase: 'ownership conversion', weight: 6 },
  { phrase: 'business succession', weight: 6 },
  { phrase: 'broad-based ownership', weight: 6 },
  { phrase: 'shared ownership', weight: 6 },
  { phrase: 'cooperative economy', weight: 6 },
  { phrase: 'employee benefit plan', weight: 6 },
  { phrase: 'ownership transition', weight: 6 },

  // Tier 3 — adjacent topics (weight 3)
  { phrase: 'profit sharing', weight: 3 },
  { phrase: 'democratic workplace', weight: 3 },
  { phrase: 'small business transition', weight: 3 },
  { phrase: 'retiring business owner', weight: 3 },
  { phrase: 'cooperative association', weight: 3 },
  { phrase: 'business transfer', weight: 3 },
  { phrase: 'worker self-directed', weight: 3 },
]

/**
 * Compute relevance score (0–100) for a legislative item.
 * Scans title, summary, and issueCategory against keyword tiers.
 */
export function computeRelevanceScore(
  title: string,
  summary?: string | null,
  issueCategory?: string | null,
): number {
  const text = [title, summary, issueCategory]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (!text) return 0

  let score = 0
  for (const { phrase, weight } of EO_RELEVANCE_KEYWORDS) {
    if (text.includes(phrase.toLowerCase())) {
      score += weight
    }
  }

  return Math.min(score, 100)
}

/**
 * Returns true if the score meets the minimum threshold for EO relevance.
 */
export function isEORelevant(score: number): boolean {
  return score >= 10
}
