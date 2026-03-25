import { z } from 'zod'

// ─── Enums ────────────────────────────────────────────────────────────────────

const JurisdictionSchema = z.enum(['MASSACHUSETTS', 'FEDERAL'])
const HearingStatusSchema = z.enum([
  'UPCOMING',
  'COMPLETED',
  'CANCELED',
  'MONITORING_ONLY',
])
const HearingTypeSchema = z.enum(['LEGISLATIVE', 'BUDGET', 'PUBLIC_COMMENT', 'OTHER'])

// ─── Create Schema ────────────────────────────────────────────────────────────

export const HearingCreateSchema = z.object({
  // Required
  title: z.string().min(1, 'Title is required'),
  date: z.coerce.date({ error: 'Date is required' }),

  // Optional scalars
  eventType: z.string().optional(),
  time: z.string().optional(),
  location: z.string().optional(),
  committeeOrBody: z.string().optional(),
  jurisdiction: JurisdictionSchema.optional(),
  summary: z.string().optional(),
  preparationNotes: z.string().optional(),
  followUpNotes: z.string().optional(),
  status: HearingStatusSchema.optional().default('UPCOMING'),
  hearingType: HearingTypeSchema.optional().default('LEGISLATIVE'),

  // FK
  responsibleStaffId: z.coerce.number().int().positive().optional(),

  // Tag names (resolved server-side)
  tagNames: z.array(z.string()).optional().default([]),
})

export type HearingCreateInput = z.infer<typeof HearingCreateSchema>

// ─── Update Schema ────────────────────────────────────────────────────────────

export const HearingUpdateSchema = HearingCreateSchema.partial()

export type HearingUpdateInput = z.infer<typeof HearingUpdateSchema>
