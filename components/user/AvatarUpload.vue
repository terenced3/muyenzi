<script setup lang="ts">
const props = defineProps<{ currentAvatarUrl?: string | null; name?: string }>()
const emit = defineEmits<{ upload: [url: string]; delete: [] }>()

const fileInput = ref<HTMLInputElement>()
const preview = ref('')
const selectedFile = ref<File | null>(null)
const loading = ref(false)
const toast = useToast()

function initials(n: string) {
  return (n ?? '').split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) || '?'
}

function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) { toast.add({ title: 'Image files only', color: 'red' }); return }
  if (file.size > 3 * 1024 * 1024) { toast.add({ title: 'Max 3MB', color: 'red' }); return }
  selectedFile.value = file
  const reader = new FileReader()
  reader.onload = e => { preview.value = e.target?.result as string }
  reader.readAsDataURL(file)
}

async function upload() {
  if (!selectedFile.value) return
  loading.value = true
  try {
    const form = new FormData()
    form.append('file', selectedFile.value)
    const res = await $fetch<{ avatar_url: string }>('/api/users/avatar', { method: 'POST', body: form })
    emit('upload', res.avatar_url)
    preview.value = ''
    selectedFile.value = null
    if (fileInput.value) fileInput.value.value = ''
    toast.add({ title: 'Avatar updated', color: 'green' })
  } catch (e: any) {
    toast.add({ title: 'Upload failed', description: e.data?.statusMessage ?? 'Error', color: 'red' })
  } finally { loading.value = false }
}

async function remove() {
  loading.value = true
  try {
    await $fetch('/api/users/avatar', { method: 'DELETE' })
    emit('delete')
    toast.add({ title: 'Avatar removed', color: 'green' })
  } catch (e: any) {
    toast.add({ title: 'Failed', description: e.data?.statusMessage ?? 'Error', color: 'red' })
  } finally { loading.value = false }
}
</script>

<template>
  <div class="flex items-start gap-5">
    <!-- Avatar preview -->
    <div class="shrink-0">
      <div
        class="h-20 w-20 rounded-2xl overflow-hidden flex items-center justify-center bg-indigo-100 ring-2 ring-indigo-200"
      >
        <img
          v-if="preview || currentAvatarUrl"
          :src="preview || currentAvatarUrl!"
          class="h-full w-full object-cover"
          alt="Avatar"
        />
        <span v-else class="text-indigo-600 font-bold text-xl">{{ initials(name ?? '') }}</span>
      </div>
    </div>

    <!-- Controls -->
    <div class="flex-1 space-y-3">
      <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onFile" />

      <div class="flex flex-wrap gap-2">
        <UButton
          size="sm"
          variant="outline"
          icon="i-lucide-upload"
          :disabled="loading"
          @click="fileInput?.click()"
        >
          {{ selectedFile ? 'Change photo' : 'Upload photo' }}
        </UButton>
        <UButton
          v-if="selectedFile"
          size="sm"
          icon="i-lucide-check"
          :loading="loading"
          @click="upload"
        >
          Save
        </UButton>
        <UButton
          v-if="(currentAvatarUrl && !selectedFile)"
          size="sm"
          variant="ghost"
          color="red"
          icon="i-lucide-trash-2"
          :loading="loading"
          @click="remove"
        >
          Remove
        </UButton>
      </div>
      <p class="text-xs text-gray-400">JPEG, PNG or WebP · max 3MB</p>
    </div>
  </div>
</template>
