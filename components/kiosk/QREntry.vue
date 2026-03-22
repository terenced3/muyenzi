<script setup lang="ts">
import type { VisitWithRelations } from '~/types/database'

const props = defineProps<{
  siteId: string
  endpoint?: 'checkin' | 'checkout'
}>()

const emit = defineEmits<{
  success: [visit: VisitWithRelations]
  error: [message: string]
  back: []
}>()

const endpoint = computed(() => props.endpoint ?? 'checkin')

const videoRef = ref<HTMLVideoElement | null>(null)
const manualCode = ref('')
const loading = ref(false)
const scanning = ref(false)
const detected = ref(false)
const cameraError = ref<string | null>(null)
const errorMessage = ref<string | null>(null)

let stream: MediaStream | null = null
let animationId: number | null = null
let detector: any = null

async function startCamera() {
  cameraError.value = null
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
    })
    if (videoRef.value) {
      videoRef.value.srcObject = stream
      await videoRef.value.play()
      scanning.value = true
      startScanning()
    }
  } catch {
    cameraError.value = 'Camera unavailable. Enter your code below.'
  }
}

function startScanning() {
  if ('BarcodeDetector' in window) {
    try {
      detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] })
      scanFrame()
      return
    } catch {}
  }
  cameraError.value = 'QR scanning not supported in this browser. Enter your code below.'
  scanning.value = false
}

async function scanFrame() {
  if (!scanning.value || !videoRef.value || detected.value || loading.value) return
  try {
    const barcodes = await detector.detect(videoRef.value)
    if (barcodes.length > 0) {
      detected.value = true
      await handleQRResult(barcodes[0].rawValue)
      return
    }
  } catch {}
  animationId = requestAnimationFrame(scanFrame)
}

async function handleQRResult(rawValue: string) {
  loading.value = true
  errorMessage.value = null
  emit('error', '')

  const body: Record<string, any> = {}
  try {
    const parsed = JSON.parse(rawValue)
    if (endpoint.value === 'checkout' && parsed.accessCode) {
      body.access_code = parsed.accessCode
    } else {
      body.qr_data = rawValue
    }
  } catch {
    body.access_code = rawValue.trim().toUpperCase().replace(/-/g, '')
  }

  const res = await fetch(`/api/kiosk/${props.siteId}/${endpoint.value}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  loading.value = false

  if (!res.ok) {
    detected.value = false
    const msg = data.statusMessage ?? data.error ?? 'Code not recognized. Please try again.'
    errorMessage.value = msg
    emit('error', msg)
    setTimeout(() => {
      if (scanning.value) scanFrame()
    }, 2500)
    return
  }
  emit('success', data.visit)
}

async function submitManual() {
  if (!manualCode.value.trim()) return
  loading.value = true
  errorMessage.value = null
  emit('error', '')
  const res = await fetch(`/api/kiosk/${props.siteId}/${endpoint.value}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_code: manualCode.value.trim() }),
  })
  const data = await res.json()
  loading.value = false
  if (!res.ok) {
    const msg = data.statusMessage ?? data.error ?? 'Something went wrong'
    errorMessage.value = msg
    emit('error', msg)
    return
  }
  emit('success', data.visit)
}

function stopCamera() {
  scanning.value = false
  if (animationId) cancelAnimationFrame(animationId)
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null }
}

onMounted(startCamera)
onUnmounted(stopCamera)
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="text-center">
      <UIcon name="i-lucide-qr-code" class="h-10 w-10 text-slate-400 mx-auto mb-3" />
      <h2 class="font-semibold text-slate-900 text-lg">
        {{ endpoint === 'checkout' ? 'Scan QR code to check out' : 'Scan your QR code' }}
      </h2>
      <p class="text-sm text-slate-500 mt-1">Hold your QR code in front of the camera</p>
    </div>

    <!-- Camera viewport -->
    <div class="relative bg-slate-900 rounded-xl overflow-hidden" style="aspect-ratio: 4/3">
      <video
        ref="videoRef"
        class="w-full h-full object-cover"
        :class="cameraError ? 'opacity-0 pointer-events-none' : ''"
        muted
        playsinline
      />

      <!-- Scanning overlay with corner guides -->
      <div v-if="scanning && !cameraError" class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div class="relative w-56 h-56">
          <!-- Corner brackets -->
          <div class="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
          <div class="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
          <div class="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
          <div class="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
          <!-- Animated scan line -->
          <div v-if="!detected && !loading" class="absolute left-2 right-2 h-0.5 bg-emerald-400/80 scan-line" />
          <!-- Detected checkmark -->
          <Transition name="fade">
            <div v-if="detected" class="absolute inset-0 bg-emerald-400/20 rounded-lg flex items-center justify-center">
              <UIcon name="i-lucide-check-circle-2" class="h-14 w-14 text-emerald-400" />
            </div>
          </Transition>
        </div>
      </div>

      <!-- Loading spinner overlay -->
      <div v-if="loading" class="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
        <div class="text-center text-white">
          <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin mx-auto mb-2" />
          <p class="text-sm font-medium">Verifying…</p>
        </div>
      </div>

      <!-- Camera error placeholder -->
      <div v-if="cameraError" class="absolute inset-0 flex flex-col items-center justify-center text-center p-6 gap-3">
        <UIcon name="i-lucide-camera-off" class="h-12 w-12 text-slate-600" />
        <p class="text-slate-400 text-sm">{{ cameraError }}</p>
      </div>
    </div>

    <!-- Inline error -->
    <div v-if="errorMessage" class="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
      <UIcon name="i-lucide-alert-circle" class="h-4 w-4 text-red-500 shrink-0" />
      <p class="text-sm text-red-700">{{ errorMessage }}</p>
    </div>

    <!-- Manual code fallback -->
    <div class="space-y-2">
      <p class="text-xs text-center text-slate-400 font-medium">— or enter your access code —</p>
      <div class="flex gap-2">
        <input
          v-model="manualCode"
          class="flex-1 text-center text-lg font-mono tracking-widest border-2 border-slate-200 rounded-xl h-12 focus:outline-none focus:border-slate-900 transition-colors uppercase px-4"
          placeholder="ABC-123"
          @keydown.enter="submitManual"
          @input="manualCode = (manualCode as any).toUpperCase()"
        />
        <button
          class="px-5 h-12 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50"
          :disabled="loading || !manualCode.trim()"
          @click="submitManual"
        >
          Go
        </button>
      </div>
    </div>

    <button
      class="w-full py-3 text-sm text-slate-500 hover:text-slate-900 transition-colors"
      @click="emit('back')"
    >
      Back
    </button>
  </div>
</template>

<style scoped>
@keyframes scanline {
  0%   { top: 6px; }
  50%  { top: calc(100% - 6px); }
  100% { top: 6px; }
}
.scan-line {
  position: absolute;
  animation: scanline 2s ease-in-out infinite;
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
