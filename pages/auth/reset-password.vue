<script setup lang="ts">
import { z } from 'zod'

definePageMeta({ layout: 'auth' })
useHead({ title: 'Reset Password – Muyenzi' })

const supabase = useSupabaseClient()
const state = reactive({ email: '' })
const sent = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
})

async function onSubmit() {
  error.value = null
  loading.value = true
  const { error: resetError } = await supabase.auth.resetPasswordForEmail(state.email, {
    redirectTo: `${window.location.origin}/auth/update-password`,
  })
  loading.value = false
  if (resetError) {
    error.value = resetError.message
    return
  }
  sent.value = true
}
</script>

<template>
  <UCard>
    <template #header>
      <div>
        <h1 class="font-bold text-slate-900 text-xl">Reset your password</h1>
        <p class="text-sm text-slate-500 mt-0.5">Enter your email and we'll send a reset link</p>
      </div>
    </template>

    <div v-if="sent" class="text-center py-4">
      <UIcon name="i-lucide-mail-check" class="h-8 w-8 text-emerald-500 mx-auto mb-2" />
      <p class="text-sm text-slate-600">Check your inbox for a password reset link.</p>
    </div>

    <UForm v-else :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
      <UAlert v-if="error" color="red" variant="soft" :description="error" />
      <UFormGroup label="Email" name="email">
        <UInput v-model="state.email" type="email" placeholder="you@company.com" />
      </UFormGroup>
      <UButton type="submit" block :loading="loading">Send reset link</UButton>
    </UForm>

    <template #footer>
      <p class="text-center text-sm text-slate-500">
        <NuxtLink to="/login" class="font-medium text-slate-900 hover:underline">Back to sign in</NuxtLink>
      </p>
    </template>
  </UCard>
</template>
