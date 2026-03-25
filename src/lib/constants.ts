import type {
  LegislativeStatus,
  BudgetStatus,
  HearingStatus,
  PolicyDisposition,
  BoardInterestLevel,
  BoardDiscussionStatus,
  Priority,
  GovernanceLabel,
  BudgetSourceStage,
  Jurisdiction,
  Chamber,
  AmendmentStatus,
  AmendmentType,
  TrackingTier,
  HearingType,
  PolicyOriginType,
  KnowledgeEntryType,
} from '@prisma/client'

// ─── Status Colors ────────────────────────────────────────────────────────────

export const LEGISLATIVE_STATUS_COLORS: Record<LegislativeStatus, string> = {
  FILED: 'bg-gray-100 text-gray-700',
  IN_COMMITTEE: 'bg-blue-100 text-blue-800',
  REPORTED_OUT: 'bg-indigo-100 text-indigo-800',
  PASSED_ONE_CHAMBER: 'bg-violet-100 text-violet-800',
  PASSED_BOTH_CHAMBERS: 'bg-purple-100 text-purple-800',
  ENACTED: 'bg-green-100 text-green-800',
  VETOED: 'bg-red-100 text-red-800',
  DEAD: 'bg-zinc-200 text-zinc-600',
  MONITORING: 'bg-yellow-100 text-yellow-800',
}

export const LEGISLATIVE_STATUS_DISPLAY: Record<LegislativeStatus, string> = {
  FILED: 'Filed',
  IN_COMMITTEE: 'In Committee',
  REPORTED_OUT: 'Reported Out',
  PASSED_ONE_CHAMBER: 'Passed One Chamber',
  PASSED_BOTH_CHAMBERS: 'Passed Both Chambers',
  ENACTED: 'Enacted',
  VETOED: 'Vetoed',
  DEAD: 'Dead',
  MONITORING: 'Monitoring',
}

export const BUDGET_STATUS_COLORS: Record<BudgetStatus, string> = {
  PROPOSED: 'bg-blue-100 text-blue-800',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
  AMENDED: 'bg-orange-100 text-orange-800',
  ADOPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  MONITORING: 'bg-gray-100 text-gray-700',
}

export const BUDGET_STATUS_DISPLAY: Record<BudgetStatus, string> = {
  PROPOSED: 'Proposed',
  UNDER_REVIEW: 'Under Review',
  AMENDED: 'Amended',
  ADOPTED: 'Adopted',
  REJECTED: 'Rejected',
  MONITORING: 'Monitoring',
}

export const HEARING_STATUS_COLORS: Record<HearingStatus, string> = {
  UPCOMING: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELED: 'bg-red-100 text-red-800',
  MONITORING_ONLY: 'bg-gray-100 text-gray-700',
}

export const HEARING_STATUS_DISPLAY: Record<HearingStatus, string> = {
  UPCOMING: 'Upcoming',
  COMPLETED: 'Completed',
  CANCELED: 'Canceled',
  MONITORING_ONLY: 'Monitoring Only',
}

export const POLICY_DISPOSITION_COLORS: Record<PolicyDisposition, string> = {
  SUBMITTED: 'bg-blue-100 text-blue-800',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
  NEEDS_RESEARCH: 'bg-orange-100 text-orange-800',
  REFERRED_FOR_DISCUSSION: 'bg-indigo-100 text-indigo-800',
  MONITORING: 'bg-gray-100 text-gray-700',
  DEFERRED: 'bg-zinc-100 text-zinc-700',
  CLOSED: 'bg-red-100 text-red-800',
  ARCHIVED: 'bg-zinc-200 text-zinc-600',
}

export const POLICY_DISPOSITION_DISPLAY: Record<PolicyDisposition, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  NEEDS_RESEARCH: 'Needs Research',
  REFERRED_FOR_DISCUSSION: 'Referred for Discussion',
  MONITORING: 'Monitoring',
  DEFERRED: 'Deferred',
  CLOSED: 'Closed',
  ARCHIVED: 'Archived',
}

export const BOARD_INTEREST_COLORS: Record<BoardInterestLevel, string> = {
  HIGH: 'bg-red-100 text-red-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW: 'bg-green-100 text-green-800',
  NONE: 'bg-gray-100 text-gray-500',
}

