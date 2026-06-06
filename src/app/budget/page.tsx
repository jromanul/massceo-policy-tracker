'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { getActiveBudgetFiscalYear } from '@/lib/utils'
import {
  BudgetProcessTimeline,
  type BudgetProcessStageData,
} from '@/components/shared/budget-process-timeline'

// FY currently being debated by the legislature (rolls forward each July 1).
// Derived from today rather than hardcoded so the page advances correctly
// when a new fiscal year begins.
const CURRENT_FY = getActiveBudgetFiscalYear()

export default function BudgetListPage() {
  const [timelineStages, setTimelineStages] = useState<BudgetProcessStageData[]>([])
  const [timelineFY, setTimelineFY] = useState(CURRENT_FY)
  const [loaded, setLoaded] = useState(false)

  // Fetch budget process timeline
  useEffect(() => {
    fetch(`/api/budget/timeline?fiscalYear=${CURRENT_FY}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.stages) {
          setTimelineStages(json.stages)
          setTimelineFY(json.fiscalYear)
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  return (
    <div className="space-y-5">
      <PageHeader
        title="Budget"
        description={`Massachusetts FY${CURRENT_FY} budget process timeline and MassCEO appropriation tracking.`}
      />

      {timelineStages.length > 0 ? (
        <Card>
          <CardContent className="py-5">
            <BudgetProcessTimeline
              fiscalYear={timelineFY}
              stages={timelineStages}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="py-12 text-center text-sm text-slate-500">
          {loaded ? 'Budget process timeline unavailable.' : 'Loading…'}
        </div>
      )}
    </div>
  )
}
