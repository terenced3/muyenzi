<script setup lang="ts">
import QRCode from 'qrcode'

const props = defineProps<{
  data: string
  size?: number
}>()

const dataUrl = ref('')

onMounted(async () => {
  dataUrl.value = await QRCode.toDataURL(props.data, {
    width: props.size ?? 200,
    margin: 1,
    color: { dark: '#0f172a', light: '#ffffff' },
  })
})
</script>

<template>
  <div class="flex items-center justify-center">
    <img v-if="dataUrl" :src="dataUrl" :width="size ?? 200" :height="size ?? 200" alt="QR Code" class="rounded-lg" />
    <div v-else class="bg-gray-100 rounded-lg animate-pulse" :style="{ width: `${size ?? 200}px`, height: `${size ?? 200}px` }" />
  </div>
</template>
