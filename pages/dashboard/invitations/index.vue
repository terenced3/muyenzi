<script setup lang="ts">
import type { VisitWithRelations } from '~/types/database'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Invitations – Muyenzi' })

const supabase = useSupabaseClient()
const { user } = useUser()

const visits = ref<VisitWithRelations[]>([])
const loading = ref(true)

onMounted(async () => {
  if (!user.value) return
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('visits')
    .select('*, visitor:visitors(*), site:sites(*), host:users(*)')
    .eq('company_id', user.value.company_id)
    .in('status', ['expected'])
    .gte('visit_date', today)
    .order('visit_date', { ascending: true })
    .limit(50)
  visits.value = (data ?? []) as VisitWithRelations[]
  loading.value = false
})
</script>

<template>
  <div class="flex flex-col h-full">
    <LayoutTopbar title="Invitations" description="Upcoming pre-registered visits" />

    <div class="flex-1 overflow-y-auto p-6 space-y-4">
      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-400">{{ visits.length }} upcoming invitation{{ visits.length !== 1 ? 's' : '' }}</p>
        <UButton to="/dashboard/invitations/new" icon="i-lucide-plus">New Invitation</UButton>
      </div>

      <!-- Empty state -->
      <div v-if="!loading && visits.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
        <UIcon name="i-lucide-calendar-check" class="h-12 w-12 text-gray-300 mb-4" />
        <h3 class="font-semibold text-gray-900 mb-1">No upcoming invitations</h3>
        <p class="text-sm text-gray-500 mb-4">Pre-register a visitor to send them a QR code and access code.</p>
        <UButton to="/dashboard/invitations/new" icon="i-lucide-plus">New Invitation</UButton>
      </div>

      <!-- Table -->
      <UCard v-else :ui="{ body: { padding: '' } }">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100 bg-gray-50">
                <th v-for="col in ['Visitor', 'Host', 'Site', 'Visit Date', 'Access Code']" :key="col"
                  class="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-gray-400"
                >
                  {{ col }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="visit in visits" :key="visit.id" class="hover:bg-gray-50">
                <td class="px-4 py-3">
                  <p class="font-medium text-gray-900">{{ visit.visitor.full_name }}</p>
                  <p v-if="visit.visitor.email" class="text-xs text-gray-400">{{ visit.visitor.email }}</p>
                </td>
                <td class="px-4 py-3 text-gray-500">{{ visit.host?.full_name ?? '—' }}</td>
                <td class="px-4 py-3 text-gray-500">{{ visit.site.name }}</td>
                <td class="px-4 py-3 text-gray-500">{{ formatDate(visit.visit_date) }}</td>
                <td class="px-4 py-3">
                  <code class="text-xs bg-gray-100 rounded px-1.5 py-0.5 font-mono font-semibold text-gray-600">
                    {{ visit.access_code }}
                  </code>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="loading" class="p-8 text-center text-gray-400 text-sm">Loading…</div>
        </div>
      </UCard>
    </div>
  </div>
</template>
