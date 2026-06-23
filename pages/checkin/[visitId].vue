<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ title: 'Check In – Muyenzi' })

const route = useRoute()
const visitId = route.params.visitId as string
const ct = (route.query.ct as string) ?? ''
const exp = (route.query.exp as string) ?? ''

interface VisitPreview {
  visit_id: string
  status: string
  visit_date: string
  visit_time: string | null
  purpose: string | null
  check_in_at: string | null
  visitor_name: string
  host_name: string | null
  site_name: string
  site_address: string | null
  company_name: string
  company_logo: string | null
}

const { data: visit, error: loadError, pending } = await useFetch<VisitPreview>(
  `/api/visits/${visitId}/self-checkin`,
  { query: { ct, exp } },
)

type Screen = 'ready' | 'checking_in' | 'success' | 'already_in' | 'inactive' | 'blocked' | 'error'

const screen = computed<Screen>(() => {
  if (loadError.value) {
    const code = (loadError.value as any)?.statusCode
    if (code === 403) return 'blocked'
    if (code === 410) return 'inactive'
    return 'error'
  }
  if (!visit.value) return 'ready'
  if (visit.value.status === 'checked_in') return 'already_in'
  return 'ready'
})

const checkedInAt = ref<string | null>(visit.value?.check_in_at ?? null)
const checkingIn = ref(false)
const checkInError = ref<string | null>(null)

async function checkIn() {
  checkingIn.value = true
  checkInError.value = null
  try {
    const result = await $fetch<{ check_in_at: string; already_checked_in?: boolean }>(
      `/api/visits/${visitId}/self-checkin`,
      { method: 'POST', query: { ct, exp } },
    )
    checkedInAt.value = result.check_in_at
    // Navigate to success state
    await navigateTo({ query: { ct, exp, _done: '1' } }, { replace: true })
  } catch (e: any) {
    const code = e?.statusCode ?? e?.response?.status
    const msg = e?.data?.statusMessage ?? e?.message ?? 'Something went wrong'
    if (code === 409) {
      checkedInAt.value = new Date().toISOString()
      await navigateTo({ query: { ct, exp, _done: '1' } }, { replace: true })
    } else {
      checkInError.value = msg
    }
  } finally {
    checkingIn.value = false
  }
}

const done = computed(() => route.query._done === '1')

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return d
  }
}

function formatTime(t: string | null) {
  if (!t) return null
  try {
    const [h, m] = t.split(':')
    const date = new Date()
    date.setHours(Number(h), Number(m))
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return t
  }
}

