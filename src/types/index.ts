// ─── Re-export Prisma Enums ───────────────────────────────────────────────────

export type {
  Role,
  Jurisdiction,
  Chamber,
  Priority,
  LegislativeStatus,
  BudgetSourceStage,
  BudgetStatus,
  HearingStatus,
  PolicyDisposition,
  BoardDiscussionStatus,
  BoardInterestLevel,
  GovernanceLabel,
  KnowledgeEntryType,
} from '@prisma/client'

// Re-export model types
export type {
  User,
  LegislativeItem,
  BudgetItem,
  Hearing,
  PolicyIdea,
  Document,
  Tag,
  Note,
  HistoryEntry,
  KnowledgeEntry,
  ExternalSourceRef,
  SyncLog,
} from '@prisma/client'

// ─── Serialized Types (Dates as strings for JSON transport) ───────────────────

import type {
  LegislativeItem,
  BudgetItem,
  Hearing,
  PolicyIdea,
  User,
  Note,
  Tag,
  Document,
  HistoryEntry,
  KnowledgeEntry,
} from '@prisma/client'

/** Recursively converts Date fields to strings. */
type Serialized<T> = {
  [K in keyof T]: T[K] extends Date
    ? string
    : T[K] extends Date | null
      ? string | null
      : T[K] extends Date[]
        ? string[]
        : T[K]
}

export type SerializedUser = Serialized<User>

export type SerializedLegislativeItem = Serialized<LegislativeItem>

export type SerializedBudgetItem = Serialized<BudgetItem>

export type SerializedHearing = Serialized<Hearing>

export type SerializedPolicyIdea = Serialized<PolicyIdea>

export type SerializedNote = Serialized<Note>

export type SerializedTag = Serialized<Tag>

export type SerializedDocument = Serialized<Document>

export type SerializedHistoryEntry = Serialized<HistoryEntry>

export type SerializedKnowledgeEntry = Serialized<KnowledgeEntry>

// ─── With Relations ───────────────────────────────────────────────────────────

export type LegislativeItemWithRelations = LegislativeItem & {
  staffLead?: User | null
  tags?: Tag[]
  documents?: Document[]
  notes?: Note[]
  history?: HistoryEntry[]
}

export type BudgetItemWithRelations = BudgetItem & {
  staffLead?: User | null
  tags?: Tag[]
  documents?: Document[]
  notes?: Note[]
  history?: HistoryEntry[]
}

export type HearingWithRelations = Hearing & {
  responsibleStaff?: User | null
  tags?: Tag[]
  documents?: Document[]
  notes?: Note[]
  legislativeItems?: LegislativeItem[]
  budgetItems?: BudgetItem[]
}

export type PolicyIdeaWithRelations = PolicyIdea & {
  submittedBy?: User | null
  tags?: Tag[]
  documents?: Document[]
  notes?: Note[]
  history?: HistoryEntry[]
}

export type KnowledgeEntryWithRelations = KnowledgeEntry & {
  tags?: Tag[]
  notes?: Note[]
  legislativeItems?: LegislativeItem[]
  budgetItems?: BudgetItem[]
  hearings?: Hearing[]
  policyIdeas?: PolicyIdea[]
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export type DashboardStats = {
  legislation: {
    total: number
    byStatus: Record<string, number>
    byPriority: Record<string, number>
    recentCount: number // added in last 30 days
  }
  budget: {
    total: number
    byStatus: Record<string, number>
    bySourceStage: Record<string, number>
  }
  hearings: {
    total: number
    upcoming: number
    thisWeek: number
  }
  policyIdeas: {
    total: number
    byDisposition: Record<string, number>
    needsAttention: number // NEEDS_RESEARCH | REFERRED_FOR_DISCUSSION
  }
  knowledge: {
    total: number
  }
}

// ─── Filter / Query Params ────────────────────────────────────────────────────

export type SortDirection = 'asc' | 'desc'

export type FilterParams = {
  search?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortDir?: SortDirection
}

export type LegislationFilterParams = FilterParams & {
  jurisdiction?: string
  status?: string
  priority?: string
  chamber?: string
  boardInterestLevel?: string
  issueCategory?: string
  staffLeadId?: number
  archived?: boolean
  tagNames?: string[]
}

export type BudgetFilterParams = FilterParams & {
  fiscalYear?: number
  jurisdiction?: string
  status?: string
  sourceStage?: string
  priority?: string
  boardDiscussionStatus?: string
  staffLeadId?: number
  archived?: boolean
  tagNames?: string[]
}

export type HearingFilterParams = FilterParams & {
  status?: string
  jurisdiction?: string
  responsibleStaffId?: number
  dateFrom?: string
  dateTo?: string
  tagNames?: string[]
}

export type PolicyIdeaFilterParams = FilterParams & {
  disposition?: string
  issueArea?: string
  submittedById?: number
  archived?: boolean
  tagNames?: string[]
}

export type KnowledgeFilterParams = FilterParams & {
  entryType?: string
  tagNames?: string[]
}

// ─── Paginated Response ───────────────────────────────────────────────────────

export type PaginatedResult<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
  pageCount: number
}

// ─── API Response ─────────────────────────────────────────────────────────────

export type ApiSuccess<T> = { success: true; data: T }
export type ApiError = {
  success: false
  error: string
  fieldErrors?: Record<string, string[]>
}
export type ApiResponse<T> = ApiSuccess<T> | ApiError
