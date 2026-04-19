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

// ── Company ───────────────────────────────────────────────────

const companyState = reactive({ name: '' })
const savingCompany = ref(false)
const companySchema = z.object({ name: z.string().min(2, 'Company name must be at least 2 characters') })

watch(user, (u) => {
  if (u) companyState.name = u.company?.name ?? ''
}, { immediate: true })

async function saveCompany() {
  if (!user.value) return
  savingCompany.value = true
  await supabase.from('companies').update({ name: companyState.name }).eq('id', user.value.company_id)
  savingCompany.value = false
  toast.add({ title: 'Company name updated', color: 'green' })
  await fetchProfile()
}

// ── My Profile ────────────────────────────────────────────────

const profileState = reactive({ full_name: '' })
const savingProfile = ref(false)
const profileSchema = z.object({ full_name: z.string().min(2, 'Name must be at least 2 characters') })

watch(user, (u) => {
  if (u) profileState.full_name = u.full_name
}, { immediate: true })

async function saveProfile() {
  if (!user.value) return
  savingProfile.value = true
  await supabase.from('users').update({ full_name: profileState.full_name }).eq('id', user.value.id)
  savingProfile.value = false
  toast.add({ title: 'Profile updated', color: 'green' })
  await fetchProfile()
}

// ── Password change ───────────────────────────────────────────

const pwState = reactive({ password: '', confirm: '' })
const savingPw = ref(false)
const pwError = ref('')

const pwSchema = z.object({
  password: z.string().min(8, 'Minimum 8 characters'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] })

async function changePassword() {
  pwError.value = ''
  const parsed = pwSchema.safeParse(pwState)
  if (!parsed.success) {
    pwError.value = parsed.error.issues[0]?.message ?? 'Invalid'
    return
  }
  savingPw.value = true
  const { error } = await supabase.auth.updateUser({ password: pwState.password })
  savingPw.value = false
  if (error) { pwError.value = error.message; return }
  toast.add({ title: 'Password changed', color: 'green' })
  pwState.password = ''
  pwState.confirm = ''
}

// ── Timezone ──────────────────────────────────────────────────

const TIMEZONES = [
  { label: 'Africa/Harare (UTC+2)', value: 'Africa/Harare' },
  { label: 'Africa/Johannesburg (UTC+2)', value: 'Africa/Johannesburg' },
  { label: 'Africa/Nairobi (UTC+3)', value: 'Africa/Nairobi' },
  { label: 'Africa/Lagos (UTC+1)', value: 'Africa/Lagos' },
  { label: 'Africa/Cairo (UTC+2)', value: 'Africa/Cairo' },
  { label: 'Africa/Accra (UTC+0)', value: 'Africa/Accra' },
  { label: 'UTC', value: 'UTC' },
  { label: 'Europe/London (UTC+0/+1)', value: 'Europe/London' },
  { label: 'Europe/Paris (UTC+1/+2)', value: 'Europe/Paris' },
  { label: 'America/New_York (UTC-5/-4)', value: 'America/New_York' },
  { label: 'America/Chicago (UTC-6/-5)', value: 'America/Chicago' },
  { label: 'America/Los_Angeles (UTC-8/-7)', value: 'America/Los_Angeles' },
  { label: 'Asia/Dubai (UTC+4)', value: 'Asia/Dubai' },
  { label: 'Asia/Kolkata (UTC+5:30)', value: 'Asia/Kolkata' },
  { label: 'Asia/Singapore (UTC+8)', value: 'Asia/Singapore' },
  { label: 'Australia/Sydney (UTC+10/+11)', value: 'Australia/Sydney' },
]

const timezone = ref('Africa/Harare')
const savingTz = ref(false)

watch(user, (u) => {
  if (u) timezone.value = (u.company as any)?.timezone ?? 'Africa/Harare'
}, { immediate: true })

async function saveTimezone() {
  if (!user.value) return
  savingTz.value = true
  await supabase.from('companies').update({ timezone: timezone.value }).eq('id', user.value.company_id)
  savingTz.value = false
  toast.add({ title: 'Timezone updated', color: 'green' })
  await fetchProfile()
}

// ── Notification preferences ──────────────────────────────────

