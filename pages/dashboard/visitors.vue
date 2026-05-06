<script setup lang="ts">
import type { VisitWithRelations } from '~/types/database'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Visitors – Muyenzi' })

const supabase = useSupabaseClient()
const { user, can } = useUser()
const route = useRoute()
const router = useRouter()

const STATUS_LABELS: Record<string, string> = {
  expected: 'Expected',
  checked_in: 'Checked In',
  checked_out: 'Checked Out',
  cancelled: 'Cancelled',
  no_show: 'No Show',
}

const STATUS_COLORS: Record<string, string> = {
  expected: 'blue',
  checked_in: 'green',
  checked_out: 'gray',
  cancelled: 'red',
  no_show: 'yellow',
}

const visits = ref<VisitWithRelations[]>([])
const sites = ref<{ id: string; name: string }[]>([])
const loading = ref(true)

const search = ref((route.query.q as string) ?? '')
const siteFilter = ref((route.query.site as string) ?? '')
const statusFilter = ref((route.query.status as string) ?? '')
const showOwnOnly = ref(false)

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return visits.value
  return visits.value.filter(v =>
    v.visitor.full_name.toLowerCase().includes(q) ||
    v.visitor.email?.toLowerCase().includes(q) ||
    v.visitor.company_name?.toLowerCase().includes(q),
  )
})

