<script setup lang="ts">
import type { VisitWithRelations } from '~/types/database'

const props = defineProps<{
  site: { id: string; name: string; address: string | null; company_id: string }
}>()

type Tab = 'checkin' | 'checkout'
type Method = 'qr' | 'code' | 'manual' | null

const tab = ref<Tab>('checkin')
const method = ref<Method>(null)
const result = ref<VisitWithRelations | null>(null)
const error = ref<string | null>(null)

function reset() { method.value = null; result.value = null; error.value = null }

function setTab(t: Tab) { tab.value = t; reset() }
</script>

<template>
  <div class="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
    <div class="w-full max-w-lg">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
          <span class="text-white font-bold text-2xl">M</span>
        </div>
        <h1 class="text-2xl font-bold text-white">{{ site.name }}</h1>
        <p v-if="site.address" class="text-slate-400 text-sm mt-1">{{ site.address }}</p>
      </div>

      <!-- Success screen -->
      <KioskSuccessScreen v-if="result" :visit="result" :tab="tab" @reset="reset" />

      <!-- Main card -->
      <div v-else class="bg-white rounded-2xl shadow-xl overflow-hidden">
        <!-- Tabs -->
        <div class="flex border-b">
          <button
            class="flex-1 py-4 text-sm font-semibold transition-colors"
            :class="tab === 'checkin' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-500'"
            @click="setTab('checkin')"
          >
            Check In
          </button>
          <button
            class="flex-1 py-4 text-sm font-semibold transition-colors"
            :class="tab === 'checkout' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-500'"
            @click="setTab('checkout')"
          >
            Check Out
          </button>
        </div>

        <div class="p-6">
          <!-- Check In: method picker -->
          <KioskMethodPicker v-if="tab === 'checkin' && !method" @select="(m: Method) => method = m" />

          <!-- Check In: code entry -->
          <KioskCodeEntry
            v-else-if="tab === 'checkin' && method === 'code'"
            :site-id="site.id"
            endpoint="checkin"
            @success="(v: VisitWithRelations) => result = v"
            @error="(e: string) => error = e"
            @back="reset"
          />

          <!-- Check In: QR entry -->
          <KioskQREntry
            v-else-if="tab === 'checkin' && method === 'qr'"
            :site-id="site.id"
            @success="(v: VisitWithRelations) => result = v"
            @error="(e: string) => error = e"
            @back="reset"
          />

          <!-- Check In: manual walk-in -->
          <KioskManualEntry
            v-else-if="tab === 'checkin' && method === 'manual'"
            :site-id="site.id"
            :company-id="site.company_id"
            @success="(v: VisitWithRelations) => result = v"
            @error="(e: string) => error = e"
            @back="reset"
          />

          <!-- Check Out -->
          <KioskCodeEntry
            v-else-if="tab === 'checkout'"
            :site-id="site.id"
            endpoint="checkout"
            :checkout-mode="true"
            @success="(v: VisitWithRelations) => result = v"
            @error="(e: string) => error = e"
            @back="setTab('checkin')"
          />

          <p v-if="error" class="mt-4 text-sm text-red-600 text-center">{{ error }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