function formatCheckinAt(iso: string | null) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex flex-col">

    <!-- Loading -->
    <div v-if="pending" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <UIcon name="i-lucide-loader-2" class="h-8 w-8 text-indigo-500 animate-spin mx-auto mb-3" />
        <p class="text-slate-500 text-sm">Loading your visit…</p>
      </div>
    </div>

    <!-- Invalid / expired link -->
    <div v-else-if="screen === 'error' || screen === 'blocked'" class="flex-1 flex items-center justify-center p-6">
      <div class="text-center max-w-xs">
        <div class="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <UIcon name="i-lucide-link-2-off" class="h-8 w-8 text-red-500" />
        </div>
        <h1 class="text-xl font-bold text-slate-900 mb-2">Link not valid</h1>
        <p class="text-slate-500 text-sm leading-relaxed">
          {{ screen === 'blocked' ? 'Entry is not permitted for this visit. Please contact reception.' : 'This check-in link is invalid or has expired. Contact the person who invited you for a new link.' }}
        </p>
      </div>
    </div>

    <!-- Visit cancelled / no-show / checked out -->
    <div v-else-if="screen === 'inactive'" class="flex-1 flex items-center justify-center p-6">
      <div class="text-center max-w-xs">
        <div class="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <UIcon name="i-lucide-calendar-x" class="h-8 w-8 text-amber-500" />
        </div>
        <h1 class="text-xl font-bold text-slate-900 mb-2">Visit no longer active</h1>
        <p class="text-slate-500 text-sm leading-relaxed">
          This visit has been cancelled or is no longer accepting check-ins. Please contact reception.
        </p>
      </div>
    </div>

    <!-- Already checked in (loaded from server) OR post-checkin success -->
    <div v-else-if="(screen === 'already_in' && !done) || done" class="flex-1 flex flex-col items-center justify-center p-6">
      <!-- Company header -->
      <div v-if="visit" class="mb-8 text-center">
        <img v-if="visit.company_logo" :src="visit.company_logo" :alt="visit.company_name" class="h-10 mx-auto mb-2 object-contain" />
        <p v-else class="text-sm font-semibold text-slate-500">{{ visit.company_name }}</p>
      </div>

      <div class="text-center max-w-xs">
        <div class="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
          <UIcon name="i-lucide-circle-check-big" class="h-10 w-10 text-emerald-600" />
        </div>
        <h1 class="text-2xl font-bold text-slate-900 mb-1">
          {{ done && !visit?.check_in_at ? 'Checked in!' : 'You\'re checked in' }}
        </h1>
        <p class="text-slate-500 text-sm mb-6">
          <template v-if="checkedInAt">Checked in at {{ formatCheckinAt(checkedInAt) }}</template>
          <template v-else-if="visit?.check_in_at">Checked in at {{ formatCheckinAt(visit.check_in_at) }}</template>
        </p>

        <!-- Visit summary card -->
        <div v-if="visit" class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 text-left space-y-3">
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-building-2" class="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
            <div>
              <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">Site</p>
              <p class="text-sm font-semibold text-slate-900">{{ visit.site_name }}</p>
              <p v-if="visit.site_address" class="text-xs text-slate-500">{{ visit.site_address }}</p>
            </div>
          </div>
          <div v-if="visit.host_name" class="flex items-start gap-3">
            <UIcon name="i-lucide-user" class="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
            <div>
              <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">Host</p>
              <p class="text-sm font-semibold text-slate-900">{{ visit.host_name }}</p>
            </div>
          </div>
        </div>

        <p class="text-xs text-slate-400 mt-6">
          Your host has been notified of your arrival.
        </p>
      </div>
    </div>

    <!-- Ready to check in -->
    <div v-else-if="visit && screen === 'ready'" class="flex-1 flex flex-col">

      <!-- Header -->
      <div class="bg-white border-b border-slate-100 px-6 pt-10 pb-6 text-center">
        <img v-if="visit.company_logo" :src="visit.company_logo" :alt="visit.company_name" class="h-10 mx-auto mb-3 object-contain" />
        <div v-else class="h-10 w-10 rounded-xl flex items-center justify-center mx-auto mb-3" style="background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%)">
          <span class="text-white font-bold text-sm">{{ visit.company_name.charAt(0) }}</span>
        </div>
        <p class="text-xs text-slate-500 font-medium uppercase tracking-wide">{{ visit.company_name }}</p>
        <h1 class="text-xl font-bold text-slate-900 mt-1">Welcome, {{ visit.visitor_name }}</h1>
      </div>

      <!-- Visit details -->
      <div class="flex-1 p-6 space-y-3">

        <!-- Visit card -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">

          <div class="flex items-start gap-3">
            <div class="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-building-2" class="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">Site</p>
              <p class="text-sm font-semibold text-slate-900">{{ visit.site_name }}</p>
              <p v-if="visit.site_address" class="text-xs text-slate-500 mt-0.5">{{ visit.site_address }}</p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <div class="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-calendar" class="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">Date</p>
              <p class="text-sm font-semibold text-slate-900">{{ formatDate(visit.visit_date) }}</p>
              <p v-if="visit.visit_time" class="text-xs text-slate-500 mt-0.5">{{ formatTime(visit.visit_time) }}</p>
            </div>
          </div>

          <div v-if="visit.host_name" class="flex items-start gap-3">
            <div class="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-user" class="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">Host</p>
              <p class="text-sm font-semibold text-slate-900">{{ visit.host_name }}</p>
            </div>
          </div>

          <div v-if="visit.purpose" class="flex items-start gap-3">
            <div class="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-briefcase" class="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">Purpose</p>
              <p class="text-sm font-semibold text-slate-900">{{ visit.purpose }}</p>
            </div>
          </div>
        </div>

        <!-- Error -->
        <div v-if="checkInError" class="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <UIcon name="i-lucide-alert-circle" class="h-5 w-5 text-red-500 shrink-0" />
          <p class="text-sm text-red-700">{{ checkInError }}</p>
        </div>
      </div>

      <!-- Check-in button pinned to bottom -->
      <div class="p-6 bg-white border-t border-slate-100">
        <button
          class="w-full h-14 rounded-2xl font-bold text-base text-white transition-all active:scale-95 disabled:opacity-50"
          style="background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%)"
          :disabled="checkingIn"
          @click="checkIn"
        >
          <span v-if="checkingIn" class="flex items-center justify-center gap-2">
            <UIcon name="i-lucide-loader-2" class="h-5 w-5 animate-spin" />
            Checking you in…
          </span>
          <span v-else class="flex items-center justify-center gap-2">
            <UIcon name="i-lucide-log-in" class="h-5 w-5" />
            Check In
          </span>
        </button>
        <p class="text-center text-xs text-slate-400 mt-3">
          Your host will be notified automatically
        </p>
      </div>
    </div>

  </div>
</template>
