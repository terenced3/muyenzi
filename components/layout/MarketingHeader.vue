<script setup lang="ts">
const navLinks = [
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/contact', label: 'Contact' },
]
</script>

<template>
  <header class="border-b border-slate-100 bg-white/90 backdrop-blur-sm sticky top-0 z-50">
    <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
      <NuxtLink to="/" class="flex items-center gap-2.5">
        <div
          class="h-8 w-8 rounded-lg flex items-center justify-center"
          style="background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%)"
        >
          <span class="text-white font-bold text-xs">M</span>
        </div>
        <span class="font-bold text-slate-900">muyenzi</span>
      </NuxtLink>

      <nav class="hidden md:flex items-center gap-8">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.href"
          :to="link.href"
          class="text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <div class="flex items-center gap-3">
        <UButton variant="ghost" color="gray" to="/login" size="sm">Sign in</UButton>
        <UButton to="/signup" size="sm">Get started</UButton>
      </div>
    </div>
  </header>
</template>
