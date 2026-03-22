<script setup lang="ts">
import type { VisitWithRelations } from '~/types/database'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Dashboard – Muyenzi' })

const supabase = useSupabaseClient()
const { user } = useUser()

const stats = ref<{ visitors_today: number; currently_inside: number; visits_this_week: number; upcoming_visits: number } | null>(null)
const recentVisits = ref<VisitWithRelations[]>([])
const loading = ref(true)

async function fetchData() {
  if (!user.value) return
  const companyId = user.value.company_id
  const [{ data: s }, { data: v }] = await Promise.all([
    supabase.rpc('get_company_stats', { p_company_id: companyId }),
    supabase
      .from('visits')
      .select('*, visitor:visitors(*), site:sites(*), host:users(*)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(10),
  ])
  stats.value = s as typeof stats.value
  recentVisits.value = (v ?? []) as VisitWithRelations[]
  loading.value = false
}

watch(user, (u) => { if (u) fetchData() }, { immediate: true })
</script>

<template>
  <div class="flex flex-col h-full">
    <LayoutTopbar title="Overview" description="Welcome back — here's what's happening today" />

    <div class="flex-1 overflow-y-auto p-6 space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <DashboardStatsCard
          title="Visitors Today"
          :value="stats?.visitors_today ?? 0"
          icon="i-lucide-users"
          description="Total check-ins today"
          accent="primary"
          :loading="loading"
        />
        <DashboardStatsCard
          title="Currently Inside"
          :value="stats?.currently_inside ?? 0"
          icon="i-lucide-user-check"
          description="Active on premises"
          accent="success"
          :loading="loading"
        />
        <DashboardStatsCard
          title="Upcoming Visits"
          :value="stats?.upcoming_visits ?? 0"
          icon="i-lucide-calendar-clock"
          description="Pre-registered visitors"
          accent="warning"
          :loading="loading"
        />
        <DashboardStatsCard
          title="This Week"
          :value="stats?.visits_this_week ?? 0"
          icon="i-lucide-trending-up"
          description="Total visits this week"
          accent="secondary"
          :loading="loading"
        />
      </div>

      <UCard :ui="{ divide: 'divide-y divide-gray-100' }">
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-bold text-gray-900">Recent Visits</h3>
              <p class="text-xs text-gray-400 mt-0.5">Latest 10 visitor check-ins</p>
            </div>
            <UButton variant="soft" size="sm" to="/dashboard/visitors">View all →</UButton>
          </div>
        </template>
        <DashboardRecentVisitsTable :visits="recentVisits" :loading="loading" />
      </UCard>
    </div>
  </div>
</template>
