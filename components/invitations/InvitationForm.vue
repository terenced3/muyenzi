<script setup lang="ts">
import { z } from 'zod'

const props = defineProps<{
  companyId: string
  hostId: string
  sites: { id: string; name: string }[]
  hosts: { id: string; full_name: string }[]
}>()

const supabase = useSupabaseClient()
const toast = useToast()

interface CreatedVisit {
  access_code: string
  qr_code_data: string
  visitor_name: string
}

const created = ref<CreatedVisit | null>(null)
const loading = ref(false)

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

const schema = z.object({
  visitor_name: z.string().min(2, 'Visitor name is required'),
  visitor_company: z.string().optional(),
  visitor_email: z.string().email('Valid email required').optional().or(z.literal('')),
  visitor_phone: z.string().optional(),
  site_id: z.string().min(1, 'Please select a site'),
  host_id: z.string().min(1, 'Please select a host'),
  purpose: z.string().optional(),
  visit_date: z.string().min(1, 'Visit date is required'),
  visit_time: z.string().optional(),
  notes: z.string().optional(),
})

const siteOptions = computed(() => [
  { label: 'Select a site…', value: '' },
  ...props.sites.map(s => ({ label: s.name, value: s.id })),
])

const hostOptions = computed(() => [
  { label: 'Select a host…', value: '' },
  ...props.hosts.map(h => ({ label: h.full_name, value: h.id })),
])

async function onSubmit() {
  loading.value = true

  const { data: visitor, error: visitorError } = await supabase
    .from('visitors')
    .upsert({
      company_id: props.companyId,
      full_name: state.visitor_name,
      email: state.visitor_email || null,
      phone: state.visitor_phone || null,
      company_name: state.visitor_company || null,
    }, { onConflict: 'company_id,email', ignoreDuplicates: false })
    .select()
    .single()

  let visitorId = visitor?.id

  if (visitorError || !visitorId) {
    const { data: newVisitor, error } = await supabase
      .from('visitors')
      .insert({
        company_id: props.companyId,
        full_name: state.visitor_name,
        email: state.visitor_email || null,
        phone: state.visitor_phone || null,
        company_name: state.visitor_company || null,
      })
      .select()
      .single()

    if (error || !newVisitor) {
      toast.add({ title: 'Error', description: 'Failed to create visitor', color: 'red' })
      loading.value = false
      return
    }
    visitorId = newVisitor.id
  }

  const accessCode = generateAccessCode()
  const qrCodeData = JSON.stringify({ visitorId, siteId: state.site_id, accessCode, companyId: props.companyId })

  const { data: visit, error } = await supabase
    .from('visits')
    .insert({
      company_id: props.companyId,
      site_id: state.site_id,
      visitor_id: visitorId,
      host_id: state.host_id,
      purpose: state.purpose || null,
      visit_date: state.visit_date,
      visit_time: state.visit_time || null,
      notes: state.notes || null,
      access_code: accessCode,
      qr_code_data: qrCodeData,
      status: 'expected',
    })
    .select()
    .single()

  if (error || !visit) {
    toast.add({ title: 'Error', description: error?.message ?? 'Failed to create visit', color: 'red' })
    loading.value = false
    return
  }

  await supabase.from('invitations').insert({ visit_id: visit.id })

  toast.add({ title: 'Invitation created', color: 'green' })
  created.value = { access_code: accessCode, qr_code_data: qrCodeData, visitor_name: state.visitor_name }
  loading.value = false
}

function copyCode() {
  if (!created.value) return
  navigator.clipboard.writeText(created.value.access_code)
  toast.add({ title: 'Copied!', timeout: 1500 })
}

function createAnother() {
  created.value = null
  Object.assign(state, {
    visitor_name: '', visitor_company: '', visitor_email: '', visitor_phone: '',
    site_id: '', host_id: props.hostId, purpose: '',
    visit_date: new Date().toISOString().split('T')[0], visit_time: '', notes: '',
  })
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
      description="Share the QR code or access code with your visitor."
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

    <UForm :schema="schema" :state="state" class="space-y-6" @submit="onSubmit">
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
          <UFormGroup label="Email" name="visitor_email">
            <UInput v-model="state.visitor_email" type="email" placeholder="jane@acme.com" />
          </UFormGroup>
          <UFormGroup label="Phone" name="visitor_phone">
            <UInput v-model="state.visitor_phone" placeholder="+1 234 567 8900" />
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

      <div class="flex gap-3 pt-2">
        <UButton variant="outline" @click="navigateTo('/dashboard/invitations')">Cancel</UButton>
        <UButton type="submit" :loading="loading">Create Invitation</UButton>
      </div>
    </UForm>
  </UCard>
</template>
