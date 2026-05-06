<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: [
    function () {
      const { can } = useUser()
      if (!can('view_analytics')) return navigateTo('/dashboard')
    },
  ],
})
useHead({ title: 'Analytics – Muyenzi' })

const supabase = useSupabaseClient()
const { user } = useUser()

// ── Filters ───────────────────────────────────────────────────
const sites = ref<{ id: string; name: string }[]>([])
const siteFilter = ref('')

// Preset ranges
type Preset = '7d' | '30d' | '90d' | 'custom'
const preset = ref<Preset>('30d')

const today = new Date().toISOString().slice(0, 10)
const customStart = ref(new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10))
const customEnd = ref(today)

const dateRange = computed(() => {
  if (preset.value === 'custom') return { start: customStart.value, end: customEnd.value }
  const days = preset.value === '7d' ? 7 : preset.value === '30d' ? 30 : 90
  const start = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10)
  return { start, end: today }
})

const presetOptions = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'Custom range', value: 'custom' },
]

// ── Data ──────────────────────────────────────────────────────
const trends = ref<{ visit_date: string; visit_count: number }[]>([])
const hourly = ref<{ hour: number; visit_count: number }[]>([])
const siteData = ref<{ name: string; count: number }[]>([])
const currentlyInside = ref(0)
const returnRate = ref<{ total_visitors: number; repeat_visitors: number; one_time_visitors: number; return_rate_pct: number } | null>(null)
const avgDuration = ref<{ avg_minutes: number; completed_visits: number } | null>(null)
const loading = ref(true)

async function fetchData() {
  if (!user.value) return
  loading.value = true
  const companyId = user.value.company_id
  const { start, end } = dateRange.value
  const site = siteFilter.value || undefined

  const [{ data: t }, { data: h }, { data: s }, { data: rr }, { data: ad }] = await Promise.all([
    supabase.rpc('get_visit_trends', {
      p_company_id: companyId,
      p_start_date: start,
      p_end_date: end,
      p_site_id: site ?? null,
    }),
    supabase.rpc('get_hourly_distribution', {
      p_company_id: companyId,
      p_start_date: start,
      p_end_date: end,
      p_site_id: site ?? null,
    }),
    supabase.from('visits')
      .select('site_id, site:sites(name), status')
      .eq('company_id', companyId)
      .neq('status', 'cancelled')
      .gte('visit_date', start)
      .lte('visit_date', end),
    supabase.rpc('get_return_rate', {
      p_company_id: companyId,
      p_start_date: start,
      p_end_date: end,
      p_site_id: site ?? null,
    }),
    supabase.rpc('get_avg_visit_duration', {
      p_company_id: companyId,
      p_start_date: start,
      p_end_date: end,
      p_site_id: site ?? null,
    }),
  ])

  trends.value = (t ?? []) as typeof trends.value
  hourly.value = (h ?? []) as typeof hourly.value

  // Site breakdown — respect site filter
  const filtered = siteFilter.value ? (s ?? []).filter((v: any) => v.site_id === siteFilter.value) : (s ?? [])
  const siteMap = new Map<string, { name: string; count: number }>()
  for (const v of filtered) {
    const name = (v.site as unknown as { name: string })?.name ?? 'Unknown'
    const ex = siteMap.get(v.site_id) ?? { name, count: 0 }
    siteMap.set(v.site_id, { ...ex, count: ex.count + 1 })
  }
  siteData.value = Array.from(siteMap.values()).sort((a, b) => b.count - a.count)
  currentlyInside.value = (s ?? []).filter((v: any) => v.status === 'checked_in').length

  returnRate.value = rr?.[0] ?? null
  avgDuration.value = ad?.[0] ?? null

  loading.value = false
}

async function loadSites() {
  if (!user.value) return
  const { data } = await supabase.from('sites').select('id, name').eq('company_id', user.value.company_id).order('name')
  sites.value = data ?? []
}

watch(user, (u) => { if (u) { loadSites(); fetchData() } }, { immediate: true })
watch([siteFilter, preset], () => fetchData())
watch([customStart, customEnd], () => { if (preset.value === 'custom') fetchData() })

