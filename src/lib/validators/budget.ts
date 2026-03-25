import { z } from 'zod'

// ─── Enums ────────────────────────────────────────────────────────────────────

const JurisdictionSchema = z.enum(['MASSACHUSETTS', 'FEDERAL'])
const PrioritySchema = z.enum([
  'CRITICAL',
  'HIGH',
  'MEDIUM',
  'LOW',
  'INFORMATIONAL',
])
const BudgetSourceStageSchema = z.enum([
  'GOVERNOR',
  'HOUSE',
  'SENATE',
  'CONFERENCE',
  'FINAL',
  'SUPPLEMENTAL',
])
const BudgetStatusSchema = z.enum([
  'PROPOSED',
  'UNDER_REVIEW',
  'AMENDED',
  'ADOPTED',
  'REJECTED',
  'MONITORING',
])
const BoardDiscussionStatusSchema = z.enum([
  'NOT_DISCUSSED',
  'SCHEDULED',
  'DISCUSSED',
  'ACTION_REQUIRED',
  'RESOLVED',
])

// ─── Create Schema ────────────────────────────────────────────────────────────

export const BudgetItemCreateSchema = z.object({
  // Required
  name: z.string().min(1, 'Name is required'),
  fiscalYear: z.coerce
    .number()
    .int()
    .min(2000, 'Fiscal year must be 2000 or later')
    .max(2100, 'Fiscal year must be 2100 or earlier'),
  sourceStage: BudgetSourceStageSchema,

  // Optional scalars
  lineItemNumber: z.string().optional(),
  jurisdiction: JurisdictionSchema.optional().default('MASSACHUSETTS'),
  amountProposed: z.coerce.number().nonnegative().optional(),
  amountAdopted: z.coerce.number().nonnegative().optional(),
  priorYearAmount: z.coerce.number().nonnegative().optional(),
  status: BudgetStatusSchema.optional().default('PROPOSED'),
  statusDate: z.coerce.date().optional(),
  significanceToMassCEO: z.string().optional(),
  notes: z.string().optional(),
  deadlines: z.array(z.coerce.date()).optional().default([]),
  priority: PrioritySchema.optional().default('MEDIUM'),
  boardDiscussionStatus: BoardDiscussionStatusSchema.optional().default(
    'NOT_DISCUSSED',
  ),
  archived: z.boolean().optional().default(false),

  // FK
  staffLeadId: z.coerce.number().int().positive().optional(),

  // Tag names (resolved server-side)
  tagNames: z.array(z.string()).optional().default([]),
})

export type BudgetItemCreateInput = z.infer<typeof BudgetItemCreateSchema>

// ─── Update Schema ────────────────────────────────────────────────────────────

export const BudgetItemUpdateSchema = BudgetItemCreateSchema.partial()

export type BudgetItemUpdateInput = z.infer<typeof BudgetItemUpdateSchema>
