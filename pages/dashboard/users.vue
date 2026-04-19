<script setup lang="ts">
import { z } from 'zod'
import { ROLE_LABELS } from '~/constants/roles'
import type { User, UserRole } from '~/types/database'

definePageMeta({
  layout: 'dashboard',
  middleware: [
    function () {
      const { can } = useUser()
      if (!can('manage_users')) return navigateTo('/dashboard')
    },
  ],
})
useHead({ title: 'Team – Muyenzi' })

const supabase = useSupabaseClient()
const { user } = useUser()
const toast = useToast()

// ── Types ─────────────────────────────────────────────────────

interface UserWithSites extends User {
  is_active: boolean
  assigned_sites?: string[]
}

interface PendingInvite {
  id: string
  email: string
  role: UserRole
  created_at: string
  expires_at: string
}

// ── Data ──────────────────────────────────────────────────────

const users = ref<UserWithSites[]>([])
const sites = ref<{ id: string; name: string }[]>([])
const siteAssignments = ref<Record<string, string[]>>({})
const loading = ref(true)

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'purple',
  site_manager: 'blue',
  receptionist: 'green',
  host: 'gray',
}

const roleOptions: { label: string; value: UserRole }[] = [
  { label: 'Admin', value: 'admin' },
  { label: 'Site Manager', value: 'site_manager' },
  { label: 'Receptionist', value: 'receptionist' },
  { label: 'Host', value: 'host' },
]

async function fetchAll() {
  if (!user.value) return
  const companyId = user.value.company_id

  const [{ data: u }, { data: s }, { data: a }] = await Promise.all([
    supabase.from('users').select('*').eq('company_id', companyId).order('created_at', { ascending: true }),
    supabase.from('sites').select('id, name').eq('company_id', companyId).order('name'),
    supabase.from('user_site_assignments').select('user_id, site_id').eq('company_id', companyId),
  ])

  users.value = (u ?? []) as UserWithSites[]
  sites.value = s ?? []

  // Build assignment map: user_id → site_id[]
  const map: Record<string, string[]> = {}
  for (const row of a ?? []) {
    if (!map[row.user_id]) map[row.user_id] = []
    map[row.user_id].push(row.site_id)
  }
  siteAssignments.value = map
  loading.value = false
}

watch(user, (u) => { if (u) fetchAll() }, { immediate: true })

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function siteNamesFor(userId: string) {
  const ids = siteAssignments.value[userId] ?? []
  return ids.map(id => sites.value.find(s => s.id === id)?.name).filter(Boolean) as string[]
}

// ── Role change ───────────────────────────────────────────────

async function changeRole(userId: string, role: UserRole) {
  const { error } = await supabase.from('users').update({ role }).eq('id', userId)
  if (error) { toast.add({ title: 'Error', description: error.message, color: 'red' }); return }
  users.value = users.value.map(u => u.id === userId ? { ...u, role } : u)
  toast.add({ title: 'Role updated', description: `Now a ${ROLE_LABELS[role]}`, color: 'green' })
}

// ── Deactivate / reactivate ────────────────────────────────────

const togglingId = ref<string | null>(null)

async function toggleActive(u: UserWithSites) {
  togglingId.value = u.id
  try {
    await $fetch(`/api/users/${u.id}`, { method: 'PATCH', body: { is_active: !u.is_active } })
    users.value = users.value.map(m => m.id === u.id ? { ...m, is_active: !u.is_active } : m)
    toast.add({ title: u.is_active ? 'Member deactivated' : 'Member reactivated', color: u.is_active ? 'orange' : 'green' })
  } catch (e: any) {
    toast.add({ title: 'Error', description: e?.data?.statusMessage ?? 'Failed', color: 'red' })
  } finally { togglingId.value = null }
}

// ── Remove ────────────────────────────────────────────────────

const removeTarget = ref<UserWithSites | null>(null)
const removing = ref(false)

async function confirmRemove() {
  if (!removeTarget.value) return
  removing.value = true
  try {
    await $fetch(`/api/users/${removeTarget.value.id}`, { method: 'DELETE' })
    toast.add({ title: `${removeTarget.value.full_name} removed`, color: 'orange' })
    users.value = users.value.filter(u => u.id !== removeTarget.value!.id)
    removeTarget.value = null
  } catch (e: any) {
    toast.add({ title: 'Error', description: e?.data?.statusMessage ?? 'Failed', color: 'red' })
  } finally { removing.value = false }
}

