import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, UserCheck, CalendarClock, TrendingUp } from 'lucide-react'
import StatsCard from '@/components/dashboard/StatsCard'
import RecentVisitsTable from '@/components/dashboard/RecentVisitsTable'
import Topbar from '@/components/layout/Topbar'
import type { VisitWithRelations } from '@/types/database'
import Link from 'next/link'
import { Button, Card, CardBody, CardHeader } from '@heroui/react'

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

  const { data: stats } = await supabase
    .rpc('get_company_stats', { p_company_id: companyId })

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
    <div className="flex flex-col h-full">
      <Topbar title="Overview" description="Welcome back — here's what's happening today" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatsCard
            title="Visitors Today"
            value={typedStats?.visitors_today ?? 0}
            icon={Users}
            description="Total check-ins today"
            accent="primary"
          />
          <StatsCard
            title="Currently Inside"
            value={typedStats?.currently_inside ?? 0}
            icon={UserCheck}
            description="Active on premises"
            accent="success"
          />
          <StatsCard
            title="Upcoming Visits"
            value={typedStats?.upcoming_visits ?? 0}
            icon={CalendarClock}
            description="Pre-registered visitors"
            accent="warning"
          />
          <StatsCard
            title="This Week"
            value={typedStats?.visits_this_week ?? 0}
            icon={TrendingUp}
            description="Total visits this week"
            accent="secondary"
          />
        </div>

        {/* Recent visits */}
        <Card shadow="md" radius="lg" className="bg-content1">
          <CardHeader className="flex flex-row items-center justify-between px-6 py-4"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <div>
              <h3 className="font-bold text-foreground text-base">Recent Visits</h3>
              <p className="text-xs text-default-400 mt-0.5">Latest 10 visitor check-ins</p>
            </div>
            <Button
              as={Link}
              href="/dashboard/visitors"
              variant="flat"
              color="primary"
              size="sm"
              radius="lg"
              className="font-semibold"
            >
              View all →
            </Button>
          </CardHeader>
          <CardBody className="px-6 py-4">
            <RecentVisitsTable visits={(recentVisits ?? []) as VisitWithRelations[]} />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
