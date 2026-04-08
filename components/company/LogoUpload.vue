<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  currentLogoUrl?: string | null
}>()

const emit = defineEmits<{
  upload: [logoUrl: string]
  delete: []
}>()

const fileInput = ref<HTMLInputElement>()
const selectedFile = ref<File | null>(null)
const preview = ref<string>('')
const loading = ref(false)
const error = ref<string | null>(null)

const toast = useToast()

function onFileSelected(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  error.value = null

  // Validate file type
  if (!file.type.startsWith('image/')) {
    error.value = 'Please select an image file'
    return
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    error.value = 'File size must be less than 5MB'
    return
  }

  selectedFile.value = file

  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    preview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

async function uploadLogo() {
  if (!selectedFile.value) return

  loading.value = true
  error.value = null

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)

    const response = await $fetch<{ logo_url: string }>('/api/company/logo', {
      method: 'POST',
      body: formData,
    })

    emit('upload', response.logo_url)
    selectedFile.value = null
    preview.value = ''
    if (fileInput.value) fileInput.value.value = ''

    toast.add({
      title: 'Logo uploaded successfully',
      color: 'green',
    })
  } catch (e: any) {
    error.value = e.data?.statusMessage || 'Failed to upload logo'
    toast.add({
      title: 'Upload failed',
      description: error.value,
      color: 'red',
    })
  } finally {
    loading.value = false
  }
}

async function deleteLogo() {
  loading.value = true
  error.value = null

  try {
    await $fetch('/api/company/logo', {
      method: 'DELETE',
    })

    emit('delete')
    selectedFile.value = null
    preview.value = ''
    if (fileInput.value) fileInput.value.value = ''

    toast.add({
      title: 'Logo removed',
      color: 'green',
    })
  } catch (e: any) {
    error.value = e.data?.statusMessage || 'Failed to delete logo'
    toast.add({
      title: 'Delete failed',
      description: error.value,
      color: 'red',
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Current Logo Preview -->
    <div v-if="currentLogoUrl && !preview" class="border-2 border-dashed border-slate-300 rounded-lg p-4">
      <p class="text-sm text-slate-600 mb-3">Current Logo</p>
      <div class="flex items-center justify-center h-32 bg-slate-50 rounded">
        <img :src="currentLogoUrl" alt="Current logo" class="h-full max-w-full object-contain" />
      </div>
    </div>

    <!-- New Preview -->
    <div v-if="preview" class="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50">
      <p class="text-sm text-blue-600 mb-3">Preview</p>
      <div class="flex items-center justify-center h-32 bg-white rounded">
        <img :src="preview" alt="Preview" class="h-full max-w-full object-contain" />
      </div>
    </div>

    <!-- File Input -->
    <div class="space-y-2">
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        class="hidden"
        @change="onFileSelected"
      />
      <UButton
        color="gray"
        variant="outline"
        block
        @click="fileInput?.click()"
        :disabled="loading"
      >
        <UIcon name="i-lucide-image" class="w-4 h-4 mr-2" />
        {{ selectedFile ? 'Change' : 'Select' }} Logo
      </UButton>
      <p class="text-xs text-slate-500">
        Supported formats: JPEG, PNG, WebP, SVG (max 5MB)
      </p>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="flex gap-2 items-start p-3 bg-red-50 border border-red-200 rounded">
      <UIcon name="i-lucide-alert-circle" class="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
      <p class="text-sm text-red-600">{{ error }}</p>
    </div>

    <!-- Action Buttons -->
    <div class="flex gap-2">
      <UButton
        v-if="selectedFile"
        :loading="loading"
        block
        @click="uploadLogo"
      >
        Upload Logo
      </UButton>
      <UButton
        v-if="currentLogoUrl && !selectedFile"
        color="red"
        variant="outline"
        block
        :loading="loading"
        @click="deleteLogo"
      >
        Remove Logo
      </UButton>
    </div>
  </div>
</template>
