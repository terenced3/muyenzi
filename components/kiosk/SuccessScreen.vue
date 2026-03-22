<script setup lang="ts">
import type { VisitWithRelations } from '~/types/database'

const props = defineProps<{
  visit: VisitWithRelations
  tab: 'checkin' | 'checkout'
}>()

const emit = defineEmits<{ reset: [] }>()

const isCheckout = computed(() => props.tab === 'checkout')

onMounted(() => {
  const t = setTimeout(() => emit('reset'), 8000)
  onUnmounted(() => clearTimeout(t))
})
</script>

<template>
  <div class="bg-white rounded-2xl shadow-xl p-8 text-center">
    <div
      class="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-6"
      :class="isCheckout ? 'bg-orange-100' : 'bg-emerald-100'"
    >
      <UIcon
        :name="isCheckout ? 'i-lucide-log-out' : 'i-lucide-check-circle-2'"
        class="h-8 w-8"
        :class="isCheckout ? 'text-orange-600' : 'text-emerald-600'"
      />
    </div>
    <h2 class="text-2xl font-bold text-slate-900 mb-2">{{ isCheckout ? 'Goodbye!' : 'Welcome!' }}</h2>
    <p class="text-lg text-slate-700 font-medium">{{ visit.visitor?.full_name }}</p>
    <p v-if="!isCheckout && visit.host" class="text-slate-500 mt-1">
      Your host <strong>{{ visit.host.full_name }}</strong> has been notified.
    </p>
    <p v-if="isCheckout" class="text-slate-500 mt-1">Thank you for your visit. Have a safe journey!</p>
    <p class="text-xs text-slate-400 mt-6">Returning to home screen in a few seconds…</p>
    <button
      class="mt-4 px-6 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
      @click="emit('reset')"
    >
      Done
    </button>
  </div>
</template>