export const BOARD_INTEREST_DISPLAY: Record<BoardInterestLevel, string> = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
  NONE: 'None',
}

export const BOARD_DISCUSSION_STATUS_COLORS: Record<
  BoardDiscussionStatus,
  string
> = {
  NOT_DISCUSSED: 'bg-gray-100 text-gray-500',
  SCHEDULED: 'bg-blue-100 text-blue-800',
  DISCUSSED: 'bg-green-100 text-green-800',
  ACTION_REQUIRED: 'bg-orange-100 text-orange-800',
  RESOLVED: 'bg-emerald-100 text-emerald-800',
}

export const BOARD_DISCUSSION_STATUS_DISPLAY: Record<
  BoardDiscussionStatus,
  string
> = {
  NOT_DISCUSSED: 'Not Discussed',
  SCHEDULED: 'Scheduled',
  DISCUSSED: 'Discussed',
  ACTION_REQUIRED: 'Action Required',
  RESOLVED: 'Resolved',
}

// ─── Amendment Status ─────────────────────────────────────────────────────────

export const AMENDMENT_STATUS_COLORS: Record<AmendmentStatus, string> = {
  FILED: 'bg-gray-100 text-gray-700',
  PENDING: 'bg-yellow-100 text-yellow-800',
  ADOPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  WITHDRAWN: 'bg-zinc-200 text-zinc-600',
}

export const AMENDMENT_STATUS_DISPLAY: Record<AmendmentStatus, string> = {
  FILED: 'Filed',
  PENDING: 'Pending',
  ADOPTED: 'Adopted',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
}

export const AMENDMENT_TYPE_DISPLAY: Record<AmendmentType, string> = {
  AMENDMENT: 'Amendment',
  EARMARK: 'Earmark',
}

// ─── Tracking Tier ───────────────────────────────────────────────────────────

export const TRACKING_TIER_COLORS: Record<TrackingTier, string> = {
  IMPORTED: 'bg-gray-100 text-gray-700',
  REVIEWED: 'bg-blue-100 text-blue-800',
  ACTIVELY_TRACKED: 'bg-green-100 text-green-800',
  ARCHIVED_NOT_RELEVANT: 'bg-zinc-200 text-zinc-600',
}

export const TRACKING_TIER_DISPLAY: Record<TrackingTier, string> = {
  IMPORTED: 'Imported',
  REVIEWED: 'Reviewed',
  ACTIVELY_TRACKED: 'Actively Tracked',
  ARCHIVED_NOT_RELEVANT: 'Archived (Not Relevant)',
}

// ─── Hearing Type ────────────────────────────────────────────────────────────

export const HEARING_TYPE_COLORS: Record<HearingType, string> = {
  LEGISLATIVE: 'bg-blue-100 text-blue-800',
  BUDGET: 'bg-violet-100 text-violet-800',
  PUBLIC_COMMENT: 'bg-orange-100 text-orange-800',
  OTHER: 'bg-gray-100 text-gray-700',
}

export const HEARING_TYPE_DISPLAY: Record<HearingType, string> = {
  LEGISLATIVE: 'Legislative',
  BUDGET: 'Budget',
  PUBLIC_COMMENT: 'Public Comment',
  OTHER: 'Other',
}

// ─── Policy Origin Type ──────────────────────────────────────────────────────

export const POLICY_ORIGIN_TYPE_DISPLAY: Record<PolicyOriginType, string> = {
  BOARD_MEMBER: 'Board Member',
  STAFF: 'Staff',
  EXTERNAL_STAKEHOLDER: 'External Stakeholder',
  COMMITTEE: 'Committee',
}

// ─── Knowledge Entry Type ────────────────────────────────────────────────────

export const KNOWLEDGE_ENTRY_TYPE_DISPLAY: Record<KnowledgeEntryType, string> = {
  ARCHIVED_LEGISLATION: 'Archived Legislation',
  ARCHIVED_BUDGET: 'Archived Budget',
  ARCHIVED_POLICY_IDEA: 'Archived Policy Idea',
  DISCUSSION_CONTEXT: 'Discussion Context',
  HANDOFF_NOTE: 'Handoff Note',
  HISTORICAL_NOTE: 'Historical Note',
  RESEARCH_SUMMARY: 'Research Summary',
  UNRESOLVED_QUESTION: 'Unresolved Question',
  BOARD_CONTEXT: 'Board Context',
}

