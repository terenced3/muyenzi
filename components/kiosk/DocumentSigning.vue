<script setup lang="ts">
interface Template {
  id: string
  name: string
  content: string
}

const props = defineProps<{
  visitId: string
  visitorId: string
  companyId: string
  templates: Template[]
}>()

const emit = defineEmits<{ (e: 'completed'): void; (e: 'error', msg: string): void }>()

const currentIndex = ref(0)
const scrolledToBottom = ref(false)
const signatureData = ref('')
const submitting = ref(false)
const sigPad = ref<{ clear: () => void; hasSigned: Ref<boolean> } | null>(null)
const scrollContainer = ref<HTMLElement | null>(null)

const current = computed(() => props.templates[currentIndex.value])
const isLast = computed(() => currentIndex.value === props.templates.length - 1)

function onScroll(e: Event) {
  const el = e.target as HTMLElement
  const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 20
  if (atBottom) scrolledToBottom.value = true
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
  if (!scrolledToBottom.value || !signatureData.value) return
  submitting.value = true
  try {
    await $fetch('/api/documents/sign', {
      method: 'POST',
      body: {
        template_id: current.value.id,
        visit_id: props.visitId,
        visitor_id: props.visitorId,
        company_id: props.companyId,
        signature_data: signatureData.value,
        pre_signed: false,
      },
    })
    if (isLast.value) {
      emit('completed')
    } else {
      currentIndex.value++
    }
  } catch (e: any) {
    emit('error', e?.data?.statusMessage ?? 'Failed to save signature')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col h-full max-w-2xl mx-auto p-6 space-y-5">
    <!-- Progress -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-gray-900">Document Sign-Off</h2>
        <p class="text-sm text-gray-500 mt-0.5">
          {{ currentIndex + 1 }} of {{ templates.length }} — {{ current.name }}
        </p>
      </div>
      <div class="flex gap-1.5">
        <div
          v-for="(_, i) in templates"
          :key="i"
          class="h-2 w-6 rounded-full transition-colors"
          :class="i < currentIndex ? 'bg-green-500' : i === currentIndex ? 'bg-indigo-500' : 'bg-gray-200'"
        />
      </div>
    </div>

    <!-- Document content -->
    <div
      ref="scrollContainer"
      class="flex-1 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap"
      style="max-height: 340px; min-height: 200px"
      @scroll="onScroll"
    >
      {{ current.content }}
    </div>

    <div
      v-if="!scrolledToBottom"
      class="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-xl px-4 py-2.5"
    >
      <UIcon name="i-lucide-arrow-down" class="h-4 w-4 shrink-0" />
      Please scroll to the bottom of the document before signing.
    </div>

    <!-- Signature area -->
    <div class="space-y-2">
      <label class="text-sm font-semibold text-gray-700">Your signature</label>
      <KioskSignaturePad
        ref="sigPad"
        :disabled="!scrolledToBottom"
        @signed="signatureData = $event"
        @cleared="signatureData = ''"
      />
    </div>

    <UButton
      size="xl"
      icon="i-lucide-check"
      :loading="submitting"
      :disabled="!scrolledToBottom || !signatureData"
      class="w-full justify-center"
      @click="confirmSign"
    >
      {{ isLast ? 'Confirm & Continue' : 'Sign & Next Document' }}
    </UButton>
  </div>
</template>
