import type {
  LegislativeStatus,
  BudgetStatus,
  BudgetProcessStatus,
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
} from '@prisma/client'

// ─── Status Colors ────────────────────────────────────────────────────────────
//
// Massachusetts Commonwealth palette — restrained, presentation-ready. All
// badges use the same semantic pattern: low-saturation tinted background + deep
// text color, no hard outlines. Five semantic roles: success / info / warn /
// error / neutral. Reference: src/app/globals.css (--status-*-text / -bg).

const SUCCESS = 'bg-[#e6f4ec] text-[#1f6b44]' // adopted / enacted / completed
const INFO = 'bg-[#e9f2f9] text-[#1f4e8c]'    // active / proposed / in-progress
const INFO_STRONG = 'bg-[#dde9f5] text-[#0b3d76]' // advanced-state variant
const WARN = 'bg-[#fdf4dc] text-[#8a6410]'     // monitoring / under-review
const ERROR = 'bg-[#fbebe7] text-[#8b2a1f]'    // vetoed / rejected / cancelled
const NEUTRAL = 'bg-[#eef0f4] text-[#4a5160]'  // filed / dead / archived / quiet

export const LEGISLATIVE_STATUS_COLORS: Record<LegislativeStatus, string> = {
  FILED: NEUTRAL,
  IN_COMMITTEE: INFO,
  REPORTED_OUT: INFO_STRONG,
  PASSED_ONE_CHAMBER: INFO_STRONG,
  PASSED_BOTH_CHAMBERS: INFO_STRONG,
  ENACTED: SUCCESS,
  VETOED: ERROR,
  DEAD: NEUTRAL,
  MONITORING: WARN,
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
  PROPOSED: INFO,
  UNDER_REVIEW: WARN,
  AMENDED: INFO_STRONG,
  ADOPTED: SUCCESS,
  REJECTED: ERROR,
  MONITORING: NEUTRAL,
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
  UPCOMING: INFO,
  COMPLETED: SUCCESS,
  CANCELED: ERROR,
  MONITORING_ONLY: NEUTRAL,
}

export const HEARING_STATUS_DISPLAY: Record<HearingStatus, string> = {
  UPCOMING: 'Upcoming',
  COMPLETED: 'Completed',
  CANCELED: 'Canceled',
  MONITORING_ONLY: 'Monitoring Only',
}