// ── Per-site assignment ───────────────────────────────────────

const assignTarget = ref<UserWithSites | null>(null)
const assignedSiteIds = ref<string[]>([])
const savingAssign = ref(false)

function openAssign(u: UserWithSites) {
  assignTarget.value = u
  assignedSiteIds.value = [...(siteAssignments.value[u.id] ?? [])]
}

function toggleSite(siteId: string) {
  const idx = assignedSiteIds.value.indexOf(siteId)
  if (idx === -1) assignedSiteIds.value.push(siteId)
  else assignedSiteIds.value.splice(idx, 1)
}

async function saveAssignment() {
  if (!assignTarget.value) return
  savingAssign.value = true
  try {
    await $fetch(`/api/users/${assignTarget.value.id}/sites`, {
      method: 'PUT',
      body: { site_ids: assignedSiteIds.value },
    })
    siteAssignments.value = { ...siteAssignments.value, [assignTarget.value.id]: [...assignedSiteIds.value] }
    toast.add({ title: 'Site assignments saved', color: 'green' })
    assignTarget.value = null
  } catch (e: any) {
    toast.add({ title: 'Error', description: e?.data?.statusMessage ?? 'Failed', color: 'red' })
  } finally { savingAssign.value = false }
}

// ── Pending invites ───────────────────────────────────────────

const pendingInvites = ref<PendingInvite[]>([])
const revokingId = ref<string | null>(null)

async function fetchPendingInvites() {
  if (!user.value) return
  const { data } = await supabase
    .from('team_invites')
    .select('id, email, role, created_at, expires_at')
    .eq('company_id', user.value.company_id)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
  pendingInvites.value = (data ?? []) as PendingInvite[]
}

watch(user, (u) => { if (u) fetchPendingInvites() }, { immediate: true })

async function revokeInvite(id: string) {
  revokingId.value = id
  const { error } = await supabase.from('team_invites').delete().eq('id', id)
  revokingId.value = null
  if (error) { toast.add({ title: 'Error', description: error.message, color: 'red' }); return }
  toast.add({ title: 'Invite revoked', color: 'green' })
  pendingInvites.value = pendingInvites.value.filter(i => i.id !== id)
}

// ── Invite modal ──────────────────────────────────────────────

const showInviteModal = ref(false)
const sendingInvite = ref(false)
const inviteState = reactive({ email: '', role: 'host' as UserRole })

const inviteSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  role: z.enum(['admin', 'site_manager', 'receptionist', 'host']),
})

function openInviteModal() {
  inviteState.email = ''
  inviteState.role = 'host'
  showInviteModal.value = true
}

