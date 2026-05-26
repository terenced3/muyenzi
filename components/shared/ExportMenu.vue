<script setup lang="ts">
const props = defineProps<{
  companyId: string
  siteId?: string
  from?: string
  to?: string
}>()

const showFilters = ref(false)
const localFrom = ref(props.from ?? '')
const localTo = ref(props.to ?? '')

function buildParams(extra: Record<string, string> = {}) {
  const p = new URLSearchParams({ company_id: props.companyId })
  const f = localFrom.value || props.from
  const t = localTo.value || props.to
  const s = props.siteId
  if (f) p.set('from', f)
  if (t) p.set('to', t)
  if (s) p.set('site_id', s)
  Object.entries(extra).forEach(([k, v]) => p.set(k, v))
  return p.toString()
}

function download(path: string) {
  window.open(`${path}?${buildParams()}`, '_blank')
}

const items = [
  [
    { label: 'Visits — CSV', icon: 'i-lucide-file-spreadsheet', click: () => download('/api/export/csv') },
    { label: 'Visits — PDF', icon: 'i-lucide-file-text', click: () => download('/api/export/pdf') },
    { label: 'Visitor list — CSV', icon: 'i-lucide-users', click: () => download('/api/export/visitors-csv') },
  ],
]
</script>

<template>
  <div class="flex items-center gap-2">
    <!-- Date filter pills -->
    <div v-if="showFilters" class="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
      <input
        v-model="localFrom"
        type="date"
        class="text-xs bg-transparent outline-none text-gray-600 w-32"
        placeholder="From"
      />
      <span class="text-gray-300 text-xs">→</span>
      <input
        v-model="localTo"
        type="date"
        class="text-xs bg-transparent outline-none text-gray-600 w-32"
        placeholder="To"
      />
      <button class="text-gray-300 hover:text-gray-600 ml-1" @click="showFilters = false; localFrom = ''; localTo = ''">
        <UIcon name="i-lucide-x" class="h-3 w-3" />
      </button>
    </div>

    <UButton
      v-if="!showFilters"
      variant="ghost"
      color="gray"
      icon="i-lucide-calendar"
      size="xs"
      title="Filter by date range"
      @click="showFilters = true"
    />

    <UDropdown :items="items" :popper="{ placement: 'bottom-end' }">
      <UButton variant="outline" color="gray" icon="i-lucide-download" size="sm">Export</UButton>
    </UDropdown>
  </div>
</template>
