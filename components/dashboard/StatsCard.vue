<script setup lang="ts">
defineProps<{
  title: string
  value: number
  icon: string
  description: string
  accent?: 'primary' | 'success' | 'warning' | 'secondary'
  loading?: boolean
}>()

const ACCENT_COLORS = {
  primary: { bg: 'bg-primary-50', text: 'text-primary-500', val: 'text-primary-600' },
  success: { bg: 'bg-green-50', text: 'text-green-500', val: 'text-green-600' },
  warning: { bg: 'bg-amber-50', text: 'text-amber-500', val: 'text-amber-600' },
  secondary: { bg: 'bg-violet-50', text: 'text-violet-500', val: 'text-violet-600' },
}
</script>

<template>
  <UCard>
    <div class="flex items-start justify-between">
      <div>
        <p class="text-sm text-gray-500 font-medium">{{ title }}</p>
        <p v-if="loading" class="text-3xl font-bold text-gray-200 mt-1 animate-pulse">—</p>
        <p v-else class="text-3xl font-bold text-gray-900 mt-1">{{ value.toLocaleString() }}</p>
        <p class="text-xs text-gray-400 mt-1">{{ description }}</p>
      </div>
      <div
        class="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
        :class="ACCENT_COLORS[accent ?? 'primary'].bg"
      >
        <UIcon :name="icon" class="h-5 w-5" :class="ACCENT_COLORS[accent ?? 'primary'].text" />
      </div>
    </div>
  </UCard>
</template>
