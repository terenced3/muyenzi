<script setup lang="ts">
import { z } from 'zod'
import type { VisitorCustomField, CustomFieldType } from '~/types/database'

definePageMeta({
  layout: 'dashboard',
  middleware: [
    function () {
      const { can } = useUser()
      if (!can('manage_settings')) return navigateTo('/dashboard')
    },
  ],
})
useHead({ title: 'Settings – Muyenzi' })

const supabase = useSupabaseClient()
const { user, fetchProfile } = useUser()
const toast = useToast()

const companyState = reactive({ name: '' })
const profileState = reactive({ full_name: '' })
const savingCompany = ref(false)
const savingProfile = ref(false)

const companySchema = z.object({ name: z.string().min(2, 'Company name must be at least 2 characters') })
const profileSchema = z.object({ full_name: z.string().min(2, 'Name must be at least 2 characters') })

watch(user, (u) => {
  if (u) {
    companyState.name = u.company?.name ?? ''
    profileState.full_name = u.full_name
  }
}, { immediate: true })

async function saveCompany() {
  if (!user.value) return
  savingCompany.value = true
  await supabase.from('companies').update({ name: companyState.name }).eq('id', user.value.company_id)
  savingCompany.value = false
  toast.add({ title: 'Company name updated', color: 'green' })
  await fetchProfile()
}

function onLogoUploaded() {
  fetchProfile()
}

function onLogoDeleted() {
  fetchProfile()
}

async function saveProfile() {
  if (!user.value) return
  savingProfile.value = true
  await supabase.from('users').update({ full_name: profileState.full_name }).eq('id', user.value.id)
  savingProfile.value = false
  toast.add({ title: 'Profile updated', color: 'green' })
  await fetchProfile()
}

// ── Visitor Custom Fields ─────────────────────────────────────

const customFields = ref<VisitorCustomField[]>([])
const loadingFields = ref(false)
const showAddField = ref(false)
const savingField = ref(false)
const deletingFieldId = ref<string | null>(null)

const fieldTypeOptions = [
  { label: 'Text', value: 'text' },
  { label: 'Number', value: 'number' },
  { label: 'Long text', value: 'textarea' },
  { label: 'Dropdown', value: 'select' },
]

const newField = reactive({
  label: '',
  field_type: 'text' as CustomFieldType,
  required: false,
  options_raw: '', // comma-separated string for select options
})

async function loadCustomFields() {
  if (!user.value) return
  loadingFields.value = true
  const { data } = await supabase
    .from('visitor_custom_fields')
    .select('*')
    .eq('company_id', user.value.company_id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  customFields.value = (data ?? []) as VisitorCustomField[]
  loadingFields.value = false
}

watch(user, (u) => { if (u) loadCustomFields() }, { immediate: true })

async function addField() {
  if (!user.value || !newField.label.trim()) return
  savingField.value = true

  const options = newField.field_type === 'select'
    ? newField.options_raw.split(',').map(o => o.trim()).filter(Boolean)
    : null

  const res = await $fetch('/api/visitor-fields', {
    method: 'POST',
    body: {
      company_id: user.value.company_id,
      label: newField.label.trim(),
      field_type: newField.field_type,
      options,
      required: newField.required,
      sort_order: customFields.value.length,
    },
  }).catch((e) => {
    toast.add({ title: 'Error', description: e.data?.statusMessage ?? 'Failed to add field', color: 'red' })
    return null
  })

  savingField.value = false
  if (!res) return

  toast.add({ title: 'Custom field added', color: 'green' })
  Object.assign(newField, { label: '', field_type: 'text', required: false, options_raw: '' })
  showAddField.value = false
  await loadCustomFields()
}

async function deleteField(id: string) {
  deletingFieldId.value = id
  await $fetch(`/api/visitor-fields/${id}`, { method: 'DELETE' }).catch(() => {
    toast.add({ title: 'Error', description: 'Failed to delete field', color: 'red' })
  })
  deletingFieldId.value = null
  await loadCustomFields()
}

const FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
  text: 'Text',
  number: 'Number',
  textarea: 'Long text',
  select: 'Dropdown',
}
</script>