async function sendInvite() {
  if (!user.value) return
  sendingInvite.value = true
  try {
    await $fetch('/api/team-invites', {
      method: 'POST',
      body: {
        email: inviteState.email,
        role: inviteState.role,
        company_id: user.value.company_id,
        invited_by: user.value.id,
        invited_by_name: user.value.full_name,
        company_name: user.value.company?.name ?? '',
      },
    })
    toast.add({ title: 'Invite sent', description: `Invitation sent to ${inviteState.email}`, color: 'green' })
    showInviteModal.value = false
    await fetchPendingInvites()
  } catch (e: any) {
    toast.add({ title: 'Failed', description: e?.data?.statusMessage ?? 'Something went wrong', color: 'red' })
  } finally { sendingInvite.value = false }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <LayoutTopbar title="Team" description="Manage members, roles and site access" />

    <div class="flex-1 overflow-y-auto p-6 space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-400">{{ users.length }} team member{{ users.length !== 1 ? 's' : '' }}</p>
        <UButton icon="i-lucide-user-plus" @click="openInviteModal">Invite member</UButton>
      </div>

      <!-- Team table -->
      <UCard :ui="{ body: { padding: '' } }">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100 bg-gray-50">
                <th
                  v-for="col in ['Member', 'Role', 'Sites', 'Status', 'Actions']"
                  :key="col"
                  class="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-gray-400"
                >
                  {{ col }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="u in users"
                :key="u.id"
                class="hover:bg-gray-50 transition-colors"
                :class="{ 'opacity-50': !u.is_active }"
              >
                <!-- Member -->
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <div class="h-9 w-9 rounded-xl overflow-hidden shrink-0 bg-indigo-100 flex items-center justify-center">
                      <img
                        v-if="u.avatar_url"
                        :src="u.avatar_url"
                        :alt="initials(u.full_name)"
                        class="h-full w-full object-cover"
                      />
                      <span v-else class="text-indigo-600 font-bold text-sm">{{ initials(u.full_name) }}</span>
                    </div>
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="font-medium text-gray-900">{{ u.full_name }}</span>
                        <UBadge v-if="u.id === user?.id" color="gray" variant="soft" size="xs">you</UBadge>
                      </div>
                      <p class="text-xs text-gray-400">{{ u.email }}</p>
                    </div>
                  </div>
                </td>

                <!-- Role -->
                <td class="px-4 py-3">
                  <USelect
                    v-if="u.id !== user?.id"
                    :model-value="u.role"
                    :options="roleOptions"
                    size="sm"
                    class="w-36"
                    @update:model-value="(role: UserRole) => changeRole(u.id, role)"
                  />
                  <UBadge v-else :color="ROLE_COLORS[u.role as UserRole]" variant="soft" size="sm">
                    {{ ROLE_LABELS[u.role as UserRole] }}
                  </UBadge>
                </td>

                <!-- Sites -->
                <td class="px-4 py-3">
                  <div class="flex flex-wrap gap-1 max-w-[200px]">
                    <template v-if="siteNamesFor(u.id).length">
                      <UBadge
                        v-for="name in siteNamesFor(u.id)"
                        :key="name"
                        color="indigo"
                        variant="soft"
                        size="xs"
                      >
                        {{ name }}
                      </UBadge>
                    </template>
                    <span v-else class="text-xs text-gray-300">All sites</span>
                  </div>
                </td>

                <!-- Status -->
                <td class="px-4 py-3">
                  <UBadge
                    :color="u.is_active ? 'green' : 'red'"
                    variant="soft"
                    size="sm"
                  >
                    {{ u.is_active ? 'Active' : 'Inactive' }}
                  </UBadge>
                </td>

                <!-- Actions -->
                <td class="px-4 py-3">
                  <div v-if="u.id !== user?.id" class="flex items-center gap-1.5">
                    <!-- Site assignment -->
                    <UButton
                      size="xs"
                      variant="ghost"
                      icon="i-lucide-map-pin"
                      title="Assign sites"
                      @click="openAssign(u)"
                    />
                    <!-- Deactivate / reactivate -->
                    <UButton
                      size="xs"
                      variant="ghost"
                      :color="u.is_active ? 'orange' : 'green'"
                      :icon="u.is_active ? 'i-lucide-user-x' : 'i-lucide-user-check'"
                      :loading="togglingId === u.id"
                      :title="u.is_active ? 'Deactivate' : 'Reactivate'"
                      @click="toggleActive(u)"
                    />
                    <!-- Remove -->
                    <UButton
                      size="xs"
                      variant="ghost"
                      color="red"
                      icon="i-lucide-trash-2"
                      title="Remove member"
                      @click="removeTarget = u"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="loading" class="p-8 text-center text-gray-400 text-sm">Loading…</div>
        </div>
      </UCard>

      <!-- Pending invites -->
      <div v-if="pendingInvites.length > 0">
        <h3 class="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Pending Invites</h3>
        <UCard :ui="{ body: { padding: '' } }">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-100 bg-gray-50">
                  <th
                    v-for="col in ['Email', 'Role', 'Sent', 'Expires', '']"
                    :key="col"
                    class="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-gray-400"
                  >
                    {{ col }}
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="invite in pendingInvites" :key="invite.id" class="hover:bg-gray-50">
                  <td class="px-4 py-3 font-medium text-gray-900">{{ invite.email }}</td>
                  <td class="px-4 py-3">
                    <UBadge :color="ROLE_COLORS[invite.role]" variant="soft" size="sm">
                      {{ ROLE_LABELS[invite.role] }}
                    </UBadge>
                  </td>
                  <td class="px-4 py-3 text-gray-400 text-xs">{{ formatDate(invite.created_at) }}</td>
                  <td class="px-4 py-3 text-gray-400 text-xs">{{ formatDate(invite.expires_at) }}</td>
                  <td class="px-4 py-3 text-right">
                    <UButton
                      size="xs"
                      variant="ghost"
                      color="red"
                      icon="i-lucide-x"
                      :loading="revokingId === invite.id"
                      @click="revokeInvite(invite.id)"
                    >
                      Revoke
                    </UButton>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>
      </div>
    </div>

    <!-- ── Invite modal ── -->
    <UModal v-model="showInviteModal">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h2 class="font-bold text-gray-900">Invite a team member</h2>
              <p class="text-xs text-gray-400 mt-0.5">They'll receive an email to create their account.</p>
            </div>
            <UButton variant="ghost" color="gray" icon="i-lucide-x" size="sm" @click="showInviteModal = false" />
          </div>
        </template>
        <UForm :schema="inviteSchema" :state="inviteState" class="space-y-4" @submit="sendInvite">
          <UFormGroup label="Email address" name="email" required>
            <UInput v-model="inviteState.email" type="email" placeholder="colleague@company.com" autofocus />
          </UFormGroup>
          <UFormGroup label="Role" name="role" required>
            <USelect v-model="inviteState.role" :options="roleOptions" />
            <template #hint>
              <span class="text-xs text-gray-400">
                <strong>Admin</strong> full access ·
                <strong>Site Manager</strong> sites &amp; analytics ·
                <strong>Receptionist</strong> check in/out ·
                <strong>Host</strong> invite &amp; own visits
              </span>
            </template>
          </UFormGroup>
          <div class="flex justify-end gap-3 pt-2">
            <UButton variant="outline" @click="showInviteModal = false">Cancel</UButton>
            <UButton type="submit" icon="i-lucide-send" :loading="sendingInvite">Send invite</UButton>
          </div>
        </UForm>
      </UCard>
    </UModal>

    <!-- ── Remove confirm modal ── -->
    <UModal :model-value="!!removeTarget" @update:model-value="removeTarget = null">
      <UCard v-if="removeTarget">
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h2 class="font-bold text-gray-900">Remove team member?</h2>
              <p class="text-xs text-gray-400 mt-0.5">Their account will be permanently deleted. This is logged to the audit trail.</p>
            </div>
            <UButton variant="ghost" color="gray" icon="i-lucide-x" size="sm" @click="removeTarget = null" />
          </div>
        </template>
        <div class="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
          <div class="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <span class="text-red-600 font-bold text-sm">{{ initials(removeTarget.full_name) }}</span>
          </div>
          <div>
            <p class="font-semibold text-gray-900 text-sm">{{ removeTarget.full_name }}</p>
            <p class="text-xs text-gray-400">{{ removeTarget.email }} · {{ ROLE_LABELS[removeTarget.role as UserRole] }}</p>
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton variant="outline" @click="removeTarget = null">Cancel</UButton>
            <UButton color="red" icon="i-lucide-trash-2" :loading="removing" @click="confirmRemove">
              Remove member
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- ── Site assignment modal ── -->
    <UModal :model-value="!!assignTarget" @update:model-value="assignTarget = null">
      <UCard v-if="assignTarget">
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h2 class="font-bold text-gray-900">Assign sites</h2>
              <p class="text-xs text-gray-400 mt-0.5">
                {{ assignTarget.full_name }} · leave all unchecked to grant access to all sites
              </p>
            </div>
            <UButton variant="ghost" color="gray" icon="i-lucide-x" size="sm" @click="assignTarget = null" />
          </div>
        </template>

        <div v-if="sites.length === 0" class="text-sm text-gray-400 py-4 text-center">
          No sites found. Create a site first.
        </div>
        <div v-else class="space-y-2">
          <label
            v-for="site in sites"
            :key="site.id"
            class="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
            :class="{ 'bg-indigo-50 border-indigo-200': assignedSiteIds.includes(site.id) }"
          >
            <UCheckbox
              :model-value="assignedSiteIds.includes(site.id)"
              @update:model-value="toggleSite(site.id)"
            />
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-building-2" class="h-4 w-4 text-gray-400" />
              <span class="text-sm font-medium text-gray-900">{{ site.name }}</span>
            </div>
          </label>

          <p class="text-xs text-gray-400 pt-1">
            {{ assignedSiteIds.length === 0 ? 'No restriction — member can access all sites.' : `Restricted to ${assignedSiteIds.length} site${assignedSiteIds.length !== 1 ? 's' : ''}.` }}
          </p>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton variant="outline" @click="assignTarget = null">Cancel</UButton>
            <UButton icon="i-lucide-check" :loading="savingAssign" @click="saveAssignment">Save</UButton>
          </div>
        </template>
      </UCard>
    </UModal>

  </div>
</template>