interface NotifPrefs {
  visitor_arrived_inapp: boolean
  visitor_arrived_email: boolean
  pre_arrival_email: boolean
  daily_summary_email: boolean
}

const notifPrefs = reactive<NotifPrefs>({
  visitor_arrived_inapp: true,
  visitor_arrived_email: true,
  pre_arrival_email: false,
  daily_summary_email: false,
})
const savingNotif = ref(false)

watch(user, (u) => {
  if (u) {
    const prefs = (u as any).notification_prefs as Partial<NotifPrefs> | null
    if (prefs) Object.assign(notifPrefs, prefs)
  }
}, { immediate: true })

async function saveNotifPrefs() {
  if (!user.value) return
  savingNotif.value = true
  await supabase.from('users').update({ notification_prefs: { ...notifPrefs } }).eq('id', user.value.id)
  savingNotif.value = false
  toast.add({ title: 'Notification preferences saved', color: 'green' })
}

// ── Visitor Custom Fields ─────────────────────────────────────

const customFields = ref<VisitorCustomField[]>([])
const loadingFields = ref(false)
const showAddField = ref(false)
const savingField = ref(false)
const deletingFieldId = ref<string | null>(null)
const editingField = ref<VisitorCustomField | null>(null)
const reorderingField = ref<string | null>(null)

const fieldTypeOptions = [
  { label: 'Text', value: 'text' },
  { label: 'Number', value: 'number' },
  { label: 'Long text', value: 'textarea' },
  { label: 'Dropdown', value: 'select' },
]

const FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
  text: 'Text',
  number: 'Number',
  textarea: 'Long text',
  select: 'Dropdown',
}

const newField = reactive({
  label: '',
  field_type: 'text' as CustomFieldType,
  required: false,
  options_raw: '',
})

const editFieldState = reactive({
  label: '',
  field_type: 'text' as CustomFieldType,
  required: false,
  options_raw: '',
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
    toast.add({ title: 'Error', description: e.data?.statusMessage ?? 'Failed', color: 'red' })
    return null
  })
  savingField.value = false
  if (!res) return
  toast.add({ title: 'Custom field added', color: 'green' })
  Object.assign(newField, { label: '', field_type: 'text', required: false, options_raw: '' })
  showAddField.value = false
  await loadCustomFields()
}

function openEditField(field: VisitorCustomField) {
  editingField.value = field
  editFieldState.label = field.label
  editFieldState.field_type = field.field_type
  editFieldState.required = field.required
  editFieldState.options_raw = field.options?.join(', ') ?? ''
}

