<script setup lang="ts">
import type { VisitWithRelations } from '~/types/database'

defineProps<{
  visits: VisitWithRelations[]
  loading?: boolean
}>()

const STATUS_COLORS: Record<string, string> = {
  expected: 'blue',
  checked_in: 'green',
  checked_out: 'gray',
  cancelled: 'red',
  no_show: 'yellow',
}

const STATUS_LABELS: Record<string, string> = {
  expected: 'Expected',
  checked_in: 'Checked In',
  checked_out: 'Checked Out',
  cancelled: 'Cancelled',
  no_show: 'No Show',
}
</script>

<template>
  <div v-if="loading" class="py-8 text-center text-gray-400 text-sm animate-pulse">Loading…</div>

  <div v-else-if="visits.length === 0" class="py-12 text-center">
    <p class="text-sm text-gray-400">No visits yet</p>
  </div>

  <div v-else class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-gray-100">
          <th v-for="col in ['Visitor', 'Site', 'Check In', 'Status']" :key="col"
            class="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-400"
          >
            {{ col }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(visit, i) in visits"
          :key="visit.id"
          class="hover:bg-gray-50 transition-colors"
          :class="{ 'border-b border-gray-100': i < visits.length - 1 }"
        >
          <td class="px-4 py-3">
            <p class="font-semibold text-gray-900">{{ visit.visitor.full_name }}</p>
            <p v-if="visit.visitor.company_name" class="text-xs text-gray-400">{{ visit.visitor.company_name }}</p>
          </td>
          <td class="px-4 py-3 text-gray-500 text-xs">{{ visit.site.name }}</td>
          <td class="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
            {{ visit.check_in_at ? formatDateTime(visit.check_in_at) : '—' }}
          </td>
          <td class="px-4 py-3">
            <UBadge :color="STATUS_COLORS[visit.status]" variant="soft" size="sm">
              {{ STATUS_LABELS[visit.status] }}
            </UBadge>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
