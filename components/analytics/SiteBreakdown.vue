<script setup lang="ts">
const props = defineProps<{
  data: { name: string; count: number }[]
}>()

const total = computed(() => props.data.reduce((s, d) => s + d.count, 0))
</script>

<template>
  <div v-if="data.length === 0" class="py-8 text-center text-gray-400 text-sm">No data yet</div>
  <div v-else class="space-y-3">
    <div v-for="site in data" :key="site.name" class="flex items-center gap-3">
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between mb-1">
          <span class="text-sm font-medium text-gray-700 truncate">{{ site.name }}</span>
          <span class="text-sm text-gray-500 ml-2 shrink-0">{{ site.count }}</span>
        </div>
        <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-primary-500 rounded-full transition-all duration-500"
            :style="{ width: `${total > 0 ? (site.count / total) * 100 : 0}%` }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
