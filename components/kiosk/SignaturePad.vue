<script setup lang="ts">
const props = defineProps<{ disabled?: boolean }>()
const emit = defineEmits<{ (e: 'signed', data: string): void; (e: 'cleared'): void }>()

const canvas = ref<HTMLCanvasElement | null>(null)
const isDrawing = ref(false)
const hasSigned = ref(false)
let ctx: CanvasRenderingContext2D | null = null

onMounted(() => {
  if (!canvas.value) return
  ctx = canvas.value.getContext('2d')!
  ctx.strokeStyle = '#1e1b4b'
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  resizeCanvas()
})

function resizeCanvas() {
  if (!canvas.value || !ctx) return
  const rect = canvas.value.getBoundingClientRect()
  canvas.value.width = rect.width * window.devicePixelRatio
  canvas.value.height = rect.height * window.devicePixelRatio
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
  ctx.strokeStyle = '#1e1b4b'
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
}

function getPos(e: MouseEvent | TouchEvent): { x: number; y: number } {
  const rect = canvas.value!.getBoundingClientRect()
  if ('touches' in e) {
    return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
  }
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

function startDraw(e: MouseEvent | TouchEvent) {
  if (props.disabled) return
  e.preventDefault()
  isDrawing.value = true
  const pos = getPos(e)
  ctx!.beginPath()
  ctx!.moveTo(pos.x, pos.y)
}

function draw(e: MouseEvent | TouchEvent) {
  if (!isDrawing.value || props.disabled) return
  e.preventDefault()
  const pos = getPos(e)
  ctx!.lineTo(pos.x, pos.y)
  ctx!.stroke()
  hasSigned.value = true
}

function endDraw() {
  if (!isDrawing.value) return
  isDrawing.value = false
  if (hasSigned.value) {
    emit('signed', canvas.value!.toDataURL('image/png'))
  }
}

function clear() {
  if (!canvas.value || !ctx) return
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  hasSigned.value = false
  emit('cleared')
}

defineExpose({ clear, hasSigned })
</script>

<template>
  <div class="space-y-2">
    <div
      class="relative rounded-xl border-2 bg-white overflow-hidden"
      :class="disabled ? 'border-gray-200 opacity-50 cursor-not-allowed' : 'border-indigo-200'"
      style="height: 160px"
    >
      <canvas
        ref="canvas"
        class="w-full h-full touch-none"
        :class="{ 'cursor-crosshair': !disabled, 'cursor-not-allowed': disabled }"
        @mousedown="startDraw"
        @mousemove="draw"
        @mouseup="endDraw"
        @mouseleave="endDraw"
        @touchstart="startDraw"
        @touchmove="draw"
        @touchend="endDraw"
      />
      <div
        v-if="!hasSigned && !disabled"
        class="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <p class="text-sm text-gray-300 select-none">Sign here</p>
      </div>
    </div>
    <div class="flex justify-end">
      <button
        type="button"
        class="text-xs text-gray-400 hover:text-gray-600 underline"
        :disabled="!hasSigned || disabled"
        @click="clear"
      >
        Clear
      </button>
    </div>
  </div>
</template>
