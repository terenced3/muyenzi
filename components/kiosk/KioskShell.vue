<script setup lang="ts">
import type { VisitWithRelations } from '~/types/database'

const props = defineProps<{
  site: {
    id: string
    name: string
    address: string | null
    company_id: string
    company?: { name: string; logo_url: string | null } | null
  }
}>()

type Tab = 'checkin' | 'checkout'
type Method = 'qr' | 'code' | 'manual' | null

const tab = ref<Tab>('checkin')
const method = ref<Method>(null)
const result = ref<VisitWithRelations | null>(null)
const error = ref<string | null>(null)

const { isOnline, isSyncing, pendingVisitsCount } = useOfflineSync()

// Idle timeout — reset to home after 60s of inactivity
const IDLE_MS = 60_000
let idleTimer: ReturnType<typeof setTimeout> | null = null

function resetIdle() {
  if (idleTimer) clearTimeout(idleTimer)
  if (!result.value && method.value !== null) {
    idleTimer = setTimeout(() => reset(), IDLE_MS)
  }
}

function reset() {
  method.value = null
  result.value = null
  error.value = null
  if (idleTimer) { clearTimeout(idleTimer); idleTimer = null }
}

function setTab(t: Tab) { tab.value = t; reset() }

// Re-arm idle timer on any user interaction
onMounted(() => {
  window.addEventListener('pointerdown', resetIdle, { passive: true })
  window.addEventListener('keydown', resetIdle, { passive: true })
})
onUnmounted(() => {
  window.removeEventListener('pointerdown', resetIdle)
  window.removeEventListener('keydown', resetIdle)
  if (idleTimer) clearTimeout(idleTimer)
})

// Start idle timer whenever the user picks a method
watch(method, (val) => { if (val) resetIdle() })
</script>

<template>
  <div
    class="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6"
    @click="resetIdle"
  >
    <!-- Connection Status Banner -->
    <div v-if="!isOnline || isSyncing" class="absolute top-0 left-0 right-0 bg-amber-50 border-b border-amber-200 px-4 py-3 text-center text-sm font-medium">
      <div v-if="!isOnline" class="flex items-center justify-center gap-2 text-amber-900">
        <UIcon name="i-lucide-wifi-off" class="h-4 w-4" />
        <span>Offline mode — check-ins will sync automatically</span>
      </div>
      <div v-else-if="isSyncing" class="flex items-center justify-center gap-2 text-amber-900">
        <UIcon name="i-lucide-loader-2" class="h-4 w-4 animate-spin" />
        <span>Syncing {{ pendingVisitsCount }} pending check-in{{ pendingVisitsCount !== 1 ? 's' : '' }}…</span>
      </div>
    </div>

    <div class="w-full max-w-lg" :class="{ 'mt-16': !isOnline || isSyncing }">

      <!-- Header -->
      <div class="text-center mb-8">
        <!-- Company logo or fallback monogram -->
        <div class="h-16 w-16 rounded-2xl overflow-hidden flex items-center justify-center mx-auto mb-4"
             :class="site.company?.logo_url ? 'bg-white p-1' : 'bg-white/10'">
          <img
            v-if="site.company?.logo_url"
            :src="site.company.logo_url"
            :alt="site.name"
            class="h-full w-full object-contain"
          />
          <span v-else class="text-white font-bold text-2xl">{{ site.name.charAt(0).toUpperCase() }}</span>
        </div>
        <h1 class="text-2xl font-bold text-white">{{ site.name }}</h1>
        <p v-if="site.address" class="text-slate-400 text-sm mt-1">{{ site.address }}</p>
      </div>

      <!-- Success screen -->
      <KioskSuccessScreen v-if="result" :visit="result" :tab="tab" @reset="reset" />

      <!-- Main card -->
      <div v-else class="bg-white rounded-2xl shadow-xl overflow-hidden">

        <!-- Tabs -->
        <div class="flex border-b border-slate-100">
          <button
            class="flex-1 py-4 text-sm font-semibold transition-colors"
            :class="tab === 'checkin' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-700'"
            @click="setTab('checkin')"
          >
            Check In
          </button>
          <button
            class="flex-1 py-4 text-sm font-semibold transition-colors"
            :class="tab === 'checkout' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-700'"
            @click="setTab('checkout')"
          >
            Check Out
          </button>
        </div>

        <div class="p-6">

          <!-- ── CHECK IN ── -->
          <KioskMethodPicker
            v-if="tab === 'checkin' && !method"
            @select="(m: Method) => method = m"
          />

          <KioskCodeEntry
            v-else-if="tab === 'checkin' && method === 'code'"
            :site-id="site.id"
            endpoint="checkin"
            @success="(v: VisitWithRelations) => result = v"
            @error="(e: string) => error = e"
            @back="reset"
          />

          <KioskQREntry
            v-else-if="tab === 'checkin' && method === 'qr'"
            :site-id="site.id"
            endpoint="checkin"
            @success="(v: VisitWithRelations) => result = v"
            @error="(e: string) => error = e"
            @back="reset"
          />

          <KioskManualEntry
            v-else-if="tab === 'checkin' && method === 'manual'"
            :site-id="site.id"
            :company-id="site.company_id"
            @success="(v: VisitWithRelations) => result = v"
            @error="(e: string) => error = e"
            @back="reset"
          />

          <!-- ── CHECK OUT ── -->
          <!-- Method picker for checkout: QR or access code -->
          <div v-else-if="tab === 'checkout' && !method" class="space-y-3">
            <p class="text-center text-slate-600 text-sm mb-6">How would you like to check out?</p>
            <button
              class="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-slate-900 hover:bg-slate-50 transition-all text-left"
              @click="method = 'qr'"
            >
              <div class="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <UIcon name="i-lucide-qr-code" class="h-6 w-6 text-slate-700" />
              </div>
              <div>
                <p class="font-semibold text-slate-900">Scan QR Code</p>
                <p class="text-sm text-slate-500">Use your invitation QR code</p>
              </div>
            </button>
            <button
              class="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-slate-900 hover:bg-slate-50 transition-all text-left"
              @click="method = 'code'"
            >
              <div class="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <UIcon name="i-lucide-hash" class="h-6 w-6 text-slate-700" />
              </div>
              <div>
                <p class="font-semibold text-slate-900">Enter Access Code</p>
                <p class="text-sm text-slate-500">Use the code from your invitation</p>
              </div>
            </button>
          </div>

          <KioskQREntry
            v-else-if="tab === 'checkout' && method === 'qr'"
            :site-id="site.id"
            endpoint="checkout"
            @success="(v: VisitWithRelations) => result = v"
            @error="(e: string) => error = e"
            @back="reset"
          />

          <KioskCodeEntry
            v-else-if="tab === 'checkout' && method === 'code'"
            :site-id="site.id"
            endpoint="checkout"
            :checkout-mode="true"
            @success="(v: VisitWithRelations) => result = v"
            @error="(e: string) => error = e"
            @back="reset"
          />

          <!-- Global error banner (used for unhandled errors) -->
          <p v-if="error" class="mt-4 text-sm text-red-600 text-center">{{ error }}</p>
        </div>
      </div>

      <!-- Footer -->
      <p class="text-center text-slate-600 text-xs mt-6">Powered by Muyenzi VMS</p>
    </div>
  </div>
</template>
