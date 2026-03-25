import { z } from 'zod'

const AmendmentStatusSchema = z.enum([
  'FILED',
  'PENDING',
  'ADOPTED',
  'REJECTED',
  'WITHDRAWN',
])

const AmendmentTypeSchema = z.enum(['AMENDMENT', 'EARMARK'])

const BudgetSourceStageSchema = z.enum([
  'GOVERNOR',
  'HOUSE',
  'SENATE',
  'CONFERENCE',
  'FINAL',
  'SUPPLEMENTAL',
])

const ChamberSchema = z.enum(['HOUSE', 'SENATE', 'JOINT'])

const DataSourceSchema = z.enum(['MANUAL', 'SEED', 'MA_LEGISLATURE', 'CONGRESS_GOV', 'CSV_IMPORT', 'JSON_IMPORT'])

export const AmendmentCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  amendmentNumber: z.string().optional(),
  type: AmendmentTypeSchema.optional().default('AMENDMENT'),
  description: z.string().optional(),
  filedBy: z.string().optional(),
  stage: BudgetSourceStageSchema.optional(),
  chamber: ChamberSchema.optional(),
  amount: z.coerce.number().nonnegative().optional(),
  status: AmendmentStatusSchema.optional().default('FILED'),
  statusDate: z.coerce.date().optional(),
  eoRelevanceNotes: z.string().optional(),
  sourceUrl: z.string().url().optional().or(z.literal('')),
  budgetItemId: z.coerce.number().int().positive().optional(),
  legislativeItemId: z.coerce.number().int().positive().optional(),
  dataSource: DataSourceSchema.optional(),
  sourceExternalId: z.string().optional(),
})

export type AmendmentCreateInput = z.infer<typeof AmendmentCreateSchema>

export const AmendmentUpdateSchema = AmendmentCreateSchema.partial()

export type AmendmentUpdateInput = z.infer<typeof AmendmentUpdateSchema>
