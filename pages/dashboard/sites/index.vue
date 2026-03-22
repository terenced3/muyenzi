<script setup lang="ts">
import type { Site } from '~/types/database'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Sites – Muyenzi' })

const supabase = useSupabaseClient()
const { user, can } = useUser()
const toast = useToast()

const sites = ref<Site[]>([])
const loading = ref(true)
const canManage = computed(() => can('manage_sites'))

async function fetchSites() {
  if (!user.value) return
  const { data } = await supabase
    .from('sites')
    .select('*')
    .eq('company_id', user.value.company_id)
    .order('created_at', { ascending: false })
  sites.value = (data ?? []) as Site[]
  loading.value = false
}

const deletingId = ref<string | null>(null)

async function deleteSite(id: string, name: string) {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
  deletingId.value = id
  const { error } = await supabase.from('sites').delete().eq('id', id)
  deletingId.value = null
  if (error) {
    toast.add({ title: 'Error', description: error.message, color: 'red' })
    return
  }
  toast.add({ title: 'Site deleted', description: `${name} has been removed.`, color: 'orange' })
  sites.value = sites.value.filter(s => s.id !== id)
}

watch(user, (u) => { if (u) fetchSites() }, { immediate: true })
</script>

<template>
  <div class="flex flex-col h-full">
    <LayoutTopbar title="Sites" description="Manage your locations and kiosk access" />

    <div class="flex-1 overflow-y-auto p-6 space-y-6">
      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-400 font-medium">
          {{ sites.length }} location{{ sites.length !== 1 ? 's' : '' }}
        </p>
        <UButton v-if="canManage" to="/dashboard/sites/new" icon="i-lucide-plus">Add Site</UButton>
      </div>

      <!-- Empty state -->
      <UCard v-if="!loading && !sites.length">
        <div class="flex flex-col items-center justify-center py-20 text-center">
          <div class="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <UIcon name="i-lucide-building-2" class="h-8 w-8 text-gray-300" />
          </div>
          <h3 class="font-bold text-gray-900 text-lg mb-1">No sites yet</h3>
          <p class="text-sm text-gray-400 mb-5">Add your first location to start managing visitors.</p>
          <UButton v-if="canManage" to="/dashboard/sites/new" icon="i-lucide-plus">Add Site</UButton>
        </div>
      </UCard>

      <!-- Sites grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <UCard v-for="site in sites" :key="site.id" class="hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-start gap-3 min-w-0">
              <div class="mt-0.5 h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                <UIcon name="i-lucide-building-2" class="h-5 w-5 text-primary-500" />
              </div>
              <div class="min-w-0">
                <p class="font-bold text-gray-900">{{ site.name }}</p>
                <div v-if="site.address" class="flex items-center gap-1 mt-1">
                  <UIcon name="i-lucide-map-pin" class="h-3 w-3 text-gray-400 shrink-0" />
                  <p class="text-xs text-gray-400 truncate">{{ site.address }}</p>
                </div>
                <p class="text-xs text-gray-300 mt-1.5">Added {{ formatDate(site.created_at) }}</p>
              </div>
            </div>
            <UButton
              v-if="canManage"
              icon="i-lucide-trash-2"
              color="red"
              variant="ghost"
              size="xs"
              :loading="deletingId === site.id"
              @click="deleteSite(site.id, site.name)"
            />
          </div>

          <div class="mt-4 pt-4 flex gap-2 border-t border-gray-100">
            <UButton
              :to="`/kiosk/${site.id}`"
              target="_blank"
              variant="soft"
              color="gray"
              size="sm"
              class="flex-1"
            >
              Open Kiosk
            </UButton>
            <UButton
              v-if="canManage"
              :to="`/dashboard/sites/${site.id}`"
              variant="soft"
              size="sm"
              class="flex-1"
            >
              Edit
            </UButton>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
