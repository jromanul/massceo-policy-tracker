export const dynamic = 'force-dynamic'

import { PageHeader } from '@/components/layout/page-header'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { prisma } from '@/lib/db'
import { MA_COMMITTEE_CODES } from '@/lib/constants'

interface IntegrityCheck {
  label: string
  count: number
  description: string
  severity: 'info' | 'warning' | 'error'
}

async function getIntegrityChecks(): Promise<IntegrityCheck[]> {
  const checks: IntegrityCheck[] = []

  // Legislation missing sourceUrl
  const legNoSource = await prisma.legislativeItem.count({
    where: { sourceUrl: null, dataSource: { not: 'MANUAL' } },
  })
  checks.push({
    label: 'Legislation missing source URL',
    count: legNoSource,
    description: 'Non-manual legislative items without a link to their source.',
    severity: legNoSource > 0 ? 'warning' : 'info',
  })

  // Budget items missing lastSyncedAt
  const budgetNoSync = await prisma.budgetItem.count({
    where: { lastSyncedAt: null, dataSource: { not: 'MANUAL' } },
  })
  checks.push({
    label: 'Budget items missing sync timestamp',
    count: budgetNoSync,
    description: 'Non-manual budget items without a lastSyncedAt value.',
    severity: budgetNoSync > 0 ? 'warning' : 'info',
  })

  // Hearings with no related bills
  const hearingsNoRelated = await prisma.hearing.count({
    where: {
      legislativeItems: { none: {} },
      budgetItems: { none: {} },
    },
  })
  checks.push({
    label: 'Hearings with no related records',
    count: hearingsNoRelated,
    description: 'Hearings not linked to any legislation or budget items.',
    severity: hearingsNoRelated > 3 ? 'warning' : 'info',
  })

  // Knowledge entries with no relations
  const knowledgeOrphaned = await prisma.knowledgeEntry.count({
    where: {
      legislativeItems: { none: {} },
      budgetItems: { none: {} },
      hearings: { none: {} },
      policyIdeas: { none: {} },
    },
  })
  checks.push({
    label: 'Knowledge entries with no relations',
    count: knowledgeOrphaned,
    description: 'Knowledge/archive entries not linked to any tracked records.',
    severity: knowledgeOrphaned > 5 ? 'warning' : 'info',
  })

  // Unmapped committee codes
  const allCommittees = await prisma.legislativeItem.findMany({
    where: { assignedCommittee: { not: null } },
    select: { assignedCommittee: true },
    distinct: ['assignedCommittee'],
  })
  const unmapped = allCommittees.filter(
    (c) => c.assignedCommittee && !MA_COMMITTEE_CODES[c.assignedCommittee]
  )
  checks.push({
    label: 'Unmapped committee codes',
    count: unmapped.length,
    description: unmapped.length > 0
      ? `Codes: ${unmapped.map((c) => c.assignedCommittee).join(', ')}`
      : 'All committee codes have display names.',
    severity: unmapped.length > 0 ? 'warning' : 'info',
  })

  // Budget stages with inferred provenance
  const inferredStages = await prisma.budgetStage.count({
    where: { provenance: 'inferred' },
  })
  checks.push({
    label: 'Budget stages with inferred amounts',
    count: inferredStages,
    description: 'Budget stage amounts not directly sourced — carried forward or estimated.',
    severity: inferredStages > 0 ? 'info' : 'info',
  })

  // Policy ideas with no disposition action
  const policiesNoAction = await prisma.policyIdea.count({
    where: { disposition: 'SUBMITTED', archived: false },
  })
  checks.push({
    label: 'Policy ideas awaiting review',
    count: policiesNoAction,
    description: 'Submitted policy ideas that have not been reviewed or triaged.',
    severity: policiesNoAction > 3 ? 'warning' : 'info',
  })

  return checks
}

const SEVERITY_COLORS = {
  info: 'bg-slate-100 text-slate-600',
  warning: 'bg-amber-100 text-amber-700',
  error: 'bg-red-100 text-red-700',
}

export default async function DataIntegrityPage() {
  const checks = await getIntegrityChecks()
  const warnings = checks.filter((c) => c.severity !== 'info')

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Data Integrity' },
        ]}
      />

      <PageHeader
        title="Data Integrity"
        description="Check for missing fields, orphaned records, and data quality issues."
      />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{checks.length}</p>
            <p className="text-xs text-slate-500">Checks Run</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className={`text-2xl font-bold ${warnings.length > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {warnings.length}
            </p>
            <p className="text-xs text-slate-500">Warnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {checks.filter((c) => c.severity === 'info').length}
            </p>
            <p className="text-xs text-slate-500">Passing</p>
          </CardContent>
        </Card>
      </div>

      {/* Check details */}
      <Card>
        <CardHeader>
          <CardTitle>Integrity Checks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100">
            {checks.map((check, i) => (
              <div key={i} className="flex items-start gap-3 py-3">
                <span className={`inline-flex items-center justify-center rounded-full w-8 h-8 text-xs font-bold flex-shrink-0 ${SEVERITY_COLORS[check.severity]}`}>
                  {check.count}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-800">{check.label}</p>
                  <p className="text-xs text-slate-500">{check.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