async function saveEditField() {
  if (!editingField.value) return
  savingField.value = true
  const options = editFieldState.field_type === 'select'
    ? editFieldState.options_raw.split(',').map(o => o.trim()).filter(Boolean)
    : null
  await $fetch(`/api/visitor-fields/${editingField.value.id}`, {
    method: 'PUT',
    body: {
      label: editFieldState.label.trim(),
      field_type: editFieldState.field_type,
      required: editFieldState.required,
      options,
    },
  }).catch((e) => {
    toast.add({ title: 'Error', description: e.data?.statusMessage ?? 'Failed', color: 'red' })
  })
  savingField.value = false
  editingField.value = null
  toast.add({ title: 'Field updated', color: 'green' })
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

// ── Drag-to-reorder ───────────────────────────────────────────

const dragFromIndex = ref<number | null>(null)

function onDragStart(index: number) {
  dragFromIndex.value = index
}

function onDragOver(e: DragEvent, index: number) {
  e.preventDefault()
  if (dragFromIndex.value === null || dragFromIndex.value === index) return
  const moved = customFields.value.splice(dragFromIndex.value, 1)[0]
  customFields.value.splice(index, 0, moved)
  dragFromIndex.value = index
}

async function onDragEnd() {
  dragFromIndex.value = null
  // Persist new sort_order for all fields
  await Promise.all(customFields.value.map((f, i) =>
    $fetch(`/api/visitor-fields/${f.id}`, { method: 'PUT', body: { sort_order: i } }),
  ))
}

// ── Data Retention ────────────────────────────────────────────

const RETENTION_OPTIONS = [
  { label: 'Never delete (keep forever)', value: 0 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
  { label: '180 days (6 months)', value: 180 },
  { label: '365 days (1 year)', value: 365 },
  { label: '730 days (2 years)', value: 730 },
]

const retentionDays = ref(0)
const savingRetention = ref(false)
const runningCleanup = ref(false)
const lastCleanupResult = ref<{ visits_deleted: number; visitors_deleted: number } | null>(null)

watch(user, (u) => {
  if (u) retentionDays.value = (u.company as any)?.data_retention_days ?? 0
}, { immediate: true })

async function saveRetention() {
  if (!user.value) return
  savingRetention.value = true
  await supabase.from('companies').update({ data_retention_days: retentionDays.value }).eq('id', user.value.company_id)
  savingRetention.value = false
  toast.add({ title: 'Retention policy saved', color: 'green' })
  await fetchProfile()
}

async function runCleanup() {
  runningCleanup.value = true
  try {
    const result = await $fetch<{ visits_deleted: number; visitors_deleted: number }>('/api/admin/retention-cleanup', { method: 'POST' })
    lastCleanupResult.value = result
    toast.add({
      title: 'Cleanup complete',
      description: `Removed ${result.visits_deleted} visits and ${result.visitors_deleted} visitors.`,
      color: 'green',
    })
  } catch (e: any) {
    toast.add({ title: 'Cleanup failed', description: e?.data?.statusMessage ?? 'Error', color: 'red' })
  } finally { runningCleanup.value = false }
}

// ── Privacy Notice ────────────────────────────────────────────

const privacyEnabled = ref(false)
const privacyText = ref('')
const savingPrivacy = ref(false)

watch(user, (u) => {
  if (u) {
    privacyEnabled.value = (u.company as any)?.privacy_notice_enabled ?? false
    privacyText.value = (u.company as any)?.privacy_notice_text ?? ''
  }
}, { immediate: true })

async function savePrivacy() {
  if (!user.value) return
  savingPrivacy.value = true
  await supabase.from('companies').update({
    privacy_notice_enabled: privacyEnabled.value,
    privacy_notice_text: privacyText.value.trim() || null,
  }).eq('id', user.value.company_id)
  savingPrivacy.value = false
  toast.add({ title: 'Privacy notice saved', color: 'green' })
  await fetchProfile()
}

// ── Document Templates ────────────────────────────────────────

interface DocTemplate { id: string; name: string; content: string; is_active: boolean; created_at: string }
const docTemplates = ref<DocTemplate[]>([])
const loadingTemplates = ref(false)
const showAddTemplate = ref(false)
const savingTemplate = ref(false)
const deletingTemplateId = ref<string | null>(null)
const togglingTemplateId = ref<string | null>(null)
const editingTemplate = ref<DocTemplate | null>(null)
const newTemplate = reactive({ name: '', content: '' })

async function loadDocTemplates() {
  if (!user.value) return
  loadingTemplates.value = true
  const data = await $fetch<DocTemplate[]>('/api/documents/templates', {
    query: { company_id: user.value.company_id },
  }).catch(() => [])
  docTemplates.value = data
  loadingTemplates.value = false
}

watch(user, (u) => { if (u) loadDocTemplates() }, { immediate: true })

async function addTemplate() {
  if (!newTemplate.name.trim() || !newTemplate.content.trim()) return
  savingTemplate.value = true
  await $fetch('/api/documents/templates', {
    method: 'POST',
    body: { name: newTemplate.name.trim(), content: newTemplate.content.trim() },
  }).catch((e) => {
    toast.add({ title: 'Error', description: e.data?.statusMessage ?? 'Failed', color: 'red' })
  })
  savingTemplate.value = false
  Object.assign(newTemplate, { name: '', content: '' })
  showAddTemplate.value = false
  await loadDocTemplates()
  toast.add({ title: 'Document template saved', color: 'green' })
}

async function saveEditTemplate() {
  if (!editingTemplate.value) return
  savingTemplate.value = true
  await $fetch(`/api/documents/templates/${editingTemplate.value.id}`, {
    method: 'PATCH',
    body: { name: editingTemplate.value.name, content: editingTemplate.value.content },
  }).catch((e) => {
    toast.add({ title: 'Error', description: e.data?.statusMessage ?? 'Failed', color: 'red' })
  })
  savingTemplate.value = false
  editingTemplate.value = null
  await loadDocTemplates()
  toast.add({ title: 'Template updated', color: 'green' })
}

async function toggleTemplate(t: DocTemplate) {
  togglingTemplateId.value = t.id
  await $fetch(`/api/documents/templates/${t.id}`, { method: 'PATCH', body: { is_active: !t.is_active } }).catch(() => {})
  togglingTemplateId.value = null
  await loadDocTemplates()
}

async function deleteTemplate(id: string) {
  deletingTemplateId.value = id
  await $fetch(`/api/documents/templates/${id}`, { method: 'DELETE' }).catch(() => {
    toast.add({ title: 'Error', description: 'Failed to delete template', color: 'red' })
  })
  deletingTemplateId.value = null
  await loadDocTemplates()
}
</script>

<template>
  <div class="flex flex-col h-full">
    <LayoutTopbar title="Settings" />

    <div class="flex-1 overflow-y-auto p-6 max-w-2xl space-y-6">

      <!-- ── Company Settings ── -->
      <UCard>
        <template #header><h2 class="font-semibold text-gray-900">Company Settings</h2></template>
        <UForm :schema="companySchema" :state="companyState" class="space-y-4" @submit="saveCompany">
          <UFormGroup label="Company name" name="name">
            <UInput v-model="companyState.name" />
          </UFormGroup>
          <UButton type="submit" :loading="savingCompany">Save</UButton>
        </UForm>
      </UCard>

      <!-- ── Company Logo ── -->
      <UCard>
        <template #header><h2 class="font-semibold text-gray-900">Company Logo</h2></template>
        <p class="text-sm text-gray-600 mb-4">Displayed on all visitor kiosks.</p>
        <CompanyLogoUpload
          :current-logo-url="user?.company?.logo_url"
          @upload="fetchProfile"
          @delete="fetchProfile"
        />
      </UCard>

      <!-- ── Timezone ── -->
      <UCard>
        <template #header>
          <h2 class="font-semibold text-gray-900">Timezone</h2>
          <p class="text-xs text-gray-400 mt-0.5">Used to display visit dates and times across your dashboard.</p>
        </template>
        <div class="flex items-end gap-3">
          <UFormGroup label="Company timezone" class="flex-1">
            <USelect v-model="timezone" :options="TIMEZONES" />
          </UFormGroup>
          <UButton :loading="savingTz" @click="saveTimezone">Save</UButton>
        </div>
      </UCard>

      <!-- ── My Profile ── -->
      <UCard>
        <template #header><h2 class="font-semibold text-gray-900">My Profile</h2></template>
        <div class="space-y-5">
          <UserAvatarUpload
            :current-avatar-url="user?.avatar_url"
            :name="user?.full_name"
            @upload="fetchProfile"
            @delete="fetchProfile"
          />
          <UForm :schema="profileSchema" :state="profileState" class="space-y-4" @submit="saveProfile">
            <UFormGroup label="Full name" name="full_name">
              <UInput v-model="profileState.full_name" />
            </UFormGroup>
            <UFormGroup label="Email">
              <UInput :model-value="user?.email ?? ''" disabled />
              <template #hint><span class="text-xs text-gray-400">Email cannot be changed here</span></template>
            </UFormGroup>
            <UButton type="submit" :loading="savingProfile">Save</UButton>
          </UForm>
        </div>
      </UCard>

      <!-- ── Change Password ── -->
      <UCard>
        <template #header>
          <h2 class="font-semibold text-gray-900">Change Password</h2>
          <p class="text-xs text-gray-400 mt-0.5">You'll remain logged in on this device.</p>
        </template>
        <div class="space-y-4">
          <UFormGroup label="New password">
            <UInput v-model="pwState.password" type="password" autocomplete="new-password" placeholder="Min. 8 characters" />
          </UFormGroup>
          <UFormGroup label="Confirm new password">
            <UInput v-model="pwState.confirm" type="password" autocomplete="new-password" placeholder="Repeat password" />
          </UFormGroup>
          <p v-if="pwError" class="text-sm text-red-500">{{ pwError }}</p>
          <UButton
            :loading="savingPw"
            :disabled="!pwState.password || !pwState.confirm"
            @click="changePassword"
          >
            Update password
          </UButton>
        </div>
      </UCard>

      <!-- ── Notification Preferences ── -->
      <UCard>
        <template #header>
          <h2 class="font-semibold text-gray-900">Notification Preferences</h2>
          <p class="text-xs text-gray-400 mt-0.5">Control which events notify you.</p>
        </template>
        <div class="space-y-5">
          <div class="space-y-3">
            <p class="text-xs font-bold uppercase tracking-widest text-gray-400">When a visitor arrives</p>
            <label class="flex items-center justify-between py-2 cursor-pointer">
              <div>
                <p class="text-sm font-medium text-gray-900">In-app notification</p>
                <p class="text-xs text-gray-400">Show in the notification bell in the dashboard</p>
              </div>
              <UToggle v-model="notifPrefs.visitor_arrived_inapp" />
            </label>
            <label class="flex items-center justify-between py-2 cursor-pointer border-t border-gray-100">
              <div>
                <p class="text-sm font-medium text-gray-900">Email notification</p>
                <p class="text-xs text-gray-400">Send an email when a visitor checks in for you</p>
              </div>
              <UToggle v-model="notifPrefs.visitor_arrived_email" />
            </label>
          </div>
          <div class="space-y-3 border-t border-gray-100 pt-4">
            <p class="text-xs font-bold uppercase tracking-widest text-gray-400">Scheduled visits</p>
            <label class="flex items-center justify-between py-2 cursor-pointer">
              <div>
                <p class="text-sm font-medium text-gray-900">Pre-arrival reminder email</p>
                <p class="text-xs text-gray-400">Notify me when an invitation for my visit is created</p>
              </div>
              <UToggle v-model="notifPrefs.pre_arrival_email" />
            </label>
          </div>
          <div class="space-y-3 border-t border-gray-100 pt-4">
            <p class="text-xs font-bold uppercase tracking-widest text-gray-400">Summaries</p>
            <label class="flex items-center justify-between py-2 cursor-pointer">
              <div>
                <p class="text-sm font-medium text-gray-900">Daily summary email</p>
                <p class="text-xs text-gray-400">Morning digest of yesterday's visitor activity</p>
              </div>
              <UToggle v-model="notifPrefs.daily_summary_email" />
            </label>
          </div>
          <UButton :loading="savingNotif" @click="saveNotifPrefs">Save preferences</UButton>
        </div>
      </UCard>

      <!-- ── Visitor Custom Fields ── -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h2 class="font-semibold text-gray-900">Visitor Custom Fields</h2>
              <p class="text-xs text-gray-400 mt-0.5">Drag to reorder · click edit to modify.</p>
            </div>
            <UButton size="sm" icon="i-lucide-plus" @click="showAddField = !showAddField">Add field</UButton>
          </div>
        </template>

        <div class="space-y-4">
          <!-- Add form -->
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
            <UFormGroup v-if="newField.field_type === 'select'" label="Options" hint="Comma-separated">
              <UInput v-model="newField.options_raw" placeholder="Option A, Option B, Option C" />
            </UFormGroup>
            <div class="flex items-center gap-2">
              <UToggle v-model="newField.required" />
              <span class="text-sm text-gray-600">Required field</span>
            </div>
            <div class="flex gap-2">
              <UButton size="sm" :loading="savingField" :disabled="!newField.label.trim()" @click="addField">Save field</UButton>
              <UButton size="sm" variant="ghost" @click="showAddField = false">Cancel</UButton>
            </div>
          </div>

          <!-- Edit modal -->
          <UModal :model-value="!!editingField" @update:model-value="editingField = null">
            <UCard v-if="editingField">
              <template #header>
                <div class="flex items-center justify-between">
                  <h2 class="font-bold text-gray-900">Edit field</h2>
                  <UButton variant="ghost" color="gray" icon="i-lucide-x" size="sm" @click="editingField = null" />
                </div>
              </template>
              <div class="space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <UFormGroup label="Label" required>
                    <UInput v-model="editFieldState.label" />
                  </UFormGroup>
                  <UFormGroup label="Type">
                    <USelect v-model="editFieldState.field_type" :options="fieldTypeOptions" />
                  </UFormGroup>
                </div>
                <UFormGroup v-if="editFieldState.field_type === 'select'" label="Options" hint="Comma-separated">
                  <UInput v-model="editFieldState.options_raw" placeholder="Option A, Option B" />
                </UFormGroup>
                <div class="flex items-center gap-2">
                  <UToggle v-model="editFieldState.required" />
                  <span class="text-sm text-gray-600">Required field</span>
                </div>
              </div>
              <template #footer>
                <div class="flex justify-end gap-3">
                  <UButton variant="outline" @click="editingField = null">Cancel</UButton>
                  <UButton :loading="savingField" :disabled="!editFieldState.label.trim()" @click="saveEditField">Save changes</UButton>
                </div>
              </template>
            </UCard>
          </UModal>

          <!-- Draggable fields list -->
          <div v-if="loadingFields" class="text-sm text-gray-400 py-2">Loading…</div>
          <div v-else-if="customFields.length === 0 && !showAddField" class="text-sm text-gray-400 py-2">
            No custom fields yet.
          </div>
          <div v-else class="divide-y divide-gray-100">
            <div
              v-for="(field, index) in customFields"
              :key="field.id"
              draggable="true"
              class="flex items-center gap-3 py-3 group cursor-grab active:cursor-grabbing"
              :class="{ 'opacity-40': reorderingField === field.id }"
              @dragstart="onDragStart(index)"
              @dragover="onDragOver($event, index)"
              @dragend="onDragEnd"
            >
              <!-- Drag handle -->
              <UIcon
                name="i-lucide-grip-vertical"
                class="h-4 w-4 text-gray-300 group-hover:text-gray-400 shrink-0"
              />
              <!-- Field info -->
              <div class="flex-1 min-w-0">
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
              <!-- Actions -->
              <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <UButton size="xs" variant="ghost" icon="i-lucide-pencil" @click.stop="openEditField(field)" />
                <UButton
                  size="xs"
                  variant="ghost"
                  color="red"
                  icon="i-lucide-trash-2"
                  :loading="deletingFieldId === field.id"
                  @click.stop="deleteField(field.id)"
                />
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- ── Kiosk Privacy Notice ── -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h2 class="font-semibold text-gray-900">Kiosk Privacy Notice</h2>
              <p class="text-xs text-gray-400 mt-0.5">Show a scrollable privacy notice at the kiosk before check-in.</p>
            </div>
            <UToggle v-model="privacyEnabled" />
          </div>
        </template>
        <div class="space-y-4">
          <UFormGroup label="Notice text" hint="Visitors must scroll to the bottom and agree before they can check in.">
            <UTextarea
              v-model="privacyText"
              :rows="6"
              :disabled="!privacyEnabled"
              placeholder="e.g. By checking in you consent to the collection of your personal data for visitor management purposes. Your information will be stored securely and deleted after [X] days…"
            />
          </UFormGroup>
          <UButton :loading="savingPrivacy" :disabled="privacyEnabled && !privacyText.trim()" @click="savePrivacy">
            Save notice
          </UButton>
        </div>
      </UCard>

      <!-- ── Data Retention ── -->
      <UCard>
        <template #header>
          <h2 class="font-semibold text-gray-900">Data Retention</h2>
          <p class="text-xs text-gray-400 mt-0.5">Automatically delete old visit records to comply with privacy regulations.</p>
        </template>
        <div class="space-y-4">
          <div class="flex items-end gap-3">
            <UFormGroup label="Delete completed visits older than" class="flex-1">
              <USelect v-model="retentionDays" :options="RETENTION_OPTIONS" />
            </UFormGroup>
            <UButton :loading="savingRetention" @click="saveRetention">Save</UButton>
          </div>

          <div class="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 space-y-1">
            <p class="font-semibold">What gets deleted</p>
            <ul class="list-disc pl-4 space-y-0.5 text-xs">
              <li>Visits with status: checked out, cancelled, no-show</li>
              <li>Visitor records with no remaining visits</li>
              <li>Expected (upcoming) visits are never auto-deleted</li>
            </ul>
          </div>

          <div class="flex items-center gap-3">
            <UButton
              variant="outline"
              color="red"
              icon="i-lucide-trash-2"
              :loading="runningCleanup"
              :disabled="retentionDays === 0"
              @click="runCleanup"
            >
              Run cleanup now
            </UButton>
            <p v-if="lastCleanupResult" class="text-xs text-gray-500">
              Last run: removed {{ lastCleanupResult.visits_deleted }} visits and {{ lastCleanupResult.visitors_deleted }} visitors.
            </p>
          </div>
        </div>
      </UCard>

      <!-- ── Document Templates ── -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h2 class="font-semibold text-gray-900">Document Templates</h2>
              <p class="text-xs text-gray-400 mt-0.5">NDAs and policies visitors must sign before or during check-in.</p>
            </div>
            <UButton size="sm" icon="i-lucide-plus" @click="showAddTemplate = !showAddTemplate">Add document</UButton>
          </div>
        </template>

        <div class="space-y-4">
          <div v-if="showAddTemplate" class="border border-dashed border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
            <h3 class="text-sm font-medium text-gray-700">New document</h3>
            <UFormGroup label="Document name" required>
              <UInput v-model="newTemplate.name" placeholder="e.g. Non-Disclosure Agreement" />
            </UFormGroup>
            <UFormGroup label="Document content" required hint="Plain text displayed to visitors for reading before signing.">
              <UTextarea v-model="newTemplate.content" :rows="8" placeholder="Paste the full document text here…" />
            </UFormGroup>
            <div class="flex gap-2">
              <UButton size="sm" :loading="savingTemplate" :disabled="!newTemplate.name.trim() || !newTemplate.content.trim()" @click="addTemplate">Save document</UButton>
              <UButton size="sm" variant="ghost" @click="showAddTemplate = false">Cancel</UButton>
            </div>
          </div>

          <UModal :model-value="!!editingTemplate" @update:model-value="editingTemplate = null">
            <UCard v-if="editingTemplate">
              <template #header>
                <div class="flex items-center justify-between">
                  <h2 class="font-bold text-gray-900">Edit document</h2>
                  <UButton variant="ghost" color="gray" icon="i-lucide-x" size="sm" @click="editingTemplate = null" />
                </div>
              </template>
              <div class="space-y-4">
                <UFormGroup label="Document name">
                  <UInput v-model="editingTemplate.name" />
                </UFormGroup>
                <UFormGroup label="Content">
                  <UTextarea v-model="editingTemplate.content" :rows="10" />
                </UFormGroup>
              </div>
              <template #footer>
                <div class="flex justify-end gap-3">
                  <UButton variant="outline" @click="editingTemplate = null">Cancel</UButton>
                  <UButton :loading="savingTemplate" @click="saveEditTemplate">Save changes</UButton>
                </div>
              </template>
            </UCard>
          </UModal>

          <div v-if="loadingTemplates" class="text-sm text-gray-400 py-2">Loading…</div>
          <div v-else-if="docTemplates.length === 0 && !showAddTemplate" class="text-sm text-gray-400 py-2">
            No document templates yet.
          </div>
          <div v-else class="divide-y divide-gray-100">
            <div
              v-for="doc in docTemplates"
              :key="doc.id"
              class="flex items-start justify-between py-3 gap-4"
            >
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <p class="text-sm font-medium text-gray-900 truncate">{{ doc.name }}</p>
                  <UBadge v-if="!doc.is_active" color="gray" variant="soft" size="xs">Inactive</UBadge>
                </div>
                <p class="text-xs text-gray-400 mt-0.5 line-clamp-2">{{ doc.content }}</p>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <UToggle :model-value="doc.is_active" :loading="togglingTemplateId === doc.id" size="xs" @update:model-value="toggleTemplate(doc)" />
                <UButton size="xs" variant="ghost" icon="i-lucide-pencil" @click="editingTemplate = { ...doc }" />
                <UButton size="xs" variant="ghost" color="red" icon="i-lucide-trash-2" :loading="deletingTemplateId === doc.id" @click="deleteTemplate(doc.id)" />
              </div>
            </div>
          </div>
        </div>
      </UCard>

    </div>
  </div>
</template>
