<script setup lang="ts">
import type { VisitWithRelations } from '~/types/database'

const props = defineProps<{ siteId: string }>()
const emit = defineEmits<{
  success: [visit: VisitWithRelations]
  error: [message: string]
  back: []
}>()

const manualCode = ref('')
const loading = ref(false)

async function submit() {
  if (!manualCode.value.trim()) return
  loading.value = true
  emit('error', '')
  const res = await fetch(`/api/kiosk/${props.siteId}/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_code: manualCode.value.trim() }),
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
      <UIcon name="i-lucide-qr-code" class="h-10 w-10 text-slate-400 mx-auto mb-3" />
      <h2 class="font-semibold text-slate-900 text-lg">Scan or enter your code</h2>
      <p class="text-sm text-slate-500 mt-1">Point your QR code at the camera, or type the access code below</p>
    </div>
    <div class="bg-slate-100 rounded-xl h-48 flex items-center justify-center text-slate-400 text-sm">
      Camera scanner (requires HTTPS + camera permission)
    </div>
    <div class="space-y-3">
      <input
        v-model="manualCode"
        class="w-full text-center font-mono tracking-widest border-2 border-slate-200 rounded-xl h-12 focus:outline-none focus:border-slate-900 transition-colors uppercase px-4"
        placeholder="Or type your access code…"
        @keydown.enter="submit"
        @input="manualCode = (manualCode as unknown as string).toUpperCase()"
      />
      <button
        class="w-full h-12 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50"
        :disabled="loading || !manualCode.trim()"
        @click="submit"
      >
        {{ loading ? 'Checking…' : 'Check In' }}
      </button>
      <button class="w-full py-3 text-sm text-slate-500 hover:text-slate-900 transition-colors" @click="emit('back')">
        Back
      </button>
    </div>
  </div>
</template>
