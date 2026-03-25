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

onMounted(async () => {
  try {
    const data = await $fetch<KioskSite>(`/api/kiosk/${siteId}/site`)
    site.value = data
  } catch {
    await navigateTo('/404')
  }
})
</script>

<template>
  <div>
    <div v-if="!site" class="min-h-screen bg-slate-900 flex items-center justify-center">
      <UIcon name="i-lucide-loader-2" class="h-8 w-8 text-white animate-spin" />
    </div>
    <KioskKioskShell v-else :site="site" />
  </div>
</template>
