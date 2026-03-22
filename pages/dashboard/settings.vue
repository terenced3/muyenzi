<script setup lang="ts">
import { z } from 'zod'

definePageMeta({ layout: 'dashboard' })
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

async function saveProfile() {
  if (!user.value) return
  savingProfile.value = true
  await supabase.from('users').update({ full_name: profileState.full_name }).eq('id', user.value.id)
  savingProfile.value = false
  toast.add({ title: 'Profile updated', color: 'green' })
  await fetchProfile()
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
    </div>
  </div>
</template>
