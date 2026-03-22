<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <div
          class="h-10 w-10 rounded-xl flex items-center justify-center mx-auto mb-3"
          style="background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%); box-shadow: 0 0 20px rgba(99,102,241,0.3)"
        >
          <span class="text-white font-bold text-sm">M</span>
        </div>
        <p class="font-bold text-slate-900 text-lg">muyenzi</p>
      </div>
      <slot />
    </div>
  </div>
</template>
