<script setup lang="ts">
import type { VisitWithRelations } from '~/types/database'

const props = defineProps<{ siteId: string; companyId: string }>()
const emit = defineEmits<{
  success: [visit: VisitWithRelations]
  error: [message: string]
  back: []
}>()

const form = reactive({ name: '', email: '', company: '', purpose: '' })
const loading = ref(false)

async function submit() {
  if (!form.name.trim()) return
  loading.value = true
  emit('error', '')
  const res = await fetch(`/api/kiosk/${props.siteId}/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walk_in: true, ...form, company_id: props.companyId }),
  })
  const data = await res.json()
  loading.value = false
  if (!res.ok) { emit('error', data.error ?? 'Something went wrong'); return }
  emit('success', data.visit)
}
</script>

<template>
  <div class="space-y-4">
    <div class="text-center mb-2">
      <UIcon name="i-lucide-user-plus" class="h-10 w-10 text-slate-400 mx-auto mb-3" />
      <h2 class="font-semibold text-slate-900 text-lg">Walk-in registration</h2>
    </div>
    <div class="space-y-3">
      <div>
        <label class="text-sm font-medium text-slate-700">Full name *</label>
        <input
          v-model="form.name"
          class="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-slate-900 transition-colors"
          placeholder="Jane Smith"
        />
      </div>
      <div>
        <label class="text-sm font-medium text-slate-700">Email</label>
        <input
          v-model="form.email"
          type="email"
          class="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-slate-900 transition-colors"
          placeholder="jane@acme.com"
        />
      </div>
      <div>
        <label class="text-sm font-medium text-slate-700">Company</label>
        <input
          v-model="form.company"
          class="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-slate-900 transition-colors"
          placeholder="Acme Corp"
        />
      </div>
      <div>
        <label class="text-sm font-medium text-slate-700">Purpose of visit</label>
        <input
          v-model="form.purpose"
          class="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-slate-900 transition-colors"
          placeholder="Meeting, Delivery…"
        />
      </div>
    </div>
    <button
      class="w-full h-12 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50"
      :disabled="loading || !form.name.trim()"
      @click="submit"
    >
      {{ loading ? 'Checking in…' : 'Check In' }}
    </button>
    <button class="w-full py-3 text-sm text-slate-500 hover:text-slate-900 transition-colors" @click="emit('back')">
      Back
    </button>
  </div>
</template>
