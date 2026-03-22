<script setup lang="ts">
defineProps<{ companyId: string }>()

function download(format: 'csv' | 'pdf', companyId: string) {
  window.open(`/api/export/${format}?company_id=${companyId}`, '_blank')
}

const items = (companyId: string) => [
  [
    { label: 'Export as CSV', icon: 'i-lucide-file-spreadsheet', click: () => download('csv', companyId) },
    { label: 'Export as PDF', icon: 'i-lucide-file-text', click: () => download('pdf', companyId) },
  ],
]
</script>

<template>
  <UDropdown :items="items(companyId)" :popper="{ placement: 'bottom-end' }">
    <UButton variant="outline" color="gray" icon="i-lucide-download" size="sm">Export</UButton>
  </UDropdown>
</template>
