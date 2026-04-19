<script setup lang="ts">
defineProps<{ noticeText: string; siteName: string }>()
const emit = defineEmits<{ (e: 'accepted'): void }>()

const scrolledToBottom = ref(false)
const scrollContainer = ref<HTMLElement | null>(null)

function onScroll(e: Event) {
  const el = e.target as HTMLElement
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) scrolledToBottom.value = true
}
</script>

<template>
  <div class="flex flex-col space-y-5 p-6">
    <div class="text-center">
      <div class="h-12 w-12 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-3">
        <UIcon name="i-lucide-shield-check" class="h-6 w-6 text-indigo-600" />
      </div>
      <h2 class="text-xl font-bold text-gray-900">Privacy Notice</h2>
      <p class="text-sm text-gray-500 mt-1">Please read before checking in at {{ siteName }}</p>
    </div>

    <!-- Scrollable notice text -->
    <div
      ref="scrollContainer"
      class="overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap"
      style="max-height: 280px"
      @scroll="onScroll"
    >
      {{ noticeText }}
    </div>

    <div
      v-if="!scrolledToBottom"
      class="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5"
    >
      <UIcon name="i-lucide-arrow-down" class="h-4 w-4 shrink-0 animate-bounce" />
      Scroll to the bottom to continue
    </div>

    <button
      class="w-full py-4 rounded-2xl font-bold text-white text-base transition-all"
      :class="scrolledToBottom
        ? 'bg-slate-900 hover:bg-slate-800 active:scale-95'
        : 'bg-gray-200 text-gray-400 cursor-not-allowed'"
      :disabled="!scrolledToBottom"
      @click="scrolledToBottom && emit('accepted')"
    >
      I understand and agree
    </button>
  </div>
</template>
