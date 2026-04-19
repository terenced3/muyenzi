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

watch(user, (u) => { if (u) fetchSites() }, { immediate: true })

// ── Delete ─────────────────────────────────────────────────────
const deleteTarget = ref<Site | null>(null)
const deleting = ref(false)

function promptDelete(site: Site) {
  deleteTarget.value = site
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await $fetch(`/api/sites/${deleteTarget.value.id}`, { method: 'DELETE' })
    toast.add({ title: `"${deleteTarget.value.name}" deleted`, color: 'orange' })
    sites.value = sites.value.filter(s => s.id !== deleteTarget.value!.id)
    deleteTarget.value = null
  } catch (e: any) {
    toast.add({ title: 'Cannot delete site', description: e?.data?.statusMessage ?? 'Unknown error', color: 'red' })
  } finally {
    deleting.value = false
  }
}

// ── QR Poster ─────────────────────────────────────────────────
const posterSite = ref<Site | null>(null)

function showPoster(site: Site) {
  posterSite.value = site
}

function printPoster() {
  window.print()
}

const kioskUrl = computed(() =>
  posterSite.value ? `${window.location.origin}/kiosk/${posterSite.value.id}` : '',
)
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
              @click="promptDelete(site)"
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
              variant="soft"
              color="gray"
              size="sm"
              icon="i-lucide-qr-code"
              @click="showPoster(site)"
            >
              QR Poster
            </UButton>
            <UButton
              v-if="canManage"
              :to="`/dashboard/sites/${site.id}`"
              variant="soft"
              size="sm"
            >
              Edit
            </UButton>
          </div>
        </UCard>
      </div>
    </div>
  </div>

  <!-- ── Delete confirm modal ── -->
  <UModal :model-value="!!deleteTarget" @update:model-value="deleteTarget = null">
    <UCard v-if="deleteTarget">
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <h2 class="font-bold text-gray-900">Delete site?</h2>
            <p class="text-xs text-gray-400 mt-0.5">This action is permanent and logged to the audit trail.</p>
          </div>
          <UButton variant="ghost" color="gray" icon="i-lucide-x" size="sm" @click="deleteTarget = null" />
        </div>
      </template>

      <div class="space-y-4">
        <div class="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
          <UIcon name="i-lucide-building-2" class="h-5 w-5 text-red-400 shrink-0" />
          <div>
            <p class="font-semibold text-gray-900 text-sm">{{ deleteTarget.name }}</p>
            <p v-if="deleteTarget.address" class="text-xs text-gray-400">{{ deleteTarget.address }}</p>
          </div>
        </div>
        <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 space-y-1">
          <p class="font-semibold">Before deleting, make sure:</p>
          <ul class="list-disc pl-4 space-y-0.5 text-xs">
            <li>No visitors are currently checked in at this site</li>
            <li>The kiosk device at this location has been decommissioned</li>
          </ul>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton variant="outline" @click="deleteTarget = null">Cancel</UButton>
          <UButton color="red" icon="i-lucide-trash-2" :loading="deleting" @click="confirmDelete">
            Delete site
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>

  <!-- ── QR Poster modal ── -->
  <UModal
    :model-value="!!posterSite"
    :ui="{ width: 'max-w-lg' }"
    @update:model-value="posterSite = null"
  >
    <UCard v-if="posterSite">
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="font-bold text-gray-900">Visitor QR Poster</h2>
          <div class="flex gap-2">
            <UButton size="sm" icon="i-lucide-printer" @click="printPoster">Print</UButton>
            <UButton variant="ghost" color="gray" icon="i-lucide-x" size="sm" @click="posterSite = null" />
          </div>
        </div>
      </template>

      <!-- Printable poster content -->
      <div id="qr-poster" class="flex flex-col items-center text-center py-6 px-4 space-y-5">
        <!-- Company branding strip -->
        <div class="w-full rounded-xl py-3 px-5 flex items-center justify-center gap-3"
             style="background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%)">
          <span class="text-white font-bold text-xl tracking-tight">muyenzi</span>
        </div>

        <div class="space-y-1">
          <h1 class="text-2xl font-bold text-gray-900">{{ posterSite.name }}</h1>
          <p v-if="posterSite.address" class="text-sm text-gray-500">{{ posterSite.address }}</p>
        </div>

        <p class="text-base text-gray-700 font-medium">Scan to check in as a visitor</p>

        <div class="p-5 bg-white rounded-2xl shadow-lg border border-gray-100">
          <SharedQRCodeDisplay :data="kioskUrl" :size="220" />
        </div>

        <div class="w-full p-3 bg-gray-50 rounded-xl text-center">
          <p class="text-xs text-gray-400 font-mono break-all">{{ kioskUrl }}</p>
        </div>

        <div class="grid grid-cols-3 gap-4 w-full pt-2">
          <div class="text-center">
            <div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-1.5">
              <span class="text-indigo-600 font-bold text-sm">1</span>
            </div>
            <p class="text-xs text-gray-600">Scan the QR code</p>
          </div>
          <div class="text-center">
            <div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-1.5">
              <span class="text-indigo-600 font-bold text-sm">2</span>
            </div>
            <p class="text-xs text-gray-600">Enter your details</p>
          </div>
          <div class="text-center">
            <div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-1.5">
              <span class="text-indigo-600 font-bold text-sm">3</span>
            </div>
            <p class="text-xs text-gray-600">Your host is notified</p>
          </div>
        </div>

        <p class="text-[10px] text-gray-300 pt-2">Powered by Muyenzi Visitor Management</p>
      </div>
    </UCard>
  </UModal>
</template>

<style>
@media print {
  body > * { display: none !important; }
  #qr-poster {
    display: flex !important;
    position: fixed;
    inset: 0;
    background: white;
    z-index: 9999;
  }
}
</style>
