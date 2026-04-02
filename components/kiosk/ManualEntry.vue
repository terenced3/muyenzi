<script setup lang="ts">
import type { VisitWithRelations, VisitorCustomField } from '~/types/database'

const props = defineProps<{ siteId: string; companyId: string }>()
const emit = defineEmits<{
  success: [visit: VisitWithRelations]
  error: [message: string]
  back: []
}>()

const form = reactive({ name: '', email: '', company: '', purpose: '', phone: '' })
const loading = ref(false)
const fieldErrors = reactive<Record<string, string>>({})
const serverError = ref<string | null>(null)

const customFields = ref<VisitorCustomField[]>([])
const customFieldValues = reactive<Record<string, string | number>>({})

onMounted(async () => {
  if (!props.companyId) return
  const res = await fetch(`/api/visitor-fields?company_id=${props.companyId}`)
  if (res.ok) customFields.value = await res.json()
})

function validate(): boolean {
  Object.keys(fieldErrors).forEach(k => delete fieldErrors[k])
  if (!form.name.trim()) {
    fieldErrors.name = 'Full name is required'
  }
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    fieldErrors.email = 'Enter a valid email address'
  }
  if (form.phone && !/^\+?[\d\s\-().]{7,20}$/.test(form.phone)) {
    fieldErrors.phone = 'Enter a valid phone number'
  }
  for (const field of customFields.value) {
    if (field.required && !customFieldValues[field.field_key]?.toString().trim()) {
      fieldErrors[`custom_${field.field_key}`] = `${field.label} is required`
    }
  }
  return Object.keys(fieldErrors).length === 0
}

