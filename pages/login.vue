<script setup lang="ts">
import { z } from 'zod'

definePageMeta({ layout: 'auth' })
useHead({ title: 'Sign In – Muyenzi' })

const supabase = useSupabaseClient()
const route = useRoute()
const rawRedirect = (route.query.redirect as string) || '/dashboard'
const redirect = (rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')) ? rawRedirect : '/dashboard'
const deactivated = route.query.reason === 'deactivated'

const state = reactive({ email: '', password: '' })
const error = ref<string | null>(null)
const loading = ref(false)
const showPassword = ref(false)

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

async function onSubmit() {
  error.value = null
  loading.value = true
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: state.email,
    password: state.password,
  })
  loading.value = false
  if (authError) {
    // Normalise Supabase error — don't distinguish between wrong email vs wrong password
    error.value = 'Invalid email or password'
    return
  }
  await navigateTo(redirect)
}
</script>

<template>
  <UCard>
    <template #header>
      <div>
        <h1 class="font-bold text-slate-900 text-xl">Welcome back</h1>
        <p class="text-sm text-slate-500 mt-0.5">Sign in to your Muyenzi account</p>
      </div>
    </template>

    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
      <UAlert
        v-if="deactivated"
        color="amber"
        variant="soft"
        icon="i-lucide-alert-triangle"
        description="Your account has been deactivated. Contact your administrator."
      />
      <UAlert v-if="error" color="red" variant="soft" :description="error" />

      <UFormGroup label="Email" name="email">
        <UInput
          v-model="state.email"
          type="email"
          placeholder="you@company.com"
          autocomplete="email"
        />
      </UFormGroup>

      <UFormGroup name="password">
        <template #label>
          <div class="flex items-center justify-between w-full">
            <span>Password</span>
            <NuxtLink to="/auth/reset-password" class="text-xs text-slate-500 hover:text-slate-900">
              Forgot password?
            </NuxtLink>
          </div>
        </template>
        <div class="relative">
          <UInput
            v-model="state.password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
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

      <UButton type="submit" block :loading="loading" class="mt-2">
        Sign in
      </UButton>
    </UForm>

    <template #footer>
      <p class="text-center text-sm text-slate-500">
        Don't have an account?
        <NuxtLink to="/signup" class="font-medium text-slate-900 hover:underline">Sign up</NuxtLink>
      </p>
    </template>
  </UCard>
</template>
