<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
useHead({ title: 'New Invitation – Muyenzi' })

const supabase = useSupabaseClient()
const { user } = useUser()

const sites = ref<{ id: string; name: string }[]>([])
const hosts = ref<{ id: string; full_name: string }[]>([])

onMounted(async () => {
  if (!user.value) return
  const [{ data: s }, { data: h }] = await Promise.all([
    supabase.from('sites').select('id, name').eq('company_id', user.value.company_id),
    supabase.from('users').select('id, full_name').eq('company_id', user.value.company_id),
  ])
  sites.value = s ?? []
  hosts.value = h ?? []
})
</script>

<template>
  <div class="flex flex-col h-full">
    <LayoutTopbar title="New Invitation" description="Pre-register a visitor" />

    <div class="flex-1 overflow-y-auto p-6">
      <UButton variant="ghost" size="sm" to="/dashboard/invitations" icon="i-lucide-arrow-left" class="mb-6 -ml-2">
        Back
      </UButton>
      <InvitationsInvitationForm
        v-if="user"
        :company-id="user.company_id"
        :host-id="user.id"
        :sites="sites"
        :hosts="hosts"
      />
    </div>
  </div>
</template>
