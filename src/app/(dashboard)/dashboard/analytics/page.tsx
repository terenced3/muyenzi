import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardBody, CardHeader } from '@heroui/react'
import Topbar from '@/components/layout/Topbar'
import VisitTrendsChart from '@/components/analytics/VisitTrendsChart'
import HourlyChart from '@/components/analytics/HourlyChart'
import SiteBreakdown from '@/components/analytics/SiteBreakdown'
import ExportMenu from '@/components/shared/ExportMenu'

export const metadata = { title: 'Analytics – Muyenzi' }

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('company_id').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const companyId = profile.company_id

  const [{ data: trends }, { data: hourly }, { data: sites }] = await Promise.all([
    supabase.rpc('get_visit_trends', { p_company_id: companyId, p_days: 30 }),
    supabase.rpc('get_hourly_distribution', { p_company_id: companyId, p_days: 30 }),
    supabase
      .from('visits')
      .select('site_id, site:sites(name), status')
      .eq('company_id', companyId)
      .neq('status', 'cancelled'),
  ])

  const siteMap = new Map<string, { name: string; count: number }>()
  for (const v of sites ?? []) {
    const siteName = (v.site as unknown as { name: string })?.name ?? 'Unknown'
    const existing = siteMap.get(v.site_id) ?? { name: siteName, count: 0 }
    siteMap.set(v.site_id, { ...existing, count: existing.count + 1 })
  }
  const siteData = Array.from(siteMap.values()).sort((a, b) => b.count - a.count)
  const currentlyInside = (sites ?? []).filter(v => v.status === 'checked_in').length

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Analytics" description="Last 30 days of visitor activity" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-default-400 font-medium">30-day overview</p>
          <ExportMenu companyId={companyId} />
        </div>

        {/* Active visitors alert */}
        {currentlyInside > 0 && (
          <Card
            shadow="none"
            radius="lg"
            className="border border-warning/30"
            style={{ background: 'rgba(245,158,11,0.06)' }}
          >
            <CardBody className="py-3.5 px-5 flex flex-row items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-warning animate-pulse shrink-0" />
              <p className="text-sm font-semibold text-warning">
                {currentlyInside} visitor{currentlyInside !== 1 ? 's' : ''} currently inside the building
              </p>
            </CardBody>
          </Card>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card shadow="md" radius="lg" className="bg-content1">
            <CardHeader className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="font-bold text-foreground text-base">Visitor Trends (30 days)</h3>
            </CardHeader>
            <CardBody className="px-6 py-4">
              <VisitTrendsChart data={(trends ?? []) as { visit_date: string; visit_count: number }[]} />
            </CardBody>
          </Card>

          <Card shadow="md" radius="lg" className="bg-content1">
            <CardHeader className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="font-bold text-foreground text-base">Peak Hours</h3>
            </CardHeader>
            <CardBody className="px-6 py-4">
              <HourlyChart data={(hourly ?? []) as { hour: number; visit_count: number }[]} />
            </CardBody>
          </Card>
        </div>

        <Card shadow="md" radius="lg" className="bg-content1">
          <CardHeader className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h3 className="font-bold text-foreground text-base">Visits by Site</h3>
          </CardHeader>
          <CardBody className="px-6 py-4">
            <SiteBreakdown data={siteData} />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