export const POLICY_DISPOSITION_COLORS: Record<PolicyDisposition, string> = {
  SUBMITTED: INFO,
  UNDER_REVIEW: WARN,
  NEEDS_RESEARCH: WARN,
  REFERRED_FOR_DISCUSSION: INFO_STRONG,
  MONITORING: NEUTRAL,
  DEFERRED: NEUTRAL,
  CLOSED: ERROR,
  ARCHIVED: NEUTRAL,
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

export const BUDGET_PROCESS_STATUS_COLORS: Record<BudgetProcessStatus, string> = {
  COMPLETED: SUCCESS,
  CURRENT: INFO_STRONG,
  UPCOMING: NEUTRAL,
  NOT_YET_AVAILABLE: 'bg-[#f4f6fa] text-[#8a92a0]',
}

export const BUDGET_PROCESS_STATUS_DISPLAY: Record<BudgetProcessStatus, string> = {
  COMPLETED: 'Completed',
  CURRENT: 'Current Stage',
  UPCOMING: 'Upcoming',
  NOT_YET_AVAILABLE: 'Not Yet Available',
}

export const BOARD_INTEREST_COLORS: Record<BoardInterestLevel, string> = {
  HIGH: ERROR,
  MEDIUM: WARN,
  LOW: SUCCESS,
  NONE: NEUTRAL,
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
  NOT_DISCUSSED: NEUTRAL,
  SCHEDULED: INFO,
  DISCUSSED: SUCCESS,
  ACTION_REQUIRED: WARN,
  RESOLVED: SUCCESS,
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
  FILED: INFO,
  PENDING: WARN,
  ADOPTED: SUCCESS,
  REJECTED: ERROR,
  WITHDRAWN: NEUTRAL,
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
  IMPORTED: NEUTRAL,
  REVIEWED: INFO,
  ACTIVELY_TRACKED: SUCCESS,
  ARCHIVED_NOT_RELEVANT: NEUTRAL,
}

export const TRACKING_TIER_DISPLAY: Record<TrackingTier, string> = {
  IMPORTED: 'Imported',
  REVIEWED: 'Reviewed',
  ACTIVELY_TRACKED: 'Actively Tracked',
  ARCHIVED_NOT_RELEVANT: 'Archived (Not Relevant)',
}

// ─── Hearing Type ────────────────────────────────────────────────────────────

export const HEARING_TYPE_COLORS: Record<HearingType, string> = {
  LEGISLATIVE: INFO,
  BUDGET: INFO_STRONG,
  PUBLIC_COMMENT: WARN,
  OTHER: NEUTRAL,
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

// ─── Priority Colors ──────────────────────────────────────────────────────────

export const PRIORITY_COLORS: Record<Priority, string> = {
  CRITICAL: ERROR,
  HIGH: WARN,
  MEDIUM: WARN,
  LOW: SUCCESS,
  INFORMATIONAL: NEUTRAL,
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
  STAFF_ANALYSIS: INFO,
  MONITORING_NOTE: NEUTRAL,
  BOARD_IDEA: INFO_STRONG,
  BOARD_DISCUSSION: INFO_STRONG,
  FORMAL_RECOMMENDATION: SUCCESS,
  ARCHIVED: NEUTRAL,
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

// ─── MA Committee Codes ──────────────────────────────────────────────────────
//
// Source of truth: https://malegislature.gov/Committees (scraped 2026-05-15).
// Covers all 56 committees of the 194th Massachusetts General Court — joint,
// House-only, Senate-only, special joint, and active subcommittees.
//
// IMPORTANT: committee codes are reassigned at the start of each new General
// Court session. When the 195th session convenes in January 2027, this map
// must be re-scraped from malegislature.gov/Committees and replaced wholesale.
// Stale mappings cause bills to display under the wrong committee name.

export const MA_COMMITTEE_CODES: Record<string, string> = {
  // House-only committees
  H33: 'House Committee on Rules',
  H34: 'House Committee on Ways and Means',
  H36: 'House Committee on Bills in the Third Reading',
  H38: 'House Committee on Ethics',
  H45: 'House Committee on Human Resources and Employee Engagement',
  H46: 'House Committee on Post Audit and Oversight',
  H51: 'House Committee on Climate Action and Sustainability',
  H52: 'House Committee on Steering, Policy and Scheduling',
  H53: 'House Committee on Operations, Facilities and Security',
  H54: 'House Committee on Federal Funding, Policy and Accountability',

  // Joint committees
  J10: 'Joint Committee on Municipalities and Regional Government',
  J11: 'Joint Committee on Financial Services',
  J12: 'Joint Committee on Economic Development and Emerging Technologies',
  J13: 'Joint Committee on Children, Families and Persons with Disabilities',
  J14: 'Joint Committee on Education',
  J15: 'Joint Committee on Election Laws',
  J16: 'Joint Committee on Public Health',
  J17: 'Joint Committee on Consumer Protection and Professional Licensure',
  J18: 'Joint Committee on Mental Health, Substance Use and Recovery',
  J19: 'Joint Committee on the Judiciary',
  J21: 'Joint Committee on Environment and Natural Resources',
  J22: 'Joint Committee on Public Safety and Homeland Security',
  J23: 'Joint Committee on Public Service',
  J24: 'Joint Committee on Health Care Financing',
  J25: 'Joint Committee on State Administration and Regulatory Oversight',
  J26: 'Joint Committee on Revenue',
  J27: 'Joint Committee on Transportation',
  J28: 'Joint Committee on Housing',
  J29: 'Joint Committee on Higher Education',
  J30: 'Joint Committee on Tourism, Arts and Cultural Development',
  J31: 'Joint Committee on Veterans and Federal Affairs',
  J32: 'Joint Committee on Bonding, Capital Expenditures and State Assets',
  J33: 'Joint Committee on Advanced Information Technology, the Internet and Cybersecurity',
  J34: 'Joint Committee on Racial Equity, Civil Rights, and Inclusion',
  J37: 'Joint Committee on Telecommunications, Utilities and Energy',
  J39: 'Joint Committee on Ways and Means',
  J40: 'Joint Committee on Rules',
  J43: 'Joint Committee on Labor and Workforce Development',
  J45: 'Joint Committee on Agriculture and Fisheries',
  J46: 'Joint Committee on Aging and Independence',
  J47: 'Joint Committee on Community Development and Small Businesses',
  J50: 'Joint Committee on Cannabis Policy',
  J52: 'Joint Committee on Emergency Preparedness and Management',

  // Senate-only committees
  S29: 'Senate Committee on Rules',
  S30: 'Senate Committee on Ways and Means',
  S31: 'Senate Committee on Bills in the Third Reading',
  S48: 'Senate Committee on Post Audit and Oversight',
  S50: 'Senate Committee on Steering and Policy',
  S51: 'Senate Committee on Climate Change and Global Warming',
  S53: 'Senate Committee on Personnel and Administration',
  S55: 'Senate Committee on Intergovernmental Affairs',
  S56: 'Senate Committee on Ethics',
  S65: 'Senate Committee on the Census',
  S66: 'Senate Committee on Juvenile and Emerging Adult Justice',

  // Special joint + subcommittee
  SJ42: 'Special Joint Committee on Initiative Petitions',
  TS10: 'Subcommittee on Chapter 250 of the Acts of 2024',
}

/**
 * Resolve a committee code to its verified human-readable name.
 *
 * Returns the mapped name if the code is in MA_COMMITTEE_CODES (verified
 * against malegislature.gov). Returns null otherwise — callers should hide
 * committee display rather than show an unverified raw code to users.
 *
 * For hearing data where the value is already a full committee title rather
 * than a short code, the function falls back to returning the title as-is
 * (titles come directly from malegislature.gov hearing pages).
 */
export function resolveCommitteeName(code: string | null | undefined): string | null {
  if (!code) return null
  if (MA_COMMITTEE_CODES[code]) return MA_COMMITTEE_CODES[code]
  // Heuristic: short codes (≤6 chars, alphanumeric) that aren't in the map are
  // unverified. Don't display them. Anything longer is treated as a pre-resolved
  // committee title from hearing data and returned as-is.
  if (/^[A-Z]{1,3}[0-9]{1,3}$/.test(code)) return null
  return code
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export const NAV_ITEMS: { label: string; href: string; icon: string }[] = [
  { label: 'Dashboard', href: '/', icon: 'LayoutDashboard' },
  { label: 'MA Legislation', href: '/legislation', icon: 'ScrollText' },
  { label: 'Budget', href: '/budget', icon: 'DollarSign' },
  { label: 'Hearings & Calendar', href: '/hearings', icon: 'CalendarDays' },
  { label: 'National Employee Ownership Legislation Tracker', href: '/other-state-centers', icon: 'Map' },
  { label: 'Peer State Policy Overview', href: '/policy-ideas', icon: 'Lightbulb' },
  { label: 'Admin', href: '/admin', icon: 'Settings' },
]
