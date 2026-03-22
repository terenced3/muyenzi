<script setup lang="ts">
import type { VisitWithRelations } from '~/types/database'

const props = defineProps<{
  visit: VisitWithRelations
  tab: 'checkin' | 'checkout'
}>()

const emit = defineEmits<{ reset: [] }>()

const RESET_SECONDS = 8
const remaining = ref(RESET_SECONDS)

const isCheckout = computed(() => props.tab === 'checkout')

// SVG circle countdown
const RADIUS = 28
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const dashOffset = computed(() =>
  CIRCUMFERENCE * (1 - remaining.value / RESET_SECONDS)
)

let interval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  interval = setInterval(() => {
    remaining.value -= 1
    if (remaining.value <= 0) {
      clearInterval(interval!)
      emit('reset')
    }
  }, 1000)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})
</script>

<template>
  <div class="bg-white rounded-2xl shadow-xl p-8 text-center">
    <!-- Icon -->
    <div
      class="h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6"
      :class="isCheckout ? 'bg-orange-100' : 'bg-emerald-100'"
    >
      <UIcon
        :name="isCheckout ? 'i-lucide-log-out' : 'i-lucide-check-circle-2'"
        class="h-10 w-10"
        :class="isCheckout ? 'text-orange-600' : 'text-emerald-600'"
      />
    </div>

    <!-- Message -->
    <h2 class="text-3xl font-bold text-slate-900 mb-2">
      {{ isCheckout ? 'Goodbye!' : 'Welcome!' }}
    </h2>
    <p class="text-xl text-slate-700 font-medium">{{ visit.visitor?.full_name }}</p>

    <p v-if="!isCheckout && visit.host" class="text-slate-500 mt-2">
      Your host <strong>{{ visit.host.full_name }}</strong> has been notified.
    </p>
    <p v-if="isCheckout" class="text-slate-500 mt-2">
      Thank you for your visit. Have a safe journey!
    </p>
    <p v-if="!isCheckout && visit.site" class="text-slate-400 text-sm mt-1">
      Checked in at {{ visit.site.name }}
    </p>

    <!-- Countdown ring -->
    <div class="flex flex-col items-center mt-8 mb-2">
      <svg :width="RADIUS * 2 + 8" :height="RADIUS * 2 + 8" class="-rotate-90">
        <!-- Track -->
        <circle
          :cx="RADIUS + 4" :cy="RADIUS + 4" :r="RADIUS"
          fill="none" stroke-width="4"
          :stroke="isCheckout ? '#fed7aa' : '#d1fae5'"
        />
        <!-- Progress arc -->
        <circle
          :cx="RADIUS + 4" :cy="RADIUS + 4" :r="RADIUS"
          fill="none" stroke-width="4"
          :stroke="isCheckout ? '#ea580c' : '#059669'"
          :stroke-dasharray="CIRCUMFERENCE"
          :stroke-dashoffset="dashOffset"
          stroke-linecap="round"
          style="transition: stroke-dashoffset 0.9s linear"
        />
      </svg>
      <p class="text-xs text-slate-400 -mt-1">Returning in {{ remaining }}s</p>
    </div>

    <button
      class="mt-2 px-8 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors"
      @click="emit('reset')"
    >
      Done
    </button>
  </div>
</template>
