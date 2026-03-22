<script setup lang="ts">
const emit = defineEmits<{
  select: [method: 'qr' | 'code' | 'manual']
}>()

const methods = [
  { key: 'qr' as const, icon: 'i-lucide-qr-code', title: 'Scan QR Code', desc: 'Use your invitation QR code' },
  { key: 'code' as const, icon: 'i-lucide-hash', title: 'Enter Access Code', desc: 'Use the code from your invitation' },
  { key: 'manual' as const, icon: 'i-lucide-user-plus', title: 'Walk-in Registration', desc: 'Register without a prior invitation' },
]
</script>

<template>
  <div class="space-y-3">
    <p class="text-center text-slate-600 text-sm mb-6">How would you like to check in?</p>
    <button
      v-for="m in methods"
      :key="m.key"
      class="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-slate-900 hover:bg-slate-50 transition-all text-left"
      @click="emit('select', m.key)"
    >
      <div class="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
        <UIcon :name="m.icon" class="h-6 w-6 text-slate-700" />
      </div>
      <div>
        <p class="font-semibold text-slate-900">{{ m.title }}</p>
        <p class="text-sm text-slate-500">{{ m.desc }}</p>
      </div>
    </button>
  </div>
</template>