// ─── Priority Colors ──────────────────────────────────────────────────────────

export const PRIORITY_COLORS: Record<Priority, string> = {
  CRITICAL: 'bg-red-100 text-red-900',
  HIGH: 'bg-orange-100 text-orange-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW: 'bg-green-100 text-green-800',
  INFORMATIONAL: 'bg-gray-100 text-gray-600',
}

export const PRIORITY_DISPLAY: Record<Priority, string> = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
  INFORMATIONAL: 'Informational',
}

// ─── Governance Label Colors & Display ───────────────────────────────────────

export const GOVERNANCE_LABEL_COLORS: Record<GovernanceLabel, string> = {
  STAFF_ANALYSIS: 'bg-blue-100 text-blue-800',
  MONITORING_NOTE: 'bg-gray-100 text-gray-700',
  BOARD_IDEA: 'bg-violet-100 text-violet-800',
  BOARD_DISCUSSION: 'bg-indigo-100 text-indigo-800',
  FORMAL_RECOMMENDATION: 'bg-emerald-100 text-emerald-800',
  ARCHIVED: 'bg-zinc-200 text-zinc-600',
}

export const GOVERNANCE_LABEL_DISPLAY: Record<GovernanceLabel, string> = {
  STAFF_ANALYSIS: 'Staff Analysis',
  MONITORING_NOTE: 'Monitoring Note',
  BOARD_IDEA: 'Board Idea',
  BOARD_DISCUSSION: 'Board Discussion',
  FORMAL_RECOMMENDATION: 'Formal Recommendation',
  ARCHIVED: 'Archived',
}

// ─── Form Select Options ──────────────────────────────────────────────────────

export const JURISDICTION_OPTIONS: { label: string; value: Jurisdiction }[] = [
  { label: 'Massachusetts', value: 'MASSACHUSETTS' },
  { label: 'Federal', value: 'FEDERAL' },
]

export const CHAMBER_OPTIONS: { label: string; value: Chamber }[] = [
  { label: 'House', value: 'HOUSE' },
  { label: 'Senate', value: 'SENATE' },
  { label: 'Joint', value: 'JOINT' },
]

export const PRIORITY_OPTIONS: { label: string; value: Priority }[] = [
  { label: 'Critical', value: 'CRITICAL' },
  { label: 'High', value: 'HIGH' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'Low', value: 'LOW' },
  { label: 'Informational', value: 'INFORMATIONAL' },
]

export const LEGISLATIVE_STATUS_OPTIONS: {
  label: string
  value: LegislativeStatus
}[] = Object.entries(LEGISLATIVE_STATUS_DISPLAY).map(([value, label]) => ({
  value: value as LegislativeStatus,
  label,
}))

export const BUDGET_STATUS_OPTIONS: {
  label: string
  value: BudgetStatus
}[] = Object.entries(BUDGET_STATUS_DISPLAY).map(([value, label]) => ({
  value: value as BudgetStatus,
  label,
}))

export const BUDGET_SOURCE_STAGES: {
  label: string
  value: BudgetSourceStage
}[] = [
  { label: "Governor's Budget", value: 'GOVERNOR' },
  { label: 'House Budget', value: 'HOUSE' },
  { label: 'Senate Budget', value: 'SENATE' },
  { label: 'Conference Committee', value: 'CONFERENCE' },
  { label: 'Final / Enacted', value: 'FINAL' },
  { label: 'Supplemental', value: 'SUPPLEMENTAL' },
]

export const HEARING_STATUS_OPTIONS: {
  label: string
  value: HearingStatus
}[] = Object.entries(HEARING_STATUS_DISPLAY).map(([value, label]) => ({
  value: value as HearingStatus,
  label,
}))

export const POLICY_DISPOSITION_OPTIONS: {
  label: string
  value: PolicyDisposition
}[] = Object.entries(POLICY_DISPOSITION_DISPLAY).map(([value, label]) => ({
  value: value as PolicyDisposition,
  label,
}))

export const BOARD_INTEREST_OPTIONS: {
  label: string
  value: BoardInterestLevel
}[] = Object.entries(BOARD_INTEREST_DISPLAY).map(([value, label]) => ({
  value: value as BoardInterestLevel,
  label,
}))