<template>
  <div class="flex flex-col h-full">
    <LayoutTopbar title="Settings" />

    <div class="flex-1 overflow-y-auto p-6 max-w-2xl space-y-6">
      <UCard>
        <template #header>
          <h2 class="font-semibold text-gray-900">Company Settings</h2>
        </template>
        <UForm :schema="companySchema" :state="companyState" class="space-y-4" @submit="saveCompany">
          <UFormGroup label="Company name" name="name">
            <UInput v-model="companyState.name" />
          </UFormGroup>
          <UButton type="submit" :loading="savingCompany">Save</UButton>
        </UForm>
      </UCard>

      <!-- Company Logo -->
      <UCard>
        <template #header>
          <h2 class="font-semibold text-gray-900">Company Logo</h2>
        </template>
        <p class="text-sm text-gray-600 mb-4">
          This logo will be displayed on all your visitor kiosks.
        </p>
        <CompanyLogoUpload
          :current-logo-url="user?.company?.logo_url"
          @upload="onLogoUploaded"
          @delete="onLogoDeleted"
        />
      </UCard>

      <UCard>
        <template #header>
          <h2 class="font-semibold text-gray-900">My Profile</h2>
        </template>
        <UForm :schema="profileSchema" :state="profileState" class="space-y-4" @submit="saveProfile">
          <UFormGroup label="Full name" name="full_name">
            <UInput v-model="profileState.full_name" />
          </UFormGroup>
          <UFormGroup label="Email">
            <UInput :model-value="user?.email ?? ''" disabled />
            <template #hint>
              <span class="text-xs text-gray-400">Email cannot be changed here</span>
            </template>
          </UFormGroup>
          <UButton type="submit" :loading="savingProfile">Save</UButton>
        </UForm>
      </UCard>

      <!-- Visitor Custom Fields -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h2 class="font-semibold text-gray-900">Visitor Custom Fields</h2>
              <p class="text-xs text-gray-400 mt-0.5">Collect extra information when registering or checking in visitors.</p>
            </div>
            <UButton size="sm" icon="i-lucide-plus" @click="showAddField = !showAddField">
              Add field
            </UButton>
          </div>
        </template>

        <div class="space-y-4">
          <!-- Add field form -->
          <div v-if="showAddField" class="border border-dashed border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
            <h3 class="text-sm font-medium text-gray-700">New field</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <UFormGroup label="Label" required>
                <UInput v-model="newField.label" placeholder="e.g. Vehicle registration" />
              </UFormGroup>
              <UFormGroup label="Type">
                <USelect v-model="newField.field_type" :options="fieldTypeOptions" />
              </UFormGroup>
            </div>
            <UFormGroup v-if="newField.field_type === 'select'" label="Options" hint="Comma-separated values">
              <UInput v-model="newField.options_raw" placeholder="Option A, Option B, Option C" />
            </UFormGroup>
            <div class="flex items-center gap-2">
              <UToggle v-model="newField.required" />
              <span class="text-sm text-gray-600">Required field</span>
            </div>
            <div class="flex gap-2">
              <UButton size="sm" :loading="savingField" :disabled="!newField.label.trim()" @click="addField">
                Save field
              </UButton>
              <UButton size="sm" variant="ghost" @click="showAddField = false">Cancel</UButton>
            </div>
          </div>

          <!-- Fields list -->
          <div v-if="loadingFields" class="text-sm text-gray-400 py-2">Loading…</div>
          <div v-else-if="customFields.length === 0 && !showAddField" class="text-sm text-gray-400 py-2">
            No custom fields yet. Add one to collect extra information from visitors.
          </div>
          <div v-else class="divide-y divide-gray-100">
            <div
              v-for="field in customFields"
              :key="field.id"
              class="flex items-center justify-between py-3"
            >
              <div>
                <p class="text-sm font-medium text-gray-900">
                  {{ field.label }}
                  <span v-if="field.required" class="text-red-500 ml-0.5">*</span>
                </p>
                <p class="text-xs text-gray-400 mt-0.5">
                  {{ FIELD_TYPE_LABELS[field.field_type] }}
                  <template v-if="field.field_type === 'select' && field.options?.length">
                    · {{ field.options.join(', ') }}
                  </template>
                </p>
              </div>
              <UButton
                size="xs"
                variant="ghost"
                color="red"
                icon="i-lucide-trash-2"
                :loading="deletingFieldId === field.id"
                @click="deleteField(field.id)"
              />
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
