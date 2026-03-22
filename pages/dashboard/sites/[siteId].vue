<script setup lang="ts">
import { z } from 'zod'

definePageMeta({ layout: 'dashboard' })

const supabase = useSupabaseClient()
const route = useRoute()
const toast = useToast()
const siteId = route.params.siteId as string

const state = reactive({ name: '', address: '' })
const loading = ref(false)
const fetchLoading = ref(true)

useHead({ title: 'Edit Site – Muyenzi' })

const schema = z.object({
  name: z.string().min(2, 'Site name is required'),
  address: z.string().optional(),
})

onMounted(async () => {
  const { data } = await supabase.from('sites').select('*').eq('id', siteId).single()
  if (!data) { await navigateTo('/dashboard/sites'); return }
  state.name = data.name
  state.address = data.address ?? ''
  fetchLoading.value = false
})

async function onSubmit() {
  loading.value = true
  const { error } = await supabase.from('sites').update({
    name: state.name,
    address: state.address || null,
  }).eq('id', siteId)
  loading.value = false
  if (error) {
    toast.add({ title: 'Error', description: error.message, color: 'red' })
    return
  }
  toast.add({ title: 'Site updated', color: 'green' })
  await navigateTo('/dashboard/sites')
}
</script>

<template>
  <div class="flex flex-col h-full">
    <LayoutTopbar title="Edit Site" />

    <div class="p-6 max-w-lg">
      <UButton variant="ghost" size="sm" to="/dashboard/sites" icon="i-lucide-arrow-left" class="mb-4 -ml-2">
        Back
      </UButton>
      <UCard v-if="!fetchLoading">
        <template #header>
          <h2 class="font-bold text-gray-900">Edit site</h2>
        </template>
        <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
          <UFormGroup label="Site name" name="name" required>
            <UInput v-model="state.name" />
          </UFormGroup>
          <UFormGroup label="Address" name="address">
            <UInput v-model="state.address" />
          </UFormGroup>
          <div class="flex gap-3 pt-2">
            <UButton variant="outline" @click="navigateTo('/dashboard/sites')">Cancel</UButton>
            <UButton type="submit" :loading="loading">Save Changes</UButton>
          </div>
        </UForm>
      </UCard>
    </div>
  </div>
</template>
