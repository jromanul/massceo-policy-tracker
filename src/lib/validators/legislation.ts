import { z } from 'zod'

// ─── Enums (mirror Prisma enums as Zod literals) ──────────────────────────────

const JurisdictionSchema = z.enum(['MASSACHUSETTS', 'FEDERAL'])
const ChamberSchema = z.enum(['HOUSE', 'SENATE', 'JOINT'])
const PrioritySchema = z.enum([
  'CRITICAL',
  'HIGH',
  'MEDIUM',
  'LOW',
  'INFORMATIONAL',
])
const LegislativeStatusSchema = z.enum([
  'FILED',
  'IN_COMMITTEE',
  'REPORTED_OUT',
  'PASSED_ONE_CHAMBER',
  'PASSED_BOTH_CHAMBERS',
  'ENACTED',
  'VETOED',
  'DEAD',
  'MONITORING',
])
const BoardInterestLevelSchema = z.enum(['HIGH', 'MEDIUM', 'LOW', 'NONE'])
const TrackingTierSchema = z.enum(['IMPORTED', 'REVIEWED', 'ACTIVELY_TRACKED', 'ARCHIVED_NOT_RELEVANT'])

// ─── Create Schema ────────────────────────────────────────────────────────────

export const LegislativeItemCreateSchema = z.object({
  // Required
  title: z.string().min(1, 'Title is required'),
  billNumber: z.string().min(1, 'Bill number is required'),
  jurisdiction: JurisdictionSchema,

  // Optional scalars
  sessionNumber: z.string().optional(),
  shortSummary: z.string().optional(),
  detailedNotes: z.string().optional(),
  chamber: ChamberSchema.optional(),
  primarySponsor: z.string().optional(),
  coSponsors: z.array(z.string()).optional().default([]),
  assignedCommittee: z.string().optional(),
  status: LegislativeStatusSchema.optional().default('FILED'),
  statusDate: z.coerce.date().optional(),
  hearingDates: z.array(z.coerce.date()).optional().default([]),
  reportingDeadlines: z.array(z.coerce.date()).optional().default([]),
  nextExpectedMilestone: z.string().optional(),
  priority: PrioritySchema.optional().default('MEDIUM'),
  issueCategory: z.string().optional(),
  relevanceToMassCEO: z.string().optional(),
  relevanceToEOAB: z.string().optional(),
  boardInterestLevel: BoardInterestLevelSchema.optional().default('NONE'),
  externalLinks: z.array(z.string().url('Must be a valid URL')).optional().default([]),
  archived: z.boolean().optional().default(false),
  trackingTier: TrackingTierSchema.optional().default('IMPORTED'),

  // FK
  staffLeadId: z.coerce.number().int().positive().optional(),

  // Tag names (resolved server-side)
  tagNames: z.array(z.string()).optional().default([]),
})

export type LegislativeItemCreateInput = z.infer<
  typeof LegislativeItemCreateSchema
>

// ─── Update Schema ────────────────────────────────────────────────────────────

export const LegislativeItemUpdateSchema = LegislativeItemCreateSchema.partial()

export type LegislativeItemUpdateInput = z.infer<
  typeof LegislativeItemUpdateSchema
>
