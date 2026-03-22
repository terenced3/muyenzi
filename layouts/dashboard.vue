<script setup lang="ts">
const { fetchProfile } = useUser()

onMounted(() => fetchProfile())
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-slate-50">
    <LayoutSidebar />
    <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
      <slot />
    </div>
  </div>
</template>
