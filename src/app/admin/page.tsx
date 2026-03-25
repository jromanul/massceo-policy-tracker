import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Activity, ShieldCheck } from 'lucide-react'

export default function AdminPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Admin"
        description="System administration and diagnostics."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/admin/sync-status">
          <Card className="hover:border-slate-300 transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <Activity size={18} />
                </div>
                <CardTitle>Sync Status</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">
                View data source health, record counts, and recent sync activity.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/data-integrity">
          <Card className="hover:border-slate-300 transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 text-green-600">
                  <ShieldCheck size={18} />
                </div>
                <CardTitle>Data Integrity</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">
                Check for missing fields, orphaned records, and data quality issues.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
