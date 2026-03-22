<script setup lang="ts">
import { ROLE_LABELS } from '~/constants/roles'
import type { User, UserRole } from '~/types/database'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Team – Muyenzi' })

const supabase = useSupabaseClient()
const { user } = useUser()
const toast = useToast()

const users = ref<User[]>([])
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

async function fetchUsers() {
  if (!user.value) return
  if (user.value.role !== 'admin') {
    await navigateTo('/dashboard')
    return
  }
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('company_id', user.value.company_id)
    .order('created_at', { ascending: true })
  users.value = (data ?? []) as User[]
  loading.value = false
}

watch(user, (u) => { if (u) fetchUsers() }, { immediate: true })

async function changeRole(userId: string, role: UserRole) {
  const { error } = await supabase.from('users').update({ role }).eq('id', userId)
  if (error) {
    toast.add({ title: 'Error', description: error.message, color: 'red' })
    return
  }
  users.value = users.value.map(u => u.id === userId ? { ...u, role } : u)
  const member = users.value.find(u => u.id === userId)
  toast.add({ title: 'Role updated', description: `${member?.full_name ?? 'User'} is now a ${ROLE_LABELS[role]}.`, color: 'green' })
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}
</script>

<template>
  <div class="flex flex-col h-full">
    <LayoutTopbar title="Team" description="Manage your team members and their roles" />

    <div class="flex-1 overflow-y-auto p-6 space-y-4">
      <p class="text-sm text-gray-400">{{ users.length }} team member{{ users.length !== 1 ? 's' : '' }}</p>

      <UCard :ui="{ body: { padding: '' } }">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100 bg-gray-50">
                <th v-for="col in ['Member', 'Email', 'Role', 'Actions']" :key="col"
                  class="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-gray-400"
                >
                  {{ col }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="u in users" :key="u.id" class="hover:bg-gray-50">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <UAvatar :alt="initials(u.full_name)" size="sm" />
                    <span class="font-medium text-gray-900">{{ u.full_name }}</span>
                    <UBadge v-if="u.id === user?.id" color="gray" variant="soft" size="xs">you</UBadge>
                  </div>
                </td>
                <td class="px-4 py-3 text-gray-500">{{ u.email }}</td>
                <td class="px-4 py-3">
                  <UBadge :color="ROLE_COLORS[u.role as UserRole]" variant="soft" size="sm">
                    {{ ROLE_LABELS[u.role as UserRole] }}
                  </UBadge>
                </td>
                <td class="px-4 py-3">
                  <USelect
                    v-if="u.id !== user?.id"
                    :model-value="u.role"
                    :options="roleOptions"
                    size="sm"
                    class="w-36"
                    @update:model-value="(role: UserRole) => changeRole(u.id, role)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="loading" class="p-8 text-center text-gray-400 text-sm">Loading…</div>
        </div>
      </UCard>
    </div>
  </div>
</template>
