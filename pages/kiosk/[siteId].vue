<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const siteId = route.params.siteId as string

type KioskSite = {
  id: string
  name: string
  address: string | null
  company_id: string
  company: { name: string; logo_url: string | null } | null
}

const site = ref<KioskSite | null>(null)
const loadError = ref(false)

onMounted(async () => {
  try {
    const data = await $fetch<KioskSite>(`/api/kiosk/${siteId}/site`)
    site.value = data
  } catch {
    loadError.value = true
  }
})
</script>

<template>
  <div class="min-h-screen bg-slate-900 flex items-center justify-center">
    <div v-if="loadError" class="text-center">
      <UIcon name="i-lucide-alert-circle" class="h-12 w-12 text-red-400 mx-auto mb-4" />
      <p class="text-white text-lg font-semibold">Site not found</p>
      <p class="text-slate-400 text-sm mt-1">This kiosk link may be invalid or the site was removed.</p>
    </div>
    <UIcon v-else-if="!site" name="i-lucide-loader-2" class="h-8 w-8 text-white animate-spin" />
    <KioskShell v-else :site="site" />
  </div>
</template>