// ── Helpers ───────────────────────────────────────────────────
function fmtDuration(mins: number | null): string {
  if (!mins) return '—'
  if (mins < 60) return `${Math.round(mins)}m`
  const h = Math.floor(mins / 60)
  const m = Math.round(mins % 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

const rangeLabel = computed(() => {
  const { start, end } = dateRange.value
  return `${start} → ${end}`
})
</script>

<template>
  <div class="flex flex-col h-full">
    <LayoutTopbar title="Analytics" :description="rangeLabel" />

    <div class="flex-1 overflow-y-auto p-6 space-y-6">

      <!-- ── Filter toolbar ── -->
      <div class="flex flex-wrap items-end gap-3">
        <!-- Preset picker -->
        <UFormGroup label="Period">
          <USelect v-model="preset" :options="presetOptions" class="w-44" />
        </UFormGroup>

        <!-- Custom date range -->
        <template v-if="preset === 'custom'">
          <UFormGroup label="From">
            <UInput v-model="customStart" type="date" :max="customEnd" class="w-40" />
          </UFormGroup>
          <UFormGroup label="To">
            <UInput v-model="customEnd" type="date" :min="customStart" :max="today" class="w-40" />
          </UFormGroup>
        </template>

        <!-- Site filter -->
        <UFormGroup label="Site">
          <USelect
            v-model="siteFilter"
            :options="[{ label: 'All sites', value: '' }, ...sites.map(s => ({ label: s.name, value: s.id }))]"
            class="w-44"
          />
        </UFormGroup>

        <div class="ml-auto pt-5">
          <SharedExportMenu :company-id="user?.company_id ?? ''" />
        </div>
      </div>

      <!-- ── Active visitors banner ── -->
      <UAlert
        v-if="currentlyInside > 0"
        color="yellow"
        variant="soft"
        icon="i-lucide-activity"
        :description="`${currentlyInside} visitor${currentlyInside !== 1 ? 's' : ''} currently inside`"
      />

      <!-- ── Stat cards ── -->
      <div class="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <!-- Total visits in range -->
        <UCard :ui="{ body: { padding: 'p-5' } }">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Total Visits</p>
              <p class="text-3xl font-bold text-gray-900">
                {{ loading ? '—' : trends.reduce((s, d) => s + d.visit_count, 0).toLocaleString() }}
              </p>
            </div>
            <div class="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-users" class="h-5 w-5 text-indigo-500" />
            </div>
          </div>
        </UCard>

        <!-- Avg daily visits -->
        <UCard :ui="{ body: { padding: 'p-5' } }">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Avg / Day</p>
              <p class="text-3xl font-bold text-gray-900">
                <template v-if="loading">—</template>
                <template v-else>
                  {{ (() => { const total = trends.reduce((s, d) => s + d.visit_count, 0); const activeDays = trends.filter(d => d.visit_count > 0).length; return activeDays ? (total / activeDays).toFixed(1) : '0' })() }}
                </template>
              </p>
            </div>
            <div class="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-calendar-days" class="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </UCard>

        <!-- Repeat visitor rate -->
        <UCard :ui="{ body: { padding: 'p-5' } }">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Return Rate</p>
              <p class="text-3xl font-bold text-gray-900">
                {{ loading || !returnRate ? '—' : `${returnRate.return_rate_pct ?? 0}%` }}
              </p>
              <p v-if="returnRate" class="text-xs text-gray-400 mt-0.5">
                {{ returnRate.repeat_visitors }} of {{ returnRate.total_visitors }} visitors
              </p>
            </div>
            <div class="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-repeat-2" class="h-5 w-5 text-green-500" />
            </div>
          </div>
        </UCard>

        <!-- Avg visit duration -->
        <UCard :ui="{ body: { padding: 'p-5' } }">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Avg Duration</p>
              <p class="text-3xl font-bold text-gray-900">
                {{ loading ? '—' : fmtDuration(avgDuration?.avg_minutes ?? null) }}
              </p>
              <p v-if="avgDuration" class="text-xs text-gray-400 mt-0.5">
                from {{ avgDuration.completed_visits }} completed visits
              </p>
            </div>
            <div class="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-clock" class="h-5 w-5 text-purple-500" />
            </div>
          </div>
        </UCard>
      </div>

      <!-- ── Charts ── -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <UCard>
          <template #header>
            <h3 class="font-bold text-gray-900">Visitor Trends</h3>
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

      <!-- ── Site breakdown + return rate breakdown ── -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <UCard>
          <template #header>
            <h3 class="font-bold text-gray-900">Visits by Site</h3>
          </template>
          <AnalyticsSiteBreakdown :data="siteData" />
        </UCard>

        <UCard>
          <template #header>
            <h3 class="font-bold text-gray-900">Visitor Loyalty</h3>
          </template>
          <div v-if="loading" class="h-40 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
          <div v-else-if="!returnRate || returnRate.total_visitors === 0" class="h-40 flex items-center justify-center text-gray-400 text-sm">No data for this period.</div>
          <div v-else class="space-y-4 py-2">
            <!-- First-time -->
            <div>
              <div class="flex justify-between text-sm mb-1.5">
                <span class="text-gray-700 font-medium">First-time visitors</span>
                <span class="font-semibold text-gray-900">{{ returnRate.one_time_visitors }}</span>
              </div>
              <div class="h-3 rounded-full bg-gray-100 overflow-hidden">
                <div
                  class="h-full rounded-full bg-blue-400 transition-all"
                  :style="{ width: `${100 - (returnRate.return_rate_pct ?? 0)}%` }"
                />
              </div>
            </div>
            <!-- Returning -->
            <div>
              <div class="flex justify-between text-sm mb-1.5">
                <span class="text-gray-700 font-medium">Returning visitors</span>
                <span class="font-semibold text-gray-900">{{ returnRate.repeat_visitors }}</span>
              </div>
              <div class="h-3 rounded-full bg-gray-100 overflow-hidden">
                <div
                  class="h-full rounded-full bg-green-400 transition-all"
                  :style="{ width: `${returnRate.return_rate_pct ?? 0}%` }"
                />
              </div>
            </div>
            <p class="text-xs text-gray-400 pt-1">
              {{ returnRate.return_rate_pct ?? 0 }}% of unique visitors came back more than once in this period.
            </p>
          </div>
        </UCard>
      </div>

    </div>
  </div>
</template>
