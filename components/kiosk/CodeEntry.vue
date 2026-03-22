<script setup lang="ts">
import type { VisitWithRelations } from '~/types/database'

const props = defineProps<{
  siteId: string
  endpoint: 'checkin' | 'checkout'
  checkoutMode?: boolean
}>()

const emit = defineEmits<{
  success: [visit: VisitWithRelations]
  error: [message: string]
  back: []
}>()

const code = ref('')
const loading = ref(false)

async function submit() {
  if (!code.value.trim()) return
  loading.value = true
  emit('error', '')
  const res = await fetch(`/api/kiosk/${props.siteId}/${props.endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_code: code.value.trim() }),
  })
  const data = await res.json()
  loading.value = false
  if (!res.ok) { emit('error', data.error ?? 'Something went wrong'); return }
  emit('success', data.visit)
}
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <UIcon name="i-lucide-hash" class="h-10 w-10 text-slate-400 mx-auto mb-3" />
      <h2 class="font-semibold text-slate-900 text-lg">
        {{ checkoutMode ? 'Enter your access code to check out' : 'Enter your access code' }}
      </h2>
    </div>
    <div class="space-y-3">
      <input
        v-model="code"
        class="w-full text-center text-2xl font-mono tracking-widest h-16 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 transition-colors uppercase"
        placeholder="e.g. ABC123"
        autofocus
        @keydown.enter="submit"
        @input="code = (code as unknown as string).toUpperCase()"
      />
      <button
        class="w-full h-12 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50"
        :disabled="loading || !code.trim()"
        @click="submit"
      >
        {{ loading ? 'Checking…' : checkoutMode ? 'Check Out' : 'Check In' }}
      </button>
      <button class="w-full py-3 text-sm text-slate-500 hover:text-slate-900 transition-colors" @click="emit('back')">
        Back
      </button>
    </div>
  </div>
</template>
