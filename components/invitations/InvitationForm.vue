<script setup lang="ts">
import type { VisitorCustomField } from '~/types/database'

const props = defineProps<{
  companyId: string
  hostId: string
  sites: { id: string; name: string }[]
  hosts: { id: string; full_name: string }[]
}>()

const toast = useToast()

interface CreatedResult {
  access_code: string
  qr_code_data: string
  visitor_name: string
  recurrence_count: number
  email_sent: boolean | null
}

const created = ref<CreatedResult | null>(null)
const loading = ref(false)
const submitError = ref<string | null>(null)

const customFields = ref<VisitorCustomField[]>([])
const customFieldValues = reactive<Record<string, string | number>>({})

watch(() => props.companyId, async (id) => {
  if (!id) return
  const data = await $fetch<VisitorCustomField[]>(`/api/visitor-fields?company_id=${id}`).catch(() => [])
  customFields.value = data
}, { immediate: true })

function localDateStr(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

const state = reactive({
  visitor_name: '',
  visitor_phone: '',
  visitor_email: '',
  visitor_company: '',
  site_id: '',
  host_id: props.hostId,
  visit_date: localDateStr(),
  visit_time: '',
  purpose: '',
  notes: '',
})

// ── Recurrence ─────────────────────────────────────────────────
const showExtras = ref(false)
const isRecurring = ref(false)
const recurrenceType = ref<'daily' | 'weekly' | 'monthly'>('weekly')
const recurrenceEndDate = ref('')

const recurrenceOptions = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
]

const recurrencePreview = computed(() => {
  if (!isRecurring.value || !recurrenceEndDate.value || !state.visit_date) return null
  const dates = generateOccurrenceDates(state.visit_date, recurrenceType.value, recurrenceEndDate.value)
  return dates.length
})

function generateOccurrenceDates(start: string, type: 'daily' | 'weekly' | 'monthly', end: string): string[] {
  const dates: string[] = []
  const endDate = new Date(end)
  const current = new Date(start)
  while (current <= endDate && dates.length < 52) {
    dates.push(current.toISOString().split('T')[0])
    if (type === 'daily') current.setDate(current.getDate() + 1)
    else if (type === 'weekly') current.setDate(current.getDate() + 7)
    else current.setMonth(current.getMonth() + 1)
  }
  return dates
}

const siteOptions = computed(() => [
  { label: 'Select a site…', value: '' },
  ...props.sites.map(s => ({ label: s.name, value: s.id })),
])

const hostOptions = computed(() => [
  { label: 'Select a host…', value: '' },
  ...props.hosts.map(h => ({ label: h.full_name, value: h.id })),
])

// ── Submit ──────────────────────────────────────────────────────
async function onSubmit() {
  submitError.value = null

  // Client-side validation — fast feedback before hitting the server
  if (!state.visitor_name.trim()) { submitError.value = 'Visitor name is required'; return }
  if (!state.visitor_phone.trim()) { submitError.value = 'Phone number is required'; return }
  if (!state.site_id) { submitError.value = 'Please select a site'; return }
  if (!state.host_id) { submitError.value = 'Please select a host'; return }
  if (!state.visit_date) { submitError.value = 'Visit date is required'; return }
  if (isRecurring.value && !recurrenceEndDate.value) {
    submitError.value = 'Please set an end date for the repeating visit'
    return
  }

  loading.value = true
  try {
    const result = await $fetch<CreatedResult>('/api/invitations', {
      method: 'POST',
      body: {
        visitor_name: state.visitor_name,
        visitor_phone: state.visitor_phone,
        visitor_email: state.visitor_email || null,
        visitor_company: state.visitor_company || null,
        site_id: state.site_id,
        host_id: state.host_id,
        visit_date: state.visit_date,
        visit_time: state.visit_time || null,
        purpose: state.purpose || null,
        notes: state.notes || null,
        custom_field_values: Object.keys(customFieldValues).length > 0 ? { ...customFieldValues } : null,
        is_recurring: isRecurring.value,
        recurrence_type: isRecurring.value ? recurrenceType.value : null,
        recurrence_end_date: isRecurring.value ? recurrenceEndDate.value : null,
      },
    })

    const label = result.recurrence_count > 1
      ? `${result.recurrence_count} recurring visits created`
      : 'Invitation created'

    toast.add({ title: label, color: 'green' })
    created.value = result

    if (result.email_sent === false) {
      toast.add({
        title: 'Email could not be sent',
        description: 'Invitation created — share the access code manually.',
        color: 'yellow',
        timeout: 0,
      })
    }
  } catch (e: any) {
    const msg = e?.data?.statusMessage ?? e?.message ?? 'Something went wrong. Please try again.'
    submitError.value = msg
    toast.add({ title: 'Could not create invitation', description: msg, color: 'red' })
  } finally {
    loading.value = false
  }
}

