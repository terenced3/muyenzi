<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const siteId = route.params.siteId as string

const config = useRuntimeConfig()
const { createClient } = await import('@supabase/supabase-js')

type KioskSite = {
  id: string
  name: string
  address: string | null
  company_id: string
  company: { name: string; logo_url: string | null } | null
}

const site = ref<KioskSite | null>(null)

onMounted(async () => {
  const supabase = createClient(
    config.public.supabaseUrl,
    process.env.NUXT_SUPABASE_SERVICE_KEY || '',
  )
  const { data } = await supabase
    .from('sites')
    .select('id, name, address, company_id, company:companies(name, logo_url)')
    .eq('id', siteId)
    .single()

  if (!data) {
    await navigateTo('/404')
    return
  }
  site.value = data as KioskSite
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
