<script setup lang="ts">
import { z } from 'zod'

definePageMeta({ layout: 'auth' })
useHead({ title: 'Set New Password – Muyenzi' })

const supabase = useSupabaseClient()
const supabaseUser = useSupabaseUser()
const state = reactive({ password: '', confirm: '' })
const loading = ref(false)
const error = ref<string | null>(null)
const done = ref(false)
const showPassword = ref(false)
const showConfirm = ref(false)

// Supabase injects a session from the reset-password link before this page loads.
// If there's no session the user reached this page directly — send them back.
onMounted(() => {
  if (!supabaseUser.value) {
    navigateTo('/auth/reset-password')
  }
})

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
        <div class="relative">
          <UInput
            v-model="state.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="At least 8 characters"
            autocomplete="new-password"
            class="pr-10"
          />
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
            @click="showPassword = !showPassword"
          >
            <UIcon :name="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" class="h-4 w-4" />
          </button>
        </div>
      </UFormGroup>

      <UFormGroup label="Confirm password" name="confirm">
        <div class="relative">
          <UInput
            v-model="state.confirm"
            :type="showConfirm ? 'text' : 'password'"
            placeholder="Repeat your new password"
            autocomplete="new-password"
            class="pr-10"
          />
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            :aria-label="showConfirm ? 'Hide password' : 'Show password'"
            @click="showConfirm = !showConfirm"
          >
            <UIcon :name="showConfirm ? 'i-lucide-eye-off' : 'i-lucide-eye'" class="h-4 w-4" />
          </button>
        </div>
      </UFormGroup>

      <UButton type="submit" block :loading="loading">Update password</UButton>
    </UForm>
  </UCard>
</template>
