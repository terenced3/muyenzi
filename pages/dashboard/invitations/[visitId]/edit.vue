<script setup lang="ts">
import { z } from 'zod'
import type { VisitWithRelations } from '~/types/database'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Edit Invitation – Muyenzi' })

const supabase = useSupabaseClient()
const { user } = useUser()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const visitId = route.params.visitId as string
const visit = ref<VisitWithRelations | null>(null)
const sites = ref<{ id: string; name: string }[]>([])
const hosts = ref<{ id: string; full_name: string }[]>([])
const loading = ref(true)
const saving = ref(false)

const state = reactive({
  visitor_name: '',
  visitor_company: '',
  visitor_email: '',
  visitor_phone: '',
  site_id: '',
  host_id: '',
  purpose: '',
  visit_date: '',
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
  ...sites.value.map(s => ({ label: s.name, value: s.id })),
])

const hostOptions = computed(() => [
  { label: 'Select a host…', value: '' },
  ...hosts.value.map(h => ({ label: h.full_name, value: h.id })),
])

async function fetchData() {
  if (!user.value || !visitId) return
  loading.value = true

  const [{ data: v }, { data: s }, { data: h }] = await Promise.all([
    supabase.from('visits').select('*, visitor:visitors(*), site:sites(*), host:users(*)').eq('id', visitId).single(),
    supabase.from('sites').select('id, name').eq('company_id', user.value.company_id),
    supabase.from('users').select('id, full_name').eq('company_id', user.value.company_id),
  ])

  if (!v || v.company_id !== user.value.company_id || v.status !== 'expected') {
    toast.add({ title: 'Error', description: 'This invitation cannot be edited', color: 'red' })
    await router.push('/dashboard/invitations')
    return
  }

  visit.value = v as VisitWithRelations
  sites.value = s ?? []
  hosts.value = h ?? []

  Object.assign(state, {
    visitor_name: visit.value.visitor.full_name,
    visitor_company: visit.value.visitor.company_name || '',
    visitor_email: visit.value.visitor.email || '',
    visitor_phone: visit.value.visitor.phone || '',
    site_id: visit.value.site_id,
    host_id: visit.value.host_id || '',
    purpose: visit.value.purpose || '',
    visit_date: visit.value.visit_date,
    visit_time: visit.value.visit_time || '',
    notes: visit.value.notes || '',
  })

  loading.value = false
}

async function onSubmit() {
  if (!visit.value || !user.value) return
  saving.value = true

  const { error: visitorError } = await supabase
    .from('visitors')
    .update({
      full_name: state.visitor_name,
      email: state.visitor_email || null,
      phone: state.visitor_phone || null,
      company_name: state.visitor_company || null,
    })
    .eq('id', visit.value.visitor_id)

  if (visitorError) {
    toast.add({ title: 'Error', description: 'Failed to update visitor', color: 'red' })
    saving.value = false
    return
  }

  const { error: visitError } = await supabase
    .from('visits')
    .update({
      site_id: state.site_id,
      host_id: state.host_id || null,
      purpose: state.purpose || null,
      visit_date: state.visit_date,
      visit_time: state.visit_time || null,
      notes: state.notes || null,
    })
    .eq('id', visitId)

  saving.value = false

  if (visitError) {
    toast.add({ title: 'Error', description: 'Failed to update invitation', color: 'red' })
    return
  }

  toast.add({ title: 'Invitation updated', color: 'green' })
  await router.push('/dashboard/invitations')
}

watch(user, (u) => { if (u) fetchData() }, { immediate: true })
</script>

<template>
  <div class="flex flex-col h-full">
    <LayoutTopbar title="Edit Invitation" description="Update visitor and visit details" />

    <div class="flex-1 overflow-y-auto p-6">
      <UButton variant="ghost" size="sm" to="/dashboard/invitations" icon="i-lucide-arrow-left" class="mb-6 -ml-2">
        Back
      </UButton>

      <div v-if="loading" class="text-center py-20 text-gray-400">
        <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin mx-auto mb-2" />
        Loading…
      </div>

      <UCard v-else class="max-w-2xl">
        <template #header>
          <h2 class="font-bold text-gray-900">Edit invitation</h2>
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
            <UButton variant="outline" @click="$router.push('/dashboard/invitations')">Cancel</UButton>
            <UButton type="submit" :loading="saving">Save changes</UButton>
          </div>
        </UForm>
      </UCard>
    </div>
  </div>
</template>
