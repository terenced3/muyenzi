<script setup lang="ts">
import { z } from 'zod'

definePageMeta({ layout: 'auth' })
useHead({ title: 'Create Account – Muyenzi' })

const supabase = useSupabaseClient()
const loading = ref(false)
const success = ref(false)
const showPassword = ref(false)
const showConfirm = ref(false)

const state = reactive({
  full_name: '',
  company_name: '',
  email: '',
  password: '',
  confirm_password: '',
})

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  company_name: z.string().min(2, 'Company name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine(d => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

// 0–4 strength score
const strength = computed(() => {
  const p = state.password
  if (!p) return 0
  let s = 0
  if (p.length >= 8) s++
  if (p.length >= 12) s++
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++
  if (/[0-9]/.test(p) || /[^A-Za-z0-9]/.test(p)) s++
  return s
})

const strengthLabel = computed(() => ['', 'Weak', 'Fair', 'Good', 'Strong'][strength.value])
const strengthColor = computed(() => ['', 'bg-red-400', 'bg-amber-400', 'bg-lime-400', 'bg-emerald-500'][strength.value])

async function onSubmit() {
  loading.value = true
  await supabase.auth.signUp({
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
  // Always show success — never reveal whether the email is already registered
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
        <UFormGroup label="Your name" name="full_name">
          <UInput v-model="state.full_name" placeholder="Jane Smith" autocomplete="name" />
        </UFormGroup>

        <UFormGroup label="Company name" name="company_name">
          <UInput v-model="state.company_name" placeholder="Acme Corp" autocomplete="organization" />
        </UFormGroup>

        <UFormGroup label="Work email" name="email">
          <UInput v-model="state.email" type="email" placeholder="you@company.com" autocomplete="email" />
        </UFormGroup>

        <UFormGroup label="Password" name="password">
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
          <!-- Strength meter -->
          <div v-if="state.password" class="mt-2 space-y-1">
            <div class="flex gap-1">
              <div
                v-for="i in 4"
                :key="i"
                class="h-1 flex-1 rounded-full transition-colors duration-200"
                :class="i <= strength ? strengthColor : 'bg-slate-200'"
              />
            </div>
            <p class="text-xs" :class="['', 'text-red-500', 'text-amber-500', 'text-lime-600', 'text-emerald-600'][strength]">
              {{ strengthLabel }}
            </p>
          </div>
        </UFormGroup>

        <UFormGroup label="Confirm password" name="confirm_password">
          <div class="relative">
            <UInput
              v-model="state.confirm_password"
              :type="showConfirm ? 'text' : 'password'"
              placeholder="Repeat your password"
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
