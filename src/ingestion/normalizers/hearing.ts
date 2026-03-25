/**
 * Hearing Normalizer
 *
 * Transforms raw hearing/event data from MA Legislature
 * into the canonical Hearing input format.
 */

import type {
  Normalizer,
  NormalizeResult,
  MALegislatureRawHearing,
  CanonicalHearingInput,
} from '../types'

function parseDateTimeSafe(dateStr: string, timeStr?: string): Date {
  // Try parsing combined date + time
  if (timeStr) {
    const combined = `${dateStr} ${timeStr}`
    const parsed = new Date(combined)
    if (!isNaN(parsed.getTime())) return parsed
  }

  // Try parsing date alone
  const parsed = new Date(dateStr)
  if (!isNaN(parsed.getTime())) return parsed

  // Try common MA Legislature date formats: "March 25, 2026" etc.
  const monthDayYear = dateStr.match(/(\w+)\s+(\d+),?\s+(\d{4})/)
  if (monthDayYear) {
    const d = new Date(`${monthDayYear[1]} ${monthDayYear[2]}, ${monthDayYear[3]}`)
    if (!isNaN(d.getTime())) return d
  }

  // Fallback
  return new Date()
}

function determineHearingStatus(dateStr: string): 'UPCOMING' | 'COMPLETED' | 'CANCELED' | 'MONITORING_ONLY' {
  const eventDate = parseDateTimeSafe(dateStr)
  const now = new Date()

  if (eventDate > now) return 'UPCOMING'
  return 'COMPLETED'
}

export class MALegislatureHearingNormalizer
  implements Normalizer<MALegislatureRawHearing, CanonicalHearingInput>
{
  normalize(raw: MALegislatureRawHearing): NormalizeResult<CanonicalHearingInput> {
    const warnings: string[] = []
    const unmappedFields: string[] = []

    const date = parseDateTimeSafe(raw.date, raw.time)

    const status = raw.status
      ? (raw.status.toLowerCase().includes('cancel') ? 'CANCELED' as const : determineHearingStatus(raw.date))
      : determineHearingStatus(raw.date)

    return {
      normalized: {
        title: raw.title || `${raw.committee} Hearing`,
        eventType: 'Legislative Hearing',
        date,
        time: raw.time || undefined,
        location: raw.location || undefined,
        committeeOrBody: raw.committee || undefined,
        jurisdiction: 'MASSACHUSETTS',
        status,
        dataSource: 'MA_LEGISLATURE',
        sourceUrl: raw.url,
        sourceExternalId: `ma-hearing-${raw.eventId}`,
        rawSourceData: raw,
        relatedBillExternalIds: raw.relatedBills.map(
          (b) => `ma-194-${b.replace(/[\s.]/g, '')}`,
        ),
      },
      warnings,
      unmappedFields,
    }
  }
}
