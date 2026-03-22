<template>
  <footer class="border-t border-slate-100 py-12 px-6 bg-white">
    <div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <div
          class="h-6 w-6 rounded-md flex items-center justify-center"
          style="background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%)"
        >
          <span class="text-white font-bold text-[10px]">M</span>
        </div>
        <span class="font-bold text-slate-900 text-sm">muyenzi</span>
      </div>
      <p class="text-sm text-slate-400">© {{ new Date().getFullYear() }} Muyenzi. All rights reserved.</p>
      <div class="flex items-center gap-6">
        <NuxtLink to="/features" class="text-sm text-slate-500 hover:text-slate-900">Features</NuxtLink>
        <NuxtLink to="/pricing" class="text-sm text-slate-500 hover:text-slate-900">Pricing</NuxtLink>
        <NuxtLink to="/contact" class="text-sm text-slate-500 hover:text-slate-900">Contact</NuxtLink>
      </div>
    </div>
  </footer>
</template>
