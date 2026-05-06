<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: [
    function () {
      const { can } = useUser()
      if (!can('manage_settings')) return navigateTo('/dashboard')
    },
  ],
})
useHead({ title: 'Audit Log – Muyenzi' })

const supabase = useSupabaseClient()
const { user } = useUser()

interface AuditRow {
  id: string
  action: string
  resource: string
  metadata: Record<string, unknown> | null
  created_at: string
  user: { full_name: string; email: string } | null
}

const logs = ref<AuditRow[]>([])
const loading = ref(true)
const page = ref(1)
const PAGE_SIZE = 50
const total = ref(0)

const actionFilter = ref('')
const resourceFilter = ref('')
const searchUser = ref('')

const ACTION_COLORS: Record<string, string> = {
  check_in: 'green',
  check_out: 'blue',
  cancel: 'red',
  blacklist_add: 'red',
  blacklist_remove: 'yellow',
  invite_send: 'indigo',
  invite_accept: 'green',
  visit_create: 'indigo',
  visit_update: 'blue',
  visit_cancelled: 'red',
  visit_no_show: 'yellow',
  visit_force_checkout: 'blue',
  role_change: 'yellow',
  user_role_change: 'yellow',
  site_delete: 'red',
  user_deactivate: 'orange',
  user_reactivate: 'green',
  user_remove: 'red',
  gdpr_export: 'indigo',
  retention_cleanup: 'gray',
  code_regenerated: 'orange',
}

async function fetchLogs() {
  if (!user.value) return
  loading.value = true

  let query = supabase
    .from('audit_logs')
    .select('id, action, resource, metadata, created_at, user:users(full_name, email)', { count: 'exact' })
    .eq('company_id', user.value.company_id)
    .order('created_at', { ascending: false })
    .range((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE - 1)

  if (actionFilter.value) query = query.eq('action', actionFilter.value)
  if (resourceFilter.value) query = query.eq('resource', resourceFilter.value)

  const { data, count } = await query
  let rows = (data ?? []) as AuditRow[]

  if (searchUser.value) {
    const q = searchUser.value.toLowerCase()
    rows = rows.filter(r =>
      r.user?.full_name?.toLowerCase().includes(q) ||
      r.user?.email?.toLowerCase().includes(q),
    )
  }

  logs.value = rows
  total.value = count ?? 0
  loading.value = false
}

watch(user, (u) => { if (u) fetchLogs() }, { immediate: true })
watch([page, actionFilter, resourceFilter], fetchLogs)

function applySearch() { page.value = 1; fetchLogs() }

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))

function metaSummary(row: AuditRow): string {
  if (!row.metadata) return ''
  const m = row.metadata
  const parts: string[] = []
  if (m.visitor_name) parts.push(`visitor: ${m.visitor_name}`)
  if (m.site_name) parts.push(`site: ${m.site_name}`)
  if (m.site_address) parts.push(m.site_address as string)
  if (m.email) parts.push(m.email as string)
  if (m.role) parts.push(`role → ${m.role}`)
  if (m.reason) parts.push(`reason: ${m.reason}`)
  if (m.deleted_by_name) parts.push(`by: ${m.deleted_by_name}`)
  return parts.join(' · ')
}
</script>

<template>
  <div class="flex flex-col h-full">
    <LayoutTopbar title="Audit Log" description="All recorded staff actions across your account" />

    <div class="flex-1 overflow-y-auto p-6 space-y-5">

      <!-- Toolbar -->
      <div class="flex flex-wrap items-center gap-3">
        <UInput
          v-model="searchUser"
          placeholder="Search by staff name or email…"
          icon="i-lucide-search"
          class="w-56"
          @keyup.enter="applySearch"
        />
        <USelect
          v-model="actionFilter"
          :options="[
            { label: 'All actions', value: '' },
            { label: 'Check in', value: 'check_in' },
            { label: 'Check out', value: 'check_out' },
            { label: 'Cancel visit', value: 'cancel' },
            { label: 'Invite sent', value: 'invite_send' },
            { label: 'Invite accepted', value: 'invite_accept' },
            { label: 'Blacklist add', value: 'blacklist_add' },
            { label: 'Blacklist remove', value: 'blacklist_remove' },
            { label: 'Role change', value: 'user_role_change' },
            { label: 'Site deleted', value: 'site_delete' },
            { label: 'Member deactivated', value: 'user_deactivate' },
            { label: 'Member reactivated', value: 'user_reactivate' },
            { label: 'Member removed', value: 'user_remove' },
          ]"
          class="w-44"
          @change="applySearch"
        />
        <USelect
          v-model="resourceFilter"
          :options="[
            { label: 'All resources', value: '' },
            { label: 'Visit', value: 'visit' },
            { label: 'User', value: 'user' },
            { label: 'Blacklist', value: 'blacklist' },
            { label: 'Invitation', value: 'invitation' },
          ]"
          class="w-40"
          @change="applySearch"
        />
        <UButton variant="soft" @click="applySearch">Filter</UButton>
        <div class="ml-auto text-sm text-gray-400">
          {{ total.toLocaleString() }} entries
        </div>
      </div>

      <!-- Empty state -->
      <UCard v-if="!loading && logs.length === 0">
        <div class="flex flex-col items-center justify-center py-16 text-center">
          <div class="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <UIcon name="i-lucide-scroll-text" class="h-7 w-7 text-gray-300" />
          </div>
          <h3 class="font-bold text-gray-900 mb-1">No audit entries found</h3>
          <p class="text-sm text-gray-400">Actions taken by your team will appear here.</p>
        </div>
      </UCard>

      <!-- Table -->
      <UCard v-else :ui="{ body: { padding: '' } }">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-100">
                <th
                  v-for="col in ['Time', 'Staff', 'Action', 'Resource', 'Details']"
                  :key="col"
                  class="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-gray-400"
                >
                  {{ col }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, i) in logs"
                :key="row.id"
                class="hover:bg-gray-50 transition-colors"
                :class="{ 'border-b border-gray-100': i < logs.length - 1 }"
              >
                <td class="px-5 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                  {{ formatDateTime(row.created_at) }}
                </td>
                <td class="px-5 py-3.5">
                  <p class="font-medium text-gray-900 text-xs">{{ row.user?.full_name ?? 'System' }}</p>
                  <p v-if="row.user?.email" class="text-gray-400 text-xs">{{ row.user.email }}</p>
                </td>
                <td class="px-5 py-3.5">
                  <UBadge
                    :color="ACTION_COLORS[row.action] ?? 'gray'"
                    variant="soft"
                    size="xs"
                    class="font-mono"
                  >
                    {{ row.action.replace(/_/g, ' ') }}
                  </UBadge>
                </td>
                <td class="px-5 py-3.5 text-gray-500 text-xs capitalize">{{ row.resource }}</td>
                <td class="px-5 py-3.5 text-gray-400 text-xs max-w-xs truncate">
                  {{ metaSummary(row) || '—' }}
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="loading" class="p-8 text-center text-gray-400 text-sm">Loading…</div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-between px-5 py-3 border-t border-gray-100">
          <p class="text-xs text-gray-400">
            Page {{ page }} of {{ totalPages }}
          </p>
          <div class="flex gap-2">
            <UButton size="xs" variant="outline" :disabled="page === 1" icon="i-lucide-chevron-left" @click="page--">Prev</UButton>
            <UButton size="xs" variant="outline" :disabled="page === totalPages" trailing-icon="i-lucide-chevron-right" @click="page++">Next</UButton>
          </div>
        </div>
      </UCard>

    </div>
  </div>
</template>
