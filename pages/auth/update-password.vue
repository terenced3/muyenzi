<script setup lang="ts">
import { z } from 'zod'

definePageMeta({ layout: 'auth' })
useHead({ title: 'Set New Password – Muyenzi' })

const supabase = useSupabaseClient()
const state = reactive({ password: '', confirm: '' })
const loading = ref(false)
const error = ref<string | null>(null)
const done = ref(false)

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm: z.string(),
}).refine(data => data.password === data.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
})

async function onSubmit() {
  error.value = null
  loading.value = true
  const { error: updateError } = await supabase.auth.updateUser({ password: state.password })
  loading.value = false
  if (updateError) {
    error.value = updateError.message
    return
  }
  done.value = true
  setTimeout(() => navigateTo('/dashboard'), 2000)
}
</script>

<template>
  <UCard>
    <template #header>
      <div>
        <h1 class="font-bold text-slate-900 text-xl">Set new password</h1>
        <p class="text-sm text-slate-500 mt-0.5">Choose a strong password for your account</p>
      </div>
    </template>

    <div v-if="done" class="text-center py-4">
      <UIcon name="i-lucide-check-circle-2" class="h-8 w-8 text-emerald-500 mx-auto mb-2" />
      <p class="text-sm text-slate-600">Password updated. Redirecting to dashboard…</p>
    </div>

    <UForm v-else :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
      <UAlert v-if="error" color="red" variant="soft" :description="error" />
      <UFormGroup label="New password" name="password">
        <UInput v-model="state.password" type="password" placeholder="At least 8 characters" />
      </UFormGroup>
      <UFormGroup label="Confirm password" name="confirm">
        <UInput v-model="state.confirm" type="password" placeholder="Repeat your new password" />
      </UFormGroup>
      <UButton type="submit" block :loading="loading">Update password</UButton>
    </UForm>
  </UCard>
</template>
