<script setup lang="ts">
import { z } from 'zod'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'New Site – Muyenzi' })

const supabase = useSupabaseClient()
const { user } = useUser()
const toast = useToast()

const state = reactive({ name: '', address: '' })
const loading = ref(false)

const schema = z.object({
  name: z.string().min(2, 'Site name is required'),
  address: z.string().optional(),
})

async function onSubmit() {
  if (!user.value) return
  loading.value = true
  const { error } = await supabase.from('sites').insert({
    company_id: user.value.company_id,
    name: state.name,
    address: state.address || null,
  })
  loading.value = false
  if (error) {
    toast.add({ title: 'Error', description: error.message, color: 'red' })
    return
  }
  toast.add({ title: 'Site added successfully', description: `${state.name} is now available for visitor check-ins.`, color: 'green' })
  await navigateTo('/dashboard/sites')
}
</script>

<template>
  <div class="flex flex-col h-full">
    <LayoutTopbar title="New Site" />

    <div class="p-6 max-w-lg">
      <UButton variant="ghost" size="sm" to="/dashboard/sites" icon="i-lucide-arrow-left" class="mb-4 -ml-2">
        Back
      </UButton>
      <UCard>
        <template #header>
          <h2 class="font-bold text-gray-900">Add a new site</h2>
        </template>
        <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
          <UFormGroup label="Site name" name="name" required>
            <UInput v-model="state.name" placeholder="Head Office" />
          </UFormGroup>
          <UFormGroup label="Address" name="address">
            <UInput v-model="state.address" placeholder="123 Main Street, City" />
          </UFormGroup>
          <div class="flex gap-3 pt-2">
            <UButton variant="outline" @click="navigateTo('/dashboard/sites')">Cancel</UButton>
            <UButton type="submit" :loading="loading">Create Site</UButton>
          </div>
        </UForm>
      </UCard>
    </div>
  </div>
</template>
