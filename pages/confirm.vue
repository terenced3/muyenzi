<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const errorMsg = ref<string | null>(null)

onMounted(async () => {
  // Supabase sets error params in the URL when a link is expired or already used
  const urlError = (route.query.error_description as string) || (route.query.error as string)
  if (urlError) {
    errorMsg.value = decodeURIComponent(urlError.replace(/\+/g, ' '))
    return
  }

  await navigateTo('/dashboard')
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50">
    <!-- Error state: expired or invalid token -->
    <UCard v-if="errorMsg" class="max-w-sm w-full mx-4">
      <template #header>
        <div class="text-center py-2">
          <div class="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
            <UIcon name="i-lucide-link-2-off" class="h-6 w-6 text-red-500" />
          </div>
          <h1 class="font-bold text-slate-900 text-xl">Link expired</h1>
          <p class="text-sm text-slate-500 mt-1">{{ errorMsg }}</p>
        </div>
      </template>
      <div class="space-y-2">
        <UButton block to="/login" variant="outline">Go to sign in</UButton>
        <p class="text-xs text-center text-slate-400">
          Need a new link? Sign in and request another confirmation email, or contact your team admin.
        </p>
      </div>
    </UCard>

    <!-- Loading state -->
    <div v-else class="text-center">
      <UIcon name="i-lucide-loader-2" class="h-8 w-8 text-indigo-500 animate-spin mx-auto mb-3" />
      <p class="text-slate-500 text-sm">Verifying your account…</p>
    </div>
  </div>
</template>
