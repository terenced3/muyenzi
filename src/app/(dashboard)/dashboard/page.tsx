import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, UserCheck, CalendarClock, TrendingUp } from 'lucide-react'
import StatsCard from '@/components/dashboard/StatsCard'
import RecentVisitsTable from '@/components/dashboard/RecentVisitsTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Topbar from '@/components/layout/Topbar'
import type { VisitWithRelations } from '@/types/database'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'Dashboard – Muyenzi' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const companyId = profile.company_id

  // Fetch stats
  const { data: stats } = await supabase
    .rpc('get_company_stats', { p_company_id: companyId })

  // Fetch recent visits
  const { data: recentVisits } = await supabase
    .from('visits')
    .select('*, visitor:visitors(*), site:sites(*), host:users(*)')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(10)

  const typedStats = stats as {
    visitors_today: number
    currently_inside: number
    visits_this_week: number
    upcoming_visits: number
  } | null

  return (
    <div className="flex flex-col">
      <Topbar title="Overview" />
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatsCard
            title="Visitors Today"
            value={typedStats?.visitors_today ?? 0}
            icon={Users}
            description="Check-ins today"
          />
          <StatsCard
            title="Currently Inside"
            value={typedStats?.currently_inside ?? 0}
            icon={UserCheck}
            description="Active check-ins"
          />
          <StatsCard
            title="Upcoming Visits"
            value={typedStats?.upcoming_visits ?? 0}
            icon={CalendarClock}
            description="Pre-registered visitors"
          />
          <StatsCard
            title="This Week"
            value={typedStats?.visits_this_week ?? 0}
            icon={TrendingUp}
            description="Total visits this week"
          />
        </div>

        {/* Recent visits */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Visits</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/visitors">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <RecentVisitsTable visits={(recentVisits ?? []) as VisitWithRelations[]} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
