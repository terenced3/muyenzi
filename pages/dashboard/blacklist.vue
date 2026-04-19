<script setup lang="ts">
import { z } from 'zod'

definePageMeta({
  layout: 'dashboard',
  middleware: [
    function () {
      const { can } = useUser()
      if (!can('manage_blacklist')) return navigateTo('/dashboard')
    },
  ],
})
useHead({ title: 'Blacklist – Muyenzi' })

const { user } = useUser()
const supabase = useSupabaseClient()
const toast = useToast()

interface BlacklistEntry {
  id: string
  phone: string
  full_name: string | null
  reason: string | null
  created_at: string
}

const entries = ref<BlacklistEntry[]>([])
const loading = ref(true)
const showAddModal = ref(false)
const saving = ref(false)
const removingId = ref<string | null>(null)

const state = reactive({ phone: '', full_name: '', reason: '' })

const schema = z.object({
  phone: z.string().min(7, 'Phone number is required').regex(/^\+?[\d\s\-().]{7,20}$/, 'Enter a valid phone number'),
  full_name: z.string().optional(),
  reason: z.string().optional(),
})

async function fetchEntries() {
  if (!user.value) return
  const { data } = await supabase
    .from('visitor_blacklist')
    .select('id, phone, full_name, reason, created_at')
    .eq('company_id', user.value.company_id)
    .order('created_at', { ascending: false })
  entries.value = (data ?? []) as BlacklistEntry[]
  loading.value = false
}

watch(user, (u) => { if (u) fetchEntries() }, { immediate: true })

function openAdd(prefill?: { phone?: string; full_name?: string }) {
  state.phone = prefill?.phone ?? ''
  state.full_name = prefill?.full_name ?? ''
  state.reason = ''
  showAddModal.value = true
}

async function addEntry() {
  if (!user.value) return
  saving.value = true

  try {
    await $fetch('/api/blacklist', {
      method: 'POST',
      body: {
        company_id: user.value.company_id,
        phone: state.phone,
        full_name: state.full_name || null,
        reason: state.reason || null,
        created_by: user.value.id,
      },
    })
    toast.add({ title: 'Added to blacklist', color: 'green' })
    showAddModal.value = false
    await fetchEntries()
  } catch (e: any) {
    toast.add({ title: 'Error', description: e?.data?.statusMessage ?? 'Failed to add to blacklist', color: 'red' })
  } finally {
    saving.value = false
  }
}

async function removeEntry(id: string) {
  if (!user.value) return
  removingId.value = id
  try {
    await $fetch(`/api/blacklist/${id}?requested_by=${user.value.id}`, { method: 'DELETE' })
    toast.add({ title: 'Removed from blacklist', color: 'green' })
    entries.value = entries.value.filter(e => e.id !== id)
  } catch (e: any) {
    toast.add({ title: 'Error', description: e?.data?.statusMessage ?? 'Failed to remove', color: 'red' })
  } finally {
    removingId.value = null
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <LayoutTopbar
      title="Blacklist"
      description="Visitors blocked from checking in at any of your sites"
    />

    <div class="flex-1 overflow-y-auto p-6 space-y-5">

      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-400">
          {{ entries.length }} blocked visitor{{ entries.length !== 1 ? 's' : '' }}
        </p>
        <UButton icon="i-lucide-shield-ban" color="red" variant="soft" @click="openAdd()">
          Add to blacklist
        </UButton>
      </div>

      <!-- Info banner -->
      <UAlert
        color="amber"
        variant="soft"
        icon="i-lucide-triangle-alert"
        description="Blacklisted visitors will be denied entry at the kiosk and shown a message to contact reception. Their phone number is the match key."
      />

      <!-- Empty state -->
      <div v-if="!loading && entries.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
        <div class="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <UIcon name="i-lucide-shield-check" class="h-8 w-8 text-gray-300" />
        </div>
        <h3 class="font-bold text-gray-900 text-lg mb-1">No blocked visitors</h3>
        <p class="text-sm text-gray-400 mb-5">Add a phone number to block someone from checking in.</p>
        <UButton icon="i-lucide-shield-ban" color="red" variant="soft" @click="openAdd()">
          Add to blacklist
        </UButton>
      </div>

      <!-- Table -->
      <UCard v-else :ui="{ body: { padding: '' } }">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100 bg-gray-50">
                <th v-for="col in ['Phone', 'Name', 'Reason', 'Added', '']" :key="col"
                  class="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-gray-400"
                >
                  {{ col }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="entry in entries" :key="entry.id" class="hover:bg-gray-50">
                <td class="px-4 py-3 font-mono font-semibold text-gray-900">{{ entry.phone }}</td>
                <td class="px-4 py-3 text-gray-600">{{ entry.full_name ?? '—' }}</td>
                <td class="px-4 py-3 text-gray-500 max-w-xs truncate">{{ entry.reason ?? '—' }}</td>
                <td class="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                  {{ formatDate(entry.created_at) }}
                </td>
                <td class="px-4 py-3 text-right">
                  <UButton
                    size="xs"
                    variant="ghost"
                    color="red"
                    icon="i-lucide-trash-2"
                    :loading="removingId === entry.id"
                    @click="removeEntry(entry.id)"
                  >
                    Remove
                  </UButton>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="loading" class="p-8 text-center text-gray-400 text-sm">Loading…</div>
        </div>
      </UCard>
    </div>

    <!-- Add modal -->
    <UModal v-model="showAddModal">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h2 class="font-bold text-gray-900">Block a visitor</h2>
              <p class="text-xs text-gray-400 mt-0.5">They will be denied entry at all kiosks.</p>
            </div>
            <UButton variant="ghost" color="gray" icon="i-lucide-x" size="sm" @click="showAddModal = false" />
          </div>
        </template>

        <UForm :schema="schema" :state="state" class="space-y-4" @submit="addEntry">
          <UFormGroup label="Phone number" name="phone" required>
            <UInput v-model="state.phone" type="tel" placeholder="+263 71 234 5678" autofocus />
          </UFormGroup>
          <UFormGroup label="Name (optional)" name="full_name">
            <UInput v-model="state.full_name" placeholder="For reference only" />
          </UFormGroup>
          <UFormGroup label="Reason (optional)" name="reason">
            <UInput v-model="state.reason" placeholder="e.g. Trespassing, Theft, Harassment" />
          </UFormGroup>

          <div class="flex justify-end gap-3 pt-2">
            <UButton variant="outline" @click="showAddModal = false">Cancel</UButton>
            <UButton type="submit" color="red" icon="i-lucide-shield-ban" :loading="saving">
              Block visitor
            </UButton>
          </div>
        </UForm>
      </UCard>
    </UModal>
  </div>
</template>
