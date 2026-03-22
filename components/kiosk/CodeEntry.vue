<script setup lang="ts">
import type { VisitWithRelations } from '~/types/database'

const props = defineProps<{
  siteId: string
  endpoint: 'checkin' | 'checkout'
  checkoutMode?: boolean
}>()

const emit = defineEmits<{
  success: [visit: VisitWithRelations]
  error: [message: string]
  back: []
}>()

const code = ref('')
const loading = ref(false)
const errorMsg = ref<string | null>(null)

// Auto-format as the user types: uppercase, strip non-alphanumeric
// Display with a hyphen after position 3 (ABC-123), store clean internally
const displayCode = computed(() => {
  const clean = code.value.replace(/[^A-Z0-9]/g, '')
  if (clean.length > 3) return `${clean.slice(0, 3)}-${clean.slice(3, 6)}`
  return clean
})

function onKeypadPress(char: string) {
  const clean = code.value.replace(/[^A-Z0-9]/g, '')
  if (clean.length >= 6) return
  code.value = (clean + char).replace(/[^A-Z0-9]/g, '')
}

function onKeypadDelete() {
  const clean = code.value.replace(/[^A-Z0-9]/g, '')
  code.value = clean.slice(0, -1)
}

function onInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
  code.value = raw
}

const isComplete = computed(() => code.value.replace(/[^A-Z0-9]/g, '').length === 6)

async function submit() {
  const clean = code.value.replace(/[^A-Z0-9]/g, '')
  if (!clean) return
  loading.value = true
  errorMsg.value = null
  emit('error', '')

  const res = await fetch(`/api/kiosk/${props.siteId}/${props.endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_code: clean }),
  })
  const data = await res.json()
  loading.value = false

  if (!res.ok) {
    const msg = data.statusMessage ?? data.error ?? 'Code not found. Please try again.'
    errorMsg.value = msg
    emit('error', msg)
    return
  }
  emit('success', data.visit)
}

// Keyboard rows for the on-screen pad
const topRow = ['1','2','3','4','5','6','7','8','9','0']
const letters = ['A','B','C','D','E','F','G','H','J','K','L','M','N','P','Q','R','S','T','U','V','W','X','Y','Z']
</script>

<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="text-center">
      <UIcon name="i-lucide-hash" class="h-10 w-10 text-slate-400 mx-auto mb-3" />
      <h2 class="font-semibold text-slate-900 text-lg">
        {{ checkoutMode ? 'Enter your access code to check out' : 'Enter your access code' }}
      </h2>
      <p class="text-sm text-slate-500 mt-1">6-character code from your invitation email</p>
    </div>

    <!-- Code display (large, touch-friendly) -->
    <div class="relative">
      <div
        class="w-full text-center text-3xl font-mono tracking-[0.35em] h-16 border-2 rounded-xl flex items-center justify-center transition-colors select-none"
        :class="errorMsg ? 'border-red-400 bg-red-50 text-red-700' : isComplete ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-900'"
      >
        {{ displayCode || '———' }}
      </div>
      <!-- Progress dots -->
      <div class="flex justify-center gap-2 mt-2">
        <div
          v-for="i in 6"
          :key="i"
          class="h-1.5 w-1.5 rounded-full transition-colors"
          :class="i <= code.replace(/[^A-Z0-9]/g, '').length ? 'bg-slate-900' : 'bg-slate-200'"
        />
      </div>
    </div>

    <!-- Error message -->
    <div v-if="errorMsg" class="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
      <UIcon name="i-lucide-alert-circle" class="h-4 w-4 text-red-500 shrink-0" />
      <p class="text-sm text-red-700">{{ errorMsg }}</p>
    </div>

    <!-- On-screen keyboard — numbers -->
    <div class="grid grid-cols-10 gap-1">
      <button
        v-for="n in topRow"
        :key="n"
        class="h-10 rounded-lg bg-slate-100 text-slate-800 font-mono font-semibold text-sm hover:bg-slate-200 active:bg-slate-300 transition-colors"
        @click="onKeypadPress(n)"
      >
        {{ n }}
      </button>
    </div>

    <!-- On-screen keyboard — letters (excludes ambiguous O, I, 1, 0) -->
    <div class="grid grid-cols-8 gap-1">
      <button
        v-for="l in letters"
        :key="l"
        class="h-10 rounded-lg bg-slate-100 text-slate-800 font-mono font-semibold text-sm hover:bg-slate-200 active:bg-slate-300 transition-colors"
        @click="onKeypadPress(l)"
      >
        {{ l }}
      </button>
      <!-- Delete key spans remaining space -->
      <button
        class="h-10 col-span-2 rounded-lg bg-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-300 active:bg-slate-400 transition-colors flex items-center justify-center gap-1"
        @click="onKeypadDelete"
      >
        <UIcon name="i-lucide-delete" class="h-4 w-4" />
        DEL
      </button>
    </div>

    <!-- Hidden native input for physical keyboard / accessibility -->
    <input
      :value="displayCode"
      class="sr-only"
      aria-label="Access code"
      autocomplete="off"
      @input="onInput"
      @keydown.enter="submit"
    />

    <!-- Submit button -->
    <button
      class="w-full h-14 bg-slate-900 text-white rounded-xl font-semibold text-base hover:bg-slate-800 active:bg-slate-700 transition-colors disabled:opacity-40"
      :disabled="loading || !code.replace(/[^A-Z0-9]/g, '')"
      @click="submit"
    >
      <span v-if="loading" class="flex items-center justify-center gap-2">
        <UIcon name="i-lucide-loader-2" class="h-5 w-5 animate-spin" />
        Checking…
      </span>
      <span v-else>{{ checkoutMode ? 'Check Out' : 'Check In' }}</span>
    </button>

    <button
      class="w-full py-3 text-sm text-slate-500 hover:text-slate-900 transition-colors"
      @click="emit('back')"
    >
      Back
    </button>
  </div>
</template>
