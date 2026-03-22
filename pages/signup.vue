<script setup lang="ts">
import { z } from 'zod'

definePageMeta({ layout: 'auth' })
useHead({ title: 'Create Account – Muyenzi' })

const supabase = useSupabaseClient()
const error = ref<string | null>(null)
const loading = ref(false)
const success = ref(false)

const state = reactive({
  full_name: '',
  company_name: '',
  email: '',
  password: '',
})

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  company_name: z.string().min(2, 'Company name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

async function onSubmit() {
  error.value = null
  loading.value = true
  const { error: authError } = await supabase.auth.signUp({
    email: state.email,
    password: state.password,
    options: {
      data: {
        full_name: state.full_name,
        company_name: state.company_name,
      },
      emailRedirectTo: `${window.location.origin}/confirm`,
    },
  })
  loading.value = false
  if (authError) {
    error.value = authError.message
    return
  }
  success.value = true
}
</script>

<template>
  <div>
    <UCard v-if="success">
      <template #header>
        <div class="text-center py-2">
          <div class="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
            <UIcon name="i-lucide-mail-check" class="h-6 w-6 text-emerald-600" />
          </div>
          <h1 class="font-bold text-slate-900 text-xl">Check your email</h1>
          <p class="text-sm text-slate-500 mt-1">
            We've sent a verification link to <strong>{{ state.email }}</strong>.
            Click it to complete your registration.
          </p>
        </div>
      </template>
      <UButton variant="outline" block @click="navigateTo('/login')">Back to sign in</UButton>
    </UCard>

    <UCard v-else>
      <template #header>
        <div>
          <h1 class="font-bold text-slate-900 text-xl">Create your account</h1>
          <p class="text-sm text-slate-500 mt-0.5">Start managing visitors professionally</p>
        </div>
      </template>

      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UAlert v-if="error" color="red" variant="soft" :description="error" />

        <UFormGroup label="Your name" name="full_name">
          <UInput v-model="state.full_name" placeholder="Jane Smith" />
        </UFormGroup>
        <UFormGroup label="Company name" name="company_name">
          <UInput v-model="state.company_name" placeholder="Acme Corp" />
        </UFormGroup>
        <UFormGroup label="Work email" name="email">
          <UInput v-model="state.email" type="email" placeholder="you@company.com" />
        </UFormGroup>
        <UFormGroup label="Password" name="password">
          <UInput v-model="state.password" type="password" placeholder="At least 8 characters" />
        </UFormGroup>

        <UButton type="submit" block :loading="loading" class="mt-2">
          Create account
        </UButton>
      </UForm>

      <template #footer>
        <p class="text-center text-sm text-slate-500">
          Already have an account?
          <NuxtLink to="/login" class="font-medium text-slate-900 hover:underline">Sign in</NuxtLink>
        </p>
      </template>
    </UCard>
  </div>
</template>