export const BOARD_DISCUSSION_STATUS_OPTIONS: {
  label: string
  value: BoardDiscussionStatus
}[] = Object.entries(BOARD_DISCUSSION_STATUS_DISPLAY).map(
  ([value, label]) => ({
    value: value as BoardDiscussionStatus,
    label,
  }),
)

export const GOVERNANCE_LABEL_OPTIONS: {
  label: string
  value: GovernanceLabel
}[] = Object.entries(GOVERNANCE_LABEL_DISPLAY).map(([value, label]) => ({
  value: value as GovernanceLabel,
  label,
}))

export const AMENDMENT_STATUS_OPTIONS: {
  label: string
  value: AmendmentStatus
}[] = Object.entries(AMENDMENT_STATUS_DISPLAY).map(([value, label]) => ({
  value: value as AmendmentStatus,
  label,
}))

export const AMENDMENT_TYPE_OPTIONS: {
  label: string
  value: AmendmentType
}[] = Object.entries(AMENDMENT_TYPE_DISPLAY).map(([value, label]) => ({
  value: value as AmendmentType,
  label,
}))

export const TRACKING_TIER_OPTIONS: {
  label: string
  value: TrackingTier
}[] = Object.entries(TRACKING_TIER_DISPLAY).map(([value, label]) => ({
  value: value as TrackingTier,
  label,
}))

export const HEARING_TYPE_OPTIONS: {
  label: string
  value: HearingType
}[] = Object.entries(HEARING_TYPE_DISPLAY).map(([value, label]) => ({
  value: value as HearingType,
  label,
}))

export const POLICY_ORIGIN_TYPE_OPTIONS: {
  label: string
  value: PolicyOriginType
}[] = Object.entries(POLICY_ORIGIN_TYPE_DISPLAY).map(([value, label]) => ({
  value: value as PolicyOriginType,
  label,
}))

export const KNOWLEDGE_ENTRY_TYPE_OPTIONS: {
  label: string
  value: KnowledgeEntryType
}[] = Object.entries(KNOWLEDGE_ENTRY_TYPE_DISPLAY).map(([value, label]) => ({
  value: value as KnowledgeEntryType,
  label,
}))

// ─── MA Committee Codes ──────────────────────────────────────────────────────

export const MA_COMMITTEE_CODES: Record<string, string> = {
  J11: 'Joint Committee on Children, Families and Persons with Disabilities',
  J12: 'Joint Committee on Consumer Protection and Professional Licensure',
  J15: 'Joint Committee on Community Development and Small Businesses',
  J16: 'Joint Committee on Economic Development and Emerging Technologies',
  J18: 'Joint Committee on Labor and Workforce Development',
  J19: 'Joint Committee on Financial Services',
  J20: 'Joint Committee on Housing',
  J22: 'Joint Committee on Public Service',
  J24: 'Joint Committee on Revenue',
  J25: 'Joint Committee on State Administration and Regulatory Oversight',
  J26: 'Joint Committee on the Judiciary',
  J29: 'Joint Committee on Ways and Means',
  H31: 'House Committee on Ways and Means',
  H32: 'House Committee on Rules',
  S17: 'Senate Committee on Ways and Means',
  S18: 'Senate Committee on Rules',
}

/**
 * Resolve a committee code to a human-readable name.
 * Falls through to the raw code if no mapping exists.
 */
export function resolveCommitteeName(code: string | null | undefined): string | null {
  if (!code) return null
  return MA_COMMITTEE_CODES[code] ?? code
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export const NAV_ITEMS: { label: string; href: string; icon: string }[] = [
  { label: 'Dashboard', href: '/', icon: 'LayoutDashboard' },
  { label: 'Legislation', href: '/legislation', icon: 'ScrollText' },
  { label: 'Budget', href: '/budget', icon: 'DollarSign' },
  { label: 'Hearings & Calendar', href: '/hearings', icon: 'CalendarDays' },
  { label: 'EOAB Policy Ideas', href: '/policy-ideas', icon: 'Lightbulb' },
  { label: 'Knowledge / Archive', href: '/knowledge', icon: 'BookOpen' },
  { label: 'Admin', href: '/admin', icon: 'Settings' },
]
