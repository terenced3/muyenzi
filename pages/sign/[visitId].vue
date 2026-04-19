<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const route = useRoute()
const visitId = route.params.visitId as string

interface PresignInfo {
  visit_id: string
  visitor_id: string
  company_id: string
  visitor_name: string
  visit_date: string
  unsigned_templates: { id: string; name: string; content: string }[]
  already_signed: number
  total_templates: number
}

const { data: info, error, pending } = await useFetch<PresignInfo>('/api/documents/presign-info', {
  query: { visit_id: visitId },
})

const currentIndex = ref(0)
const scrolledToBottom = ref(false)
const signatureData = ref('')
const submitting = ref(false)
const allDone = ref(false)
const toast = useToast()
const sigPad = ref<{ clear: () => void } | null>(null)
const scrollContainer = ref<HTMLElement | null>(null)

useHead({ title: 'Review & Sign Documents – Muyenzi' })

const templates = computed(() => info.value?.unsigned_templates ?? [])
const current = computed(() => templates.value[currentIndex.value])
const isLast = computed(() => currentIndex.value === templates.value.length - 1)

function onScroll(e: Event) {
  const el = e.target as HTMLElement
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) scrolledToBottom.value = true
}

watch(currentIndex, () => {
  scrolledToBottom.value = false
  signatureData.value = ''
  sigPad.value?.clear()
  nextTick(() => {
    if (scrollContainer.value) scrollContainer.value.scrollTop = 0
  })
})

async function confirmSign() {
  if (!info.value || !scrolledToBottom.value || !signatureData.value) return
  submitting.value = true
  try {
    await $fetch('/api/documents/sign', {
      method: 'POST',
      body: {
        template_id: current.value.id,
        visit_id: info.value.visit_id,
        visitor_id: info.value.visitor_id,
        company_id: info.value.company_id,
        signature_data: signatureData.value,
        pre_signed: true,
      },
    })
    if (isLast.value) {
      allDone.value = true
    } else {
      currentIndex.value++
    }
  } catch (e: any) {
    toast.add({ title: 'Error', description: e?.data?.statusMessage ?? 'Failed to save signature', color: 'red' })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-start py-10 px-4">
    <div class="w-full max-w-xl">
      <!-- Header -->
      <div class="text-center mb-8">
        <div
          class="h-10 w-10 rounded-xl flex items-center justify-center mx-auto mb-3"
          style="background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%)"
        >
          <span class="text-white font-bold text-sm">M</span>
        </div>
        <h1 class="text-2xl font-bold text-gray-900">Review & Sign</h1>
        <p class="text-gray-500 text-sm mt-1">Please read and sign the required documents before your visit.</p>
      </div>

      <!-- Loading -->
      <div v-if="pending" class="text-center py-16 text-gray-400">Loading documents…</div>

      <!-- Error -->
      <UCard v-else-if="error" class="text-center py-10">
        <UIcon name="i-lucide-alert-circle" class="h-12 w-12 text-red-300 mx-auto mb-3" />
        <h2 class="font-bold text-gray-900">Unable to load documents</h2>
        <p class="text-sm text-gray-400 mt-1">{{ (error as any)?.data?.statusMessage ?? 'Visit not found or no longer active.' }}</p>
      </UCard>

      <!-- Already fully signed -->
      <UCard v-else-if="info && info.unsigned_templates.length === 0 && !allDone" class="text-center py-10">
        <UIcon name="i-lucide-check-circle" class="h-12 w-12 text-green-400 mx-auto mb-3" />
        <h2 class="font-bold text-gray-900">All documents signed</h2>
        <p class="text-sm text-gray-400 mt-1">You've already completed all required sign-offs. See you on {{ info.visit_date }}!</p>
      </UCard>

      <!-- Success -->
      <UCard v-else-if="allDone" class="text-center py-10">
        <UIcon name="i-lucide-check-circle" class="h-12 w-12 text-green-400 mx-auto mb-3" />
        <h2 class="font-bold text-gray-900">Documents signed!</h2>
        <p class="text-sm text-gray-400 mt-1">
          Thank you, {{ info?.visitor_name }}. Your signatures have been recorded.
          You're all set for your visit on {{ info?.visit_date }}.
        </p>
      </UCard>

      <!-- Signing flow -->
      <UCard v-else-if="info && current">
        <!-- Visit info banner -->
        <div class="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl mb-5">
          <UIcon name="i-lucide-calendar" class="h-5 w-5 text-indigo-400 shrink-0" />
          <div>
            <p class="text-sm font-semibold text-gray-900">{{ info.visitor_name }}</p>
            <p class="text-xs text-gray-500">Visit date: {{ info.visit_date }}</p>
          </div>
          <div class="ml-auto text-xs text-indigo-600 font-medium">
            {{ currentIndex + 1 }} / {{ templates.length }}
          </div>
        </div>

        <!-- Progress dots -->
        <div class="flex gap-1.5 mb-4">
          <div
            v-for="(_, i) in templates"
            :key="i"
            class="h-1.5 flex-1 rounded-full transition-colors"
            :class="i < currentIndex ? 'bg-green-500' : i === currentIndex ? 'bg-indigo-500' : 'bg-gray-200'"
          />
        </div>

        <h2 class="font-bold text-gray-900 text-lg mb-3">{{ current.name }}</h2>

        <!-- Document scroll area -->
        <div
          ref="scrollContainer"
          class="overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-4"
          style="max-height: 300px"
          @scroll="onScroll"
        >
          {{ current.content }}
        </div>

        <div
          v-if="!scrolledToBottom"
          class="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-xl px-4 py-2.5 mb-4"
        >
          <UIcon name="i-lucide-arrow-down" class="h-4 w-4 shrink-0" />
          Scroll to the bottom to unlock the signature field.
        </div>

        <!-- Signature -->
        <div class="space-y-2 mb-5">
          <label class="text-sm font-semibold text-gray-700">Your signature</label>
          <KioskSignaturePad
            ref="sigPad"
            :disabled="!scrolledToBottom"
            @signed="signatureData = $event"
            @cleared="signatureData = ''"
          />
        </div>

        <UButton
          size="lg"
          icon="i-lucide-check"
          :loading="submitting"
          :disabled="!scrolledToBottom || !signatureData"
          class="w-full justify-center"
          @click="confirmSign"
        >
          {{ isLast ? 'Submit signatures' : 'Sign & continue' }}
        </UButton>
      </UCard>
    </div>
  </div>
</template>
