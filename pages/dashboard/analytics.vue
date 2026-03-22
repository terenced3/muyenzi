<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Analytics – Muyenzi' })

const supabase = useSupabaseClient()
const { user } = useUser()

const trends = ref<{ visit_date: string; visit_count: number }[]>([])
const hourly = ref<{ hour: number; visit_count: number }[]>([])
const siteData = ref<{ name: string; count: number }[]>([])
const currentlyInside = ref(0)
const loading = ref(true)

async function fetchData() {
  if (!user.value) return
  const companyId = user.value.company_id

  const [{ data: t }, { data: h }, { data: s }] = await Promise.all([
    supabase.rpc('get_visit_trends', { p_company_id: companyId, p_days: 30 }),
    supabase.rpc('get_hourly_distribution', { p_company_id: companyId, p_days: 30 }),
    supabase.from('visits').select('site_id, site:sites(name), status').eq('company_id', companyId).neq('status', 'cancelled'),
  ])

  trends.value = (t ?? []) as typeof trends.value
  hourly.value = (h ?? []) as typeof hourly.value

  const siteMap = new Map<string, { name: string; count: number }>()
  for (const v of s ?? []) {
    const siteName = (v.site as unknown as { name: string })?.name ?? 'Unknown'
    const existing = siteMap.get(v.site_id) ?? { name: siteName, count: 0 }
    siteMap.set(v.site_id, { ...existing, count: existing.count + 1 })
  }
  siteData.value = Array.from(siteMap.values()).sort((a, b) => b.count - a.count)
  currentlyInside.value = (s ?? []).filter(v => v.status === 'checked_in').length
  loading.value = false
}

watch(user, (u) => { if (u) fetchData() }, { immediate: true })
</script>

<template>
  <div class="flex flex-col h-full">
    <LayoutTopbar title="Analytics" description="Last 30 days of visitor activity" />

    <div class="flex-1 overflow-y-auto p-6 space-y-6">
      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-400 font-medium">30-day overview</p>
        <SharedExportMenu :company-id="user?.company_id ?? ''" />
      </div>

      <!-- Active visitors alert -->
      <UAlert
        v-if="currentlyInside > 0"
        color="yellow"
        variant="soft"
        icon="i-lucide-activity"
        :description="`${currentlyInside} visitor${currentlyInside !== 1 ? 's' : ''} currently inside the building`"
      />

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <UCard>
          <template #header>
            <h3 class="font-bold text-gray-900">Visitor Trends (30 days)</h3>
          </template>
          <AnalyticsVisitTrendsChart :data="trends" />
        </UCard>

        <UCard>
          <template #header>
            <h3 class="font-bold text-gray-900">Peak Hours</h3>
          </template>
          <AnalyticsHourlyChart :data="hourly" />
        </UCard>
      </div>

      <UCard>
        <template #header>
          <h3 class="font-bold text-gray-900">Visits by Site</h3>
        </template>
        <AnalyticsSiteBreakdown :data="siteData" />
      </UCard>
    </div>
  </div>
</template>
