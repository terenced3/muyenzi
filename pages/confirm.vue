<script setup lang="ts">
definePageMeta({ layout: false })

// @nuxtjs/supabase handles the PKCE token exchange automatically.
// After confirmation, redirect to dashboard.
onMounted(async () => {
  await navigateTo('/dashboard')
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50">
    <div class="text-center">
      <UIcon name="i-lucide-loader-2" class="h-8 w-8 text-indigo-500 animate-spin mx-auto mb-3" />
      <p class="text-slate-500 text-sm">Verifying your account…</p>
    </div>
  </div>
</template>