async function submit() {
  if (!validate()) return
  loading.value = true
  serverError.value = null
  emit('error', '')

  const payload = {
    walk_in: true,
    name: form.name.trim(),
    email: form.email.trim() || undefined,
    company: form.company.trim() || undefined,
    purpose: form.purpose.trim() || undefined,
    phone: form.phone.trim() || undefined,
    company_id: props.companyId,
    custom_field_values: Object.keys(customFieldValues).length > 0 ? { ...customFieldValues } : undefined,
  }

  try {
    const res = await fetch(`/api/kiosk/${props.siteId}/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    loading.value = false

    if (!res.ok) {
      const msg = data.statusMessage ?? data.error ?? 'Something went wrong'
      serverError.value = msg
      emit('error', msg)
      return
    }
    emit('success', data.visit)
  } catch (err) {
    // Network error — save offline
    loading.value = false
    const { saveVisitOffline } = useOfflineSync()

    const result = await saveVisitOffline({
      company_id: props.companyId,
      site_id: props.siteId,
      walk_in: true,
      visitor_name: form.name.trim(),
      visitor_email: form.email?.trim() || null,
      visitor_phone: form.phone?.trim() || null,
      visitor_company: form.company?.trim() || null,
      purpose: form.purpose?.trim() || null,
      custom_field_values: payload.custom_field_values || null,
    })

    if (result.success) {
      // Show offline confirmation
      serverError.value = null
      emit('success', {
        id: 'offline-' + Date.now(),
        visitor: { full_name: form.name.trim() },
        site: { name: 'Offline' },
        access_code: 'OFFLINE',
        status: 'checking_in',
      } as any)
    } else {
      serverError.value = 'Failed to save check-in. Please try again.'
      emit('error', serverError.value)
    }
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="text-center mb-2">
      <UIcon name="i-lucide-user-plus" class="h-10 w-10 text-slate-400 mx-auto mb-3" />
      <h2 class="font-semibold text-slate-900 text-lg">Walk-in registration</h2>
      <p class="text-sm text-slate-500 mt-1">No invitation? Fill in your details to check in.</p>
    </div>

    <!-- Server error -->
    <div v-if="serverError" class="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
      <UIcon name="i-lucide-alert-circle" class="h-4 w-4 text-red-500 shrink-0" />
      <p class="text-sm text-red-700">{{ serverError }}</p>
    </div>

    <!-- Form fields -->
    <div class="space-y-3">
      <!-- Full name -->
      <div>
        <label class="text-sm font-medium text-slate-700">
          Full name <span class="text-red-500">*</span>
        </label>
        <input
          v-model="form.name"
          class="mt-1 w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors"
          :class="fieldErrors.name ? 'border-red-400 focus:border-red-500 bg-red-50' : 'border-slate-200 focus:border-slate-900'"
          placeholder="Jane Smith"
          autocomplete="name"
        />
        <p v-if="fieldErrors.name" class="text-xs text-red-600 mt-1">{{ fieldErrors.name }}</p>
      </div>

      <!-- Email -->
      <div>
        <label class="text-sm font-medium text-slate-700">Email</label>
        <input
          v-model="form.email"
          type="email"
          class="mt-1 w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors"
          :class="fieldErrors.email ? 'border-red-400 focus:border-red-500 bg-red-50' : 'border-slate-200 focus:border-slate-900'"
          placeholder="jane@acme.com"
          autocomplete="email"
        />
        <p v-if="fieldErrors.email" class="text-xs text-red-600 mt-1">{{ fieldErrors.email }}</p>
      </div>

      <!-- Phone -->
      <div>
        <label class="text-sm font-medium text-slate-700">Phone</label>
        <input
          v-model="form.phone"
          type="tel"
          class="mt-1 w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors"
          :class="fieldErrors.phone ? 'border-red-400 focus:border-red-500 bg-red-50' : 'border-slate-200 focus:border-slate-900'"
          placeholder="+1 555 000 1234"
          autocomplete="tel"
        />
        <p v-if="fieldErrors.phone" class="text-xs text-red-600 mt-1">{{ fieldErrors.phone }}</p>
      </div>

      <!-- Company -->
      <div>
        <label class="text-sm font-medium text-slate-700">Company</label>
        <input
          v-model="form.company"
          class="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-slate-900 transition-colors"
          placeholder="Acme Corp"
          autocomplete="organization"
        />
      </div>

      <!-- Purpose -->
      <div>
        <label class="text-sm font-medium text-slate-700">Purpose of visit</label>
        <input
          v-model="form.purpose"
          class="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-slate-900 transition-colors"
          placeholder="Meeting, Delivery, Interview…"
        />
      </div>

      <!-- Custom fields -->
      <template v-for="field in customFields" :key="field.id">
        <div>
          <label class="text-sm font-medium text-slate-700">
            {{ field.label }} <span v-if="field.required" class="text-red-500">*</span>
          </label>
          <select
            v-if="field.field_type === 'select'"
            v-model="customFieldValues[field.field_key]"
            class="mt-1 w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors"
            :class="fieldErrors[`custom_${field.field_key}`] ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-slate-900'"
          >
            <option value="">Select…</option>
            <option v-for="opt in field.options ?? []" :key="opt" :value="opt">{{ opt }}</option>
          </select>
          <textarea
            v-else-if="field.field_type === 'textarea'"
            v-model="customFieldValues[field.field_key]"
            rows="3"
            class="mt-1 w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors resize-none"
            :class="fieldErrors[`custom_${field.field_key}`] ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-slate-900'"
          />
          <input
            v-else
            v-model="customFieldValues[field.field_key]"
            :type="field.field_type === 'number' ? 'number' : 'text'"
            class="mt-1 w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors"
            :class="fieldErrors[`custom_${field.field_key}`] ? 'border-red-400 focus:border-red-500 bg-red-50' : 'border-slate-200 focus:border-slate-900'"
          />
          <p v-if="fieldErrors[`custom_${field.field_key}`]" class="text-xs text-red-600 mt-1">
            {{ fieldErrors[`custom_${field.field_key}`] }}
          </p>
        </div>
      </template>
    </div>

    <!-- Submit -->
    <button
      class="w-full h-13 py-3.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 active:bg-slate-700 transition-colors disabled:opacity-40"
      :disabled="loading || !form.name.trim()"
      @click="submit"
    >
      <span v-if="loading" class="flex items-center justify-center gap-2">
        <UIcon name="i-lucide-loader-2" class="h-5 w-5 animate-spin" />
        Checking in…
      </span>
      <span v-else>Check In</span>
    </button>

    <button
      class="w-full py-3 text-sm text-slate-500 hover:text-slate-900 transition-colors"
      @click="emit('back')"
    >
      Back
    </button>
  </div>
</template>
