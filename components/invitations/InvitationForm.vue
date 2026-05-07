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
}

const created = ref<CreatedResult | null>(null)
const loading = ref(false)

const customFields = ref<VisitorCustomField[]>([])
const customFieldValues = reactive<Record<string, string | number>>({})

watch(() => props.companyId, async (id) => {
  if (!id) return
  const data = await $fetch<VisitorCustomField[]>(`/api/visitor-fields?company_id=${id}`).catch(() => [])
  customFields.value = data
}, { immediate: true })

const state = reactive({
  visitor_name: '',
  visitor_company: '',
  visitor_email: '',
  visitor_phone: '',
  site_id: '',
  host_id: props.hostId,
  purpose: '',
  visit_date: new Date().toISOString().split('T')[0],
  visit_time: '',
  notes: '',
})

// ── Recurrence ────────────────────────────────────────────────
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
  // cap at 52 occurrences to prevent abuse
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

// ── Submit ────────────────────────────────────────────────────
async function onSubmit() {
  loading.value = true
  try {
    const result = await $fetch<{
      access_code: string
      qr_code_data: string
      visitor_name: string
      recurrence_count: number
    }>('/api/invitations', {
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
  } catch (e: any) {
    toast.add({
      title: 'Failed to create invitation',
      description: e?.data?.statusMessage ?? e?.message ?? 'Something went wrong',
      color: 'red',
    })
  } finally {
    loading.value = false
  }
}

function copyCode() {
  if (!created.value) return
  navigator.clipboard.writeText(created.value.access_code)
  toast.add({ title: 'Copied!', timeout: 1500 })
}

function createAnother() {
  created.value = null
  isRecurring.value = false
  recurrenceEndDate.value = ''
  Object.assign(state, {
    visitor_name: '', visitor_company: '', visitor_email: '', visitor_phone: '',
    site_id: '', host_id: props.hostId, purpose: '',
    visit_date: new Date().toISOString().split('T')[0], visit_time: '', notes: '',
  })
  Object.keys(customFieldValues).forEach(k => delete customFieldValues[k])
}
</script>

<template>
  <!-- Success state -->
  <div v-if="created" class="space-y-4 max-w-2xl">
    <UAlert
      icon="i-lucide-check-circle-2"
      color="green"
      variant="soft"
      :title="`Invitation created for ${created.visitor_name}`"
      :description="created.recurrence_count > 1
        ? `${created.recurrence_count} recurring visits scheduled. QR and code below are for the first visit.`
        : 'Share the QR code or access code with your visitor.'"
    />

    <div class="grid md:grid-cols-2 gap-4">
      <UCard>
        <template #header><h3 class="font-semibold text-gray-900">QR Code</h3></template>
        <div class="flex flex-col items-center gap-4">
          <SharedQRCodeDisplay :data="created.qr_code_data" :size="200" />
          <p class="text-xs text-gray-400 text-center">Visitor scans this to check in</p>
        </div>
      </UCard>
      <UCard>
        <template #header><h3 class="font-semibold text-gray-900">Access Code</h3></template>
        <div class="flex flex-col items-center justify-center gap-4 h-full py-4">
          <div class="text-4xl font-mono font-bold tracking-wider text-gray-900 bg-gray-100 rounded-xl px-8 py-5">
            {{ created.access_code }}
          </div>
          <button class="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-900 transition-colors" @click="copyCode">
            <UIcon name="i-lucide-copy" class="h-4 w-4" />
            Copy code
          </button>
          <p class="text-xs text-gray-400 text-center">Visitor enters this code at reception</p>
        </div>
      </UCard>
    </div>

    <div class="flex gap-3">
      <UButton variant="outline" to="/dashboard/invitations">View all invitations</UButton>
      <UButton @click="createAnother">Create another</UButton>
    </div>
  </div>

  <!-- Form -->
  <UCard v-else class="max-w-2xl">
    <template #header>
      <h2 class="font-bold text-gray-900">Pre-register a visitor</h2>
    </template>

    <div class="space-y-6">
      <!-- Visitor details -->
      <div>
        <h3 class="font-medium text-gray-700 mb-3 text-sm">Visitor details</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormGroup label="Full name" name="visitor_name" required>
            <UInput v-model="state.visitor_name" placeholder="Jane Smith" />
          </UFormGroup>
          <UFormGroup label="Company" name="visitor_company">
            <UInput v-model="state.visitor_company" placeholder="Acme Corp" />
          </UFormGroup>
          <UFormGroup label="Phone" name="visitor_phone" required>
            <UInput v-model="state.visitor_phone" type="tel" placeholder="+263 71 234 5678" />
          </UFormGroup>
          <UFormGroup label="Email (optional)" name="visitor_email">
            <UInput v-model="state.visitor_email" type="email" placeholder="jane@acme.com" />
          </UFormGroup>
        </div>
      </div>

      <!-- Visit details -->
      <div>
        <h3 class="font-medium text-gray-700 mb-3 text-sm">Visit details</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormGroup label="Site" name="site_id" required>
            <USelect v-model="state.site_id" :options="siteOptions" />
          </UFormGroup>
          <UFormGroup label="Host" name="host_id" required>
            <USelect v-model="state.host_id" :options="hostOptions" />
          </UFormGroup>
          <UFormGroup label="Visit date" name="visit_date" required>
            <UInput v-model="state.visit_date" type="date" />
          </UFormGroup>
          <UFormGroup label="Visit time" name="visit_time">
            <UInput v-model="state.visit_time" type="time" />
          </UFormGroup>
          <UFormGroup label="Purpose of visit" name="purpose" class="sm:col-span-2">
            <UInput v-model="state.purpose" placeholder="Business meeting, interview, delivery…" />
          </UFormGroup>
          <UFormGroup label="Notes" name="notes" class="sm:col-span-2">
            <UTextarea v-model="state.notes" placeholder="Any additional notes…" :rows="3" />
          </UFormGroup>
        </div>
      </div>

      <!-- Recurrence -->
      <div class="border-t pt-5">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h3 class="font-medium text-gray-700 text-sm">Repeating visit</h3>
            <p class="text-xs text-gray-400 mt-0.5">Schedule this visit to repeat automatically</p>
          </div>
          <UToggle v-model="isRecurring" />
        </div>

        <div v-if="isRecurring" class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
          <UFormGroup label="Repeat frequency">
            <USelect v-model="recurrenceType" :options="recurrenceOptions" />
          </UFormGroup>
          <UFormGroup label="Repeat until" required>
            <UInput v-model="recurrenceEndDate" type="date" :min="state.visit_date" />
          </UFormGroup>
          <div v-if="recurrencePreview !== null" class="sm:col-span-2">
            <UAlert
              color="indigo"
              variant="soft"
              icon="i-lucide-calendar-range"
              :description="`${recurrencePreview} visit${recurrencePreview !== 1 ? 's' : ''} will be created (capped at 52).`"
            />
          </div>
        </div>
      </div>

      <!-- Custom fields -->
      <div v-if="customFields.length > 0">
        <h3 class="font-medium text-gray-700 mb-3 text-sm">Additional information</h3>
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

      <div class="flex gap-3 pt-2">
        <UButton variant="outline" @click="navigateTo('/dashboard/invitations')">Cancel</UButton>
        <UButton :loading="loading" @click="onSubmit">
          {{ isRecurring && recurrencePreview && recurrencePreview > 1 ? `Create ${recurrencePreview} visits` : 'Create Invitation' }}
        </UButton>
      </div>
    </div>
  </UCard>
</template>
