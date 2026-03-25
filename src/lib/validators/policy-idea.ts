import { z } from 'zod'

// ─── Enums ────────────────────────────────────────────────────────────────────

const PolicyOriginTypeSchema = z.enum(['BOARD_MEMBER', 'STAFF', 'EXTERNAL_STAKEHOLDER', 'COMMITTEE'])

const PolicyDispositionSchema = z.enum([
  'SUBMITTED',
  'UNDER_REVIEW',
  'NEEDS_RESEARCH',
  'REFERRED_FOR_DISCUSSION',
  'MONITORING',
  'DEFERRED',
  'CLOSED',
  'ARCHIVED',
])

// ─── Create Schema ────────────────────────────────────────────────────────────

export const PolicyIdeaCreateSchema = z.object({
  // Required
  title: z.string().min(1, 'Title is required'),

  // Optional scalars
  shortDescription: z.string().optional(),
  fullDescription: z.string().optional(),
  ideaSource: z.string().optional(),
  dateSubmitted: z.coerce.date().optional(),
  sourceMeetingOrCommittee: z.string().optional(),
  issueArea: z.string().optional(),
  rationale: z.string().optional(),
  staffNotes: z.string().optional(),
  boardDiscussionNotes: z.string().optional(),
  disposition: PolicyDispositionSchema.optional().default('SUBMITTED'),
  nextAction: z.string().optional(),
  historicalContext: z.string().optional(),
  openQuestions: z.string().optional(),
  archived: z.boolean().optional().default(false),
  originType: PolicyOriginTypeSchema.optional(),
  relatedAgendaUrl: z.string().url().optional().or(z.literal('')),

  // FK
  submittedById: z.coerce.number().int().positive().optional(),

  // Tag names (resolved server-side)
  tagNames: z.array(z.string()).optional().default([]),
})

export type PolicyIdeaCreateInput = z.infer<typeof PolicyIdeaCreateSchema>

// ─── Update Schema ────────────────────────────────────────────────────────────

export const PolicyIdeaUpdateSchema = PolicyIdeaCreateSchema.partial()

export type PolicyIdeaUpdateInput = z.infer<typeof PolicyIdeaUpdateSchema>
