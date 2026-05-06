<script setup lang="ts">
import { z } from 'zod'

definePageMeta({ layout: 'auth' })

const route = useRoute()
const supabase = useSupabaseClient()
const token = route.params.token as string

interface InviteInfo {
  email: string
  role: string
  company_name: string
  inviter_name: string
  expires_at: string
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  site_manager: 'Site Manager',
  receptionist: 'Receptionist',
  host: 'Host',
}

const invite = ref<InviteInfo | null>(null)
const loadError = ref<string | null>(null)
const loading = ref(true)
const submitting = ref(false)
const success = ref(false)
const authError = ref<string | null>(null)

const state = reactive({
  full_name: '',
  password: '',
})

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

onMounted(async () => {
  try {
    const data = await $fetch<InviteInfo>(`/api/team-invites/${token}`)
    invite.value = data
  } catch (e: any) {
    loadError.value = e?.data?.statusMessage ?? 'This invite link is invalid or has expired.'
  } finally {
    loading.value = false
  }
})

async function onSubmit() {
  if (!invite.value) return
  authError.value = null
  submitting.value = true

  const { error } = await supabase.auth.signUp({
    email: invite.value.email,
    password: state.password,
    options: {
      data: {
        full_name: state.full_name,
        invite_token: token,
      },
      emailRedirectTo: `${window.location.origin}/confirm`,
    },
  })

  submitting.value = false

  if (error) {
    authError.value = error.message
    return
  }

  success.value = true
}
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="h-6 w-6 text-indigo-500 animate-spin" />
    </div>

    <!-- Invalid / expired invite -->
    <UCard v-else-if="loadError">
      <template #header>
        <div class="text-center py-2">
          <div class="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
            <UIcon name="i-lucide-link-2-off" class="h-6 w-6 text-red-500" />
          </div>
          <h1 class="font-bold text-slate-900 text-xl">Invite unavailable</h1>
          <p class="text-sm text-slate-500 mt-1">{{ loadError }}</p>
        </div>
      </template>
      <UButton variant="outline" block to="/login">Go to sign in</UButton>
    </UCard>

    <!-- Success — check email -->
    <UCard v-else-if="success">
      <template #header>
        <div class="text-center py-2">
          <div class="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
            <UIcon name="i-lucide-mail-check" class="h-6 w-6 text-emerald-600" />
          </div>
          <h1 class="font-bold text-slate-900 text-xl">Check your email</h1>
          <p class="text-sm text-slate-500 mt-1">
            We've sent a verification link to <strong>{{ invite?.email }}</strong>.<br>
            Click it to complete your registration and access your account.
          </p>
        </div>
      </template>
      <UButton variant="outline" block to="/login">Go to sign in</UButton>
    </UCard>

    <!-- Invite form -->
    <UCard v-else-if="invite">
      <template #header>
        <div>
          <!-- Company context -->
          <div class="flex items-center gap-2 mb-4 p-3 bg-indigo-50 rounded-xl">
            <div class="h-9 w-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-building-2" class="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p class="text-xs text-indigo-500 font-medium">You're joining</p>
              <p class="font-bold text-slate-900 text-sm">{{ invite.company_name }}</p>
            </div>
            <UBadge color="indigo" variant="soft" size="sm" class="ml-auto">
              {{ ROLE_LABELS[invite.role] ?? invite.role }}
            </UBadge>
          </div>

          <h1 class="font-bold text-slate-900 text-xl">Create your account</h1>
          <p class="text-sm text-slate-500 mt-0.5">
            {{ invite.inviter_name }} invited you to join their team.
          </p>
        </div>
      </template>

      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UAlert v-if="authError" color="red" variant="soft" :description="authError" />

        <!-- Email is pre-filled and locked -->
        <UFormGroup label="Work email">
          <UInput :model-value="invite.email" disabled />
          <template #hint>
            <span class="text-xs text-slate-400">Set by your invite — cannot be changed</span>
          </template>
        </UFormGroup>

        <UFormGroup label="Your name" name="full_name">
          <UInput v-model="state.full_name" placeholder="Jane Smith" autofocus />
        </UFormGroup>

        <UFormGroup label="Password" name="password">
          <UInput v-model="state.password" type="password" placeholder="At least 8 characters" />
        </UFormGroup>

        <UAlert
          color="blue"
          variant="soft"
          icon="i-lucide-mail"
          title="Email confirmation required"
          description="After signing up you'll receive a verification email. You must click that link before you can log in."
          class="mt-2"
        />

        <UButton type="submit" block :loading="submitting" class="mt-2">
          Create account &amp; join {{ invite.company_name }}
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