function copyCode() {
  if (!created.value) return
  navigator.clipboard.writeText(created.value.access_code)
  toast.add({ title: 'Access code copied!', timeout: 2000 })
}

function createAnother() {
  created.value = null
  submitError.value = null
  isRecurring.value = false
  recurrenceEndDate.value = ''
  showExtras.value = false
  Object.assign(state, {
    visitor_name: '', visitor_phone: '', visitor_email: '', visitor_company: '',
    site_id: '', host_id: props.hostId, purpose: '',
    visit_date: localDateStr(), visit_time: '', notes: '',
  })
  Object.keys(customFieldValues).forEach(k => delete customFieldValues[k])
}
</script>

<template>
  <!-- ── Success state ─────────────────────────────────────────── -->
  <div v-if="created" class="space-y-4 max-w-2xl">
    <UAlert
      icon="i-lucide-check-circle-2"
      color="green"
      variant="soft"
      :title="`Invitation created for ${created.visitor_name}`"
      :description="created.recurrence_count > 1
        ? `${created.recurrence_count} recurring visits scheduled. QR code and access code below are for the first visit.`
        : 'Share the QR code or access code with your visitor so they can check in.'"
    />

    <UAlert
      v-if="created.email_sent === false"
      icon="i-lucide-mail-x"
      color="yellow"
      variant="soft"
      title="Email delivery failed"
      description="The visitor did not receive their access code by email. Share the code below with them directly."
    />

    <div class="grid md:grid-cols-2 gap-4">
      <UCard>
        <template #header>
          <h3 class="font-semibold text-gray-900">QR Code</h3>
        </template>
        <div class="flex flex-col items-center gap-3">
          <SharedQRCodeDisplay :data="created.qr_code_data" :size="180" />
          <p class="text-xs text-gray-400 text-center">Visitor scans this to check in</p>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h3 class="font-semibold text-gray-900">Access Code</h3>
        </template>
        <div class="flex flex-col items-center justify-center gap-4 h-full py-6">
          <div class="text-4xl font-mono font-bold tracking-widest text-gray-900 bg-gray-100 rounded-xl px-8 py-4">
            {{ created.access_code }}
          </div>
          <button
            class="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            @click="copyCode"
          >
            <UIcon name="i-lucide-copy" class="h-4 w-4" />
            Copy code
          </button>
          <p class="text-xs text-gray-400 text-center">Visitor enters this at reception if they can't scan</p>
        </div>
      </UCard>
    </div>

    <div class="flex gap-3">
      <UButton variant="outline" to="/dashboard/invitations">View all invitations</UButton>
      <UButton icon="i-lucide-plus" @click="createAnother">Create another</UButton>
    </div>
  </div>

  <!-- ── Form ──────────────────────────────────────────────────── -->
  <UCard v-else class="max-w-2xl">
    <template #header>
      <div>
        <h2 class="font-bold text-gray-900">Pre-register a visitor</h2>
        <p class="text-sm text-gray-500 mt-0.5">Fill in the visitor's details and they'll receive their access code.</p>
      </div>
    </template>

    <div class="space-y-5">
      <!-- Required fields -->
      <div>
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Visitor</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormGroup label="Full name" required>
            <UInput
              v-model="state.visitor_name"
              placeholder="Jane Smith"
              :ui="{ base: submitError && !state.visitor_name.trim() ? 'ring-2 ring-red-500' : '' }"
            />
          </UFormGroup>
          <UFormGroup label="Phone number" required>
            <UInput
              v-model="state.visitor_phone"
              type="tel"
              placeholder="+263 71 234 5678"
              :ui="{ base: submitError && !state.visitor_phone.trim() ? 'ring-2 ring-red-500' : '' }"
            />
          </UFormGroup>
        </div>
      </div>

      <div>
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Visit</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormGroup label="Site" required>
            <USelect
              v-model="state.site_id"
              :options="siteOptions"
              :ui="{ base: submitError && !state.site_id ? 'ring-2 ring-red-500' : '' }"
            />
          </UFormGroup>
          <UFormGroup label="Host" required>
            <USelect
              v-model="state.host_id"
              :options="hostOptions"
              :ui="{ base: submitError && !state.host_id ? 'ring-2 ring-red-500' : '' }"
            />
          </UFormGroup>
          <UFormGroup label="Visit date" required>
            <UInput v-model="state.visit_date" type="date" />
          </UFormGroup>
          <UFormGroup label="Visit time">
            <UInput v-model="state.visit_time" type="time" />
          </UFormGroup>
        </div>
      </div>

      <!-- Optional extras (collapsed by default) -->
      <div class="border-t pt-4">
        <button
          type="button"
          class="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-3"
          @click="showExtras = !showExtras"
        >
          <UIcon :name="showExtras ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'" class="h-4 w-4" />
          {{ showExtras ? 'Hide' : 'Add' }} optional details (email, company, purpose, notes)
        </button>

        <div v-if="showExtras" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormGroup label="Email">
            <UInput v-model="state.visitor_email" type="email" placeholder="jane@acme.com" />
          </UFormGroup>
          <UFormGroup label="Company">
            <UInput v-model="state.visitor_company" placeholder="Acme Corp" />
          </UFormGroup>
          <UFormGroup label="Purpose of visit" class="sm:col-span-2">
            <UInput v-model="state.purpose" placeholder="Business meeting, interview, delivery…" />
          </UFormGroup>
          <UFormGroup label="Notes" class="sm:col-span-2">
            <UTextarea v-model="state.notes" placeholder="Any additional notes…" :rows="2" />
          </UFormGroup>
        </div>
      </div>

      <!-- Recurrence (collapsed by default) -->
      <div class="border-t pt-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-700">Repeating visit</p>
            <p class="text-xs text-gray-400">Schedule this to repeat automatically</p>
          </div>
          <UToggle v-model="isRecurring" />
        </div>

        <div v-if="isRecurring" class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <UFormGroup label="Repeat every">
            <USelect v-model="recurrenceType" :options="recurrenceOptions" />
          </UFormGroup>
          <UFormGroup label="Until (end date)" required>
            <UInput v-model="recurrenceEndDate" type="date" :min="state.visit_date" />
          </UFormGroup>
          <div v-if="recurrencePreview !== null" class="sm:col-span-2">
            <UAlert
              color="indigo"
              variant="soft"
              icon="i-lucide-calendar-range"
              :description="`${recurrencePreview} visit${recurrencePreview !== 1 ? 's' : ''} will be created (max 52).`"
            />
          </div>
        </div>
      </div>

      <!-- Custom fields -->
      <div v-if="customFields.length > 0" class="border-t pt-4">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Additional information</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormGroup
            v-for="field in customFields"
            :key="field.id"
            :label="field.label"
            :required="field.required"
            :class="field.field_type === 'textarea' ? 'sm:col-span-2' : ''"
          >
            <USelect
              v-if="field.field_type === 'select'"
              v-model="customFieldValues[field.field_key]"
              :options="[{ label: 'Select…', value: '' }, ...(field.options ?? []).map(o => ({ label: o, value: o }))]"
            />
            <UTextarea
              v-else-if="field.field_type === 'textarea'"
              v-model="customFieldValues[field.field_key]"
              :rows="3"
            />
            <UInput
              v-else
              v-model="customFieldValues[field.field_key]"
              :type="field.field_type === 'number' ? 'number' : 'text'"
            />
          </UFormGroup>
        </div>
      </div>

      <!-- Error display -->
      <UAlert
        v-if="submitError"
        color="red"
        variant="soft"
        icon="i-lucide-alert-circle"
        :description="submitError"
      />

      <!-- Actions -->
      <div class="flex gap-3 pt-1">
        <UButton variant="outline" @click="navigateTo('/dashboard/invitations')">Cancel</UButton>
        <UButton :loading="loading" :disabled="loading" icon="i-lucide-send" @click="onSubmit">
          <span v-if="loading">Creating invitation…</span>
          <span v-else-if="isRecurring && recurrencePreview && recurrencePreview > 1">
            Create {{ recurrencePreview }} visits
          </span>
          <span v-else>Create Invitation</span>
        </UButton>
      </div>
    </div>
  </UCard>
</template>