async function fetchData() {
  if (!user.value) return
  loading.value = true

  let query = supabase
    .from('visits')
    .select('*, visitor:visitors(*), site:sites(*), host:users(*)')
    .eq('company_id', user.value.company_id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (siteFilter.value) query = query.eq('site_id', siteFilter.value)
  if (statusFilter.value) query = query.eq('status', statusFilter.value)
  if (showOwnOnly.value) query = query.eq('host_id', user.value.id)

  const [{ data: v }, { data: s }] = await Promise.all([
    query,
    supabase.from('sites').select('id, name').eq('company_id', user.value.company_id),
  ])

  visits.value = (v ?? []) as VisitWithRelations[]
  sites.value = s ?? []
  loading.value = false
}

function applyFilters() {
  router.push({ query: { q: search.value || undefined, site: siteFilter.value || undefined, status: statusFilter.value || undefined } })
  fetchData()
}

// ── Blacklist ─────────────────────────────────────────────────
const blacklistTarget = ref<{ phone: string; full_name: string } | null>(null)
const blacklistReason = ref('')
const blacklisting = ref(false)
const toast = useToast()

function promptBlacklist(visit: VisitWithRelations) {
  blacklistTarget.value = { phone: visit.visitor.phone ?? '', full_name: visit.visitor.full_name }
  blacklistReason.value = ''
}

async function confirmBlacklist() {
  if (!blacklistTarget.value || !user.value) return
  blacklisting.value = true
  try {
    await $fetch('/api/blacklist', {
      method: 'POST',
      body: {
        company_id: user.value.company_id,
        phone: blacklistTarget.value.phone,
        full_name: blacklistTarget.value.full_name,
        reason: blacklistReason.value || null,
        created_by: user.value.id,
      },
    })
    toast.add({ title: `${blacklistTarget.value.full_name} added to blacklist`, color: 'green' })
    blacklistTarget.value = null
  } catch (e: any) {
    toast.add({ title: 'Error', description: e?.data?.statusMessage ?? 'Failed', color: 'red' })
  } finally {
    blacklisting.value = false
  }
}

// ── Regenerate access code ─────────────────────────────────────
const regenTarget = ref<VisitWithRelations | null>(null)
const regenResult = ref<{ access_code: string; qr_code_data: string; visitor_email: string | null } | null>(null)
const regenerating = ref(false)
const resending = ref(false)

async function confirmRegen() {
  if (!regenTarget.value) return
  regenerating.value = true
  try {
    const result = await $fetch<{ access_code: string; qr_code_data: string; visitor_email: string | null }>(
      `/api/visits/${regenTarget.value.id}/regenerate-code`,
      { method: 'PATCH', body: { resend: false } },
    )
    regenResult.value = result
    // refresh list in background so the new code shows in the table
    fetchData()
  } catch (e: any) {
    useToast().add({ title: 'Error', description: e?.data?.statusMessage ?? 'Failed', color: 'red' })
    regenTarget.value = null
  } finally {
    regenerating.value = false
  }
}

async function resendAfterRegen() {
  if (!regenTarget.value || !regenResult.value) return
  resending.value = true
  try {
    await $fetch(`/api/visits/${regenTarget.value.id}/regenerate-code`, {
      method: 'PATCH',
      body: { resend: true },
    })
    useToast().add({ title: 'Invitation sent', description: `New code emailed to ${regenResult.value.visitor_email}`, color: 'green' })
  } catch (e: any) {
    useToast().add({ title: 'Email failed', description: e?.data?.statusMessage ?? 'Could not send email', color: 'red' })
  } finally {
    resending.value = false
  }
}

function closeRegenModal() {
  regenTarget.value = null
  regenResult.value = null
}

function copyRegenCode() {
  if (!regenResult.value) return
  navigator.clipboard.writeText(regenResult.value.access_code)
  useToast().add({ title: 'Copied!', timeout: 1500 })
}

// ─────────────────────────────────────────────────────────────
const updatingVisitId = ref<string | null>(null)

async function updateStatus(visitId: string, status: 'cancelled' | 'no_show' | 'checked_out') {
  updatingVisitId.value = visitId
  try {
    await $fetch(`/api/visits/${visitId}/status`, { method: 'PATCH', body: { status } })
    const labels: Record<string, string> = { cancelled: 'Cancelled', no_show: 'Marked as no-show', checked_out: 'Checked out' }
    useToast().add({ title: labels[status], color: 'green' })
    await fetchData()
  } catch (e: any) {
    useToast().add({ title: 'Error', description: e?.data?.statusMessage ?? 'Failed', color: 'red' })
  } finally {
    updatingVisitId.value = null
  }
}

async function exportVisitorData(visit: VisitWithRelations) {
  try {
    const data = await $fetch(`/api/gdpr/visitor-export`, {
      query: { visitor_id: visit.visitor_id },
      responseType: 'json',
    })
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `visitor-data-${visit.visitor.full_name.replace(/\s+/g, '-').toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
    useToast().add({ title: 'Data exported', color: 'green' })
  } catch (e: any) {
    useToast().add({ title: 'Export failed', description: e?.data?.statusMessage ?? 'Error', color: 'red' })
  }
}

function actionsFor(visit: VisitWithRelations) {
  const items = []
  if (visit.status === 'expected') {
    items.push({ label: 'Mark as no-show', icon: 'i-lucide-user-x', click: () => updateStatus(visit.id, 'no_show') })
    items.push({ label: 'Cancel', icon: 'i-lucide-x-circle', click: () => updateStatus(visit.id, 'cancelled') })
    if (can('manage_blacklist')) {
      items.push({ label: 'Regenerate access code', icon: 'i-lucide-refresh-cw', click: () => { regenTarget.value = visit; regenResult.value = null } })
    }
  }
  if (visit.status === 'checked_in') {
    items.push({ label: 'Force check out', icon: 'i-lucide-log-out', click: () => updateStatus(visit.id, 'checked_out') })
  }
  if (can('manage_blacklist') && visit.visitor.phone) {
    items.push({ label: 'Add to blacklist', icon: 'i-lucide-shield-ban', click: () => promptBlacklist(visit) })
  }
  items.push({ label: 'Export personal data', icon: 'i-lucide-download', click: () => exportVisitorData(visit) })
  return items
}

watch(user, (u) => { if (u) fetchData() }, { immediate: true })
</script>

<template>
  <div class="flex flex-col h-full">
    <LayoutTopbar title="Visitors" description="Manage and track all visitor activity" />

    <div class="flex-1 overflow-y-auto p-6 space-y-5">
      <!-- Toolbar -->
      <div class="flex flex-wrap items-center gap-3">
        <UInput
          v-model="search"
          placeholder="Search by name, email or company…"
          icon="i-lucide-search"
          class="flex-1 min-w-48 max-w-xs"
          @keyup.enter="applyFilters"
        />
        <USelect
          v-model="siteFilter"
          :options="[{ label: 'All sites', value: '' }, ...sites.map(s => ({ label: s.name, value: s.id }))]"
          class="w-40"
          @change="applyFilters"
        />
        <USelect
          v-model="statusFilter"
          :options="[{ label: 'All statuses', value: '' }, ...Object.entries(STATUS_LABELS).map(([v, l]) => ({ label: l, value: v }))]"
          class="w-44"
          @change="applyFilters"
        />
        <UButton variant="soft" @click="applyFilters">Filter</UButton>

        <div v-if="user?.role === 'host'" class="flex items-center gap-2 border-l border-gray-200 pl-3">
          <UToggle v-model="showOwnOnly" @update:model-value="fetchData" />
          <span class="text-sm text-gray-600">My visits</span>
        </div>

        <div class="ml-auto flex items-center gap-2">
          <SharedExportMenu :company-id="user?.company_id ?? ''" />
          <UButton to="/dashboard/invitations/new" icon="i-lucide-plus">Invite Visitor</UButton>
        </div>
      </div>

      <!-- Empty state -->
      <UCard v-if="!loading && filtered.length === 0">
        <div class="flex flex-col items-center justify-center py-20 text-center">
          <div class="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <UIcon name="i-lucide-users" class="h-8 w-8 text-gray-300" />
          </div>
          <h3 class="font-bold text-gray-900 text-lg mb-1">No visitors found</h3>
          <p class="text-sm text-gray-400 mb-5">Invite your first visitor to get started.</p>
          <UButton to="/dashboard/invitations/new" icon="i-lucide-plus">Invite Visitor</UButton>
        </div>
      </UCard>

      <!-- Table -->
      <UCard v-else :ui="{ body: { padding: '' } }">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-100">
                <th v-for="col in ['Visitor', 'Host', 'Site', 'Check In', 'Duration', 'Status', 'Code', '']" :key="col"
                  class="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-gray-400"
                >
                  {{ col }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(visit, i) in filtered"
                :key="visit.id"
                class="hover:bg-gray-50 transition-colors"
                :class="{ 'border-b border-gray-100': i < filtered.length - 1 }"
              >
                <td class="px-5 py-4">
                  <p class="font-semibold text-gray-900">{{ visit.visitor.full_name }}</p>
                  <p v-if="visit.visitor.company_name" class="text-xs text-gray-400 mt-0.5">{{ visit.visitor.company_name }}</p>
                  <p v-if="visit.visitor.email" class="text-xs text-gray-300">{{ visit.visitor.email }}</p>
                </td>
                <td class="px-5 py-4 text-gray-500">{{ visit.host?.full_name ?? '—' }}</td>
                <td class="px-5 py-4 text-gray-500">{{ visit.site.name }}</td>
                <td class="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">
                  {{ visit.check_in_at ? formatDateTime(visit.check_in_at) : '—' }}
                </td>
                <td class="px-5 py-4 text-gray-400 text-xs">
                  {{ visit.check_in_at && visit.check_out_at ? formatDuration(visit.check_in_at, visit.check_out_at) : '—' }}
                </td>
                <td class="px-5 py-4">
                  <UBadge :color="STATUS_COLORS[visit.status]" variant="soft" size="sm">
                    {{ STATUS_LABELS[visit.status] }}
                  </UBadge>
                </td>
                <td class="px-5 py-4">
                  <code class="text-xs bg-gray-100 text-gray-600 rounded-lg px-2.5 py-1 font-mono font-semibold tracking-wider">
                    {{ visit.access_code }}
                  </code>
                </td>
                <td class="px-5 py-4">
                  <UDropdown
                    v-if="actionsFor(visit).length > 0"
                    :items="[actionsFor(visit)]"
                    :popper="{ placement: 'bottom-end' }"
                  >
                    <UButton
                      variant="ghost"
                      icon="i-lucide-more-horizontal"
                      size="xs"
                      :loading="updatingVisitId === visit.id"
                    />
                  </UDropdown>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="loading" class="p-8 text-center text-gray-400 text-sm">Loading…</div>
        </div>
      </UCard>
    </div>
  </div>

  <!-- Regenerate code — confirm modal -->
  <UModal :model-value="!!regenTarget && !regenResult" @update:model-value="closeRegenModal">
    <UCard v-if="regenTarget && !regenResult">
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <h2 class="font-bold text-gray-900">Regenerate access code?</h2>
            <p class="text-xs text-gray-400 mt-0.5">The old code will stop working at the kiosk immediately.</p>
          </div>
          <UButton variant="ghost" color="gray" icon="i-lucide-x" size="sm" @click="closeRegenModal" />
        </div>
      </template>

      <div class="space-y-3">
        <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <UIcon name="i-lucide-user" class="h-5 w-5 text-gray-400 shrink-0" />
          <div>
            <p class="font-semibold text-gray-900 text-sm">{{ regenTarget.visitor.full_name }}</p>
            <p class="text-xs text-gray-400">{{ regenTarget.site.name }} · {{ regenTarget.visit_date }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
          <UIcon name="i-lucide-triangle-alert" class="h-4 w-4 text-amber-500 shrink-0" />
          <div>
            <p class="text-xs text-amber-800">Current code <code class="font-mono font-bold">{{ regenTarget.access_code }}</code> will be invalidated.</p>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton variant="outline" @click="closeRegenModal">Cancel</UButton>
          <UButton icon="i-lucide-refresh-cw" :loading="regenerating" @click="confirmRegen">
            Generate new code
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>

  <!-- Regenerate code — result modal -->
  <UModal :model-value="!!regenResult" @update:model-value="closeRegenModal">
    <UCard v-if="regenResult">
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <h2 class="font-bold text-gray-900">New access code ready</h2>
            <p class="text-xs text-gray-400 mt-0.5">Share this with the visitor. The old code no longer works.</p>
          </div>
          <UButton variant="ghost" color="gray" icon="i-lucide-x" size="sm" @click="closeRegenModal" />
        </div>
      </template>

      <div class="flex flex-col items-center gap-4 py-4">
        <div class="text-4xl font-mono font-bold tracking-[0.25em] text-gray-900 bg-gray-100 rounded-xl px-8 py-5">
          {{ regenResult.access_code }}
        </div>
        <UButton variant="soft" icon="i-lucide-copy" size="sm" @click="copyRegenCode">
          Copy code
        </UButton>
      </div>

      <template #footer>
        <div class="flex justify-between items-center gap-3">
          <UButton
            v-if="regenResult.visitor_email"
            variant="soft"
            color="indigo"
            icon="i-lucide-mail"
            :loading="resending"
            @click="resendAfterRegen"
          >
            Send by email
          </UButton>
          <span v-else class="text-xs text-gray-400">No email on file — share the code manually.</span>
          <UButton @click="closeRegenModal">Done</UButton>
        </div>
      </template>
    </UCard>
  </UModal>

  <!-- Blacklist confirm modal -->
  <UModal :model-value="!!blacklistTarget" @update:model-value="blacklistTarget = null">
    <UCard v-if="blacklistTarget">
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <h2 class="font-bold text-gray-900">Block this visitor?</h2>
            <p class="text-xs text-gray-400 mt-0.5">They will be denied entry at all kiosks.</p>
          </div>
          <UButton variant="ghost" color="gray" icon="i-lucide-x" size="sm" @click="blacklistTarget = null" />
        </div>
      </template>

      <div class="space-y-4">
        <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <UIcon name="i-lucide-user" class="h-5 w-5 text-gray-400" />
          <div>
            <p class="font-semibold text-gray-900 text-sm">{{ blacklistTarget.full_name }}</p>
            <p class="text-xs text-gray-400 font-mono">{{ blacklistTarget.phone }}</p>
          </div>
        </div>

        <UFormGroup label="Reason (optional)">
          <UInput v-model="blacklistReason" placeholder="e.g. Trespassing, Theft, Harassment" />
        </UFormGroup>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton variant="outline" @click="blacklistTarget = null">Cancel</UButton>
          <UButton color="red" icon="i-lucide-shield-ban" :loading="blacklisting" @click="confirmBlacklist">
            Block visitor
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>
