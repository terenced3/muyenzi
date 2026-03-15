import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Topbar from '@/components/layout/Topbar'
import VisitTrendsChart from '@/components/analytics/VisitTrendsChart'
import HourlyChart from '@/components/analytics/HourlyChart'
import SiteBreakdown from '@/components/analytics/SiteBreakdown'
import ExportMenu from '@/components/shared/ExportMenu'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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

  // Aggregate per-site
  const siteMap = new Map<string, { name: string; count: number }>()
  for (const v of sites ?? []) {
    const siteName = (v.site as unknown as { name: string })?.name ?? 'Unknown'
    const existing = siteMap.get(v.site_id) ?? { name: siteName, count: 0 }
    siteMap.set(v.site_id, { ...existing, count: existing.count + 1 })
  }
  const siteData = Array.from(siteMap.values()).sort((a, b) => b.count - a.count)

  const currentlyInside = (sites ?? []).filter(v => v.status === 'checked_in').length

  return (
    <div className="flex flex-col">
      <Topbar title="Analytics" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Last 30 days</p>
          <ExportMenu companyId={companyId} />
        </div>

        {/* Security alert */}
        {currentlyInside > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
              <p className="text-sm font-medium text-orange-800">
                <strong>{currentlyInside}</strong> visitor{currentlyInside !== 1 ? 's' : ''} currently inside the building
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Visitor Trends (30 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <VisitTrendsChart data={(trends ?? []) as { visit_date: string; visit_count: number }[]} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Peak Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <HourlyChart data={(hourly ?? []) as { hour: number; visit_count: number }[]} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Visits by Site</CardTitle>
          </CardHeader>
          <CardContent>
            <SiteBreakdown data={siteData} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
