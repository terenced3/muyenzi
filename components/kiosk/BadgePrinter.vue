<script setup lang="ts">
import type { VisitWithRelations } from '~/types/database'

const props = defineProps<{
  visit: VisitWithRelations | any
  printerEnabled?: boolean
  logoUrl?: string | null
  badgeSettings?: {
    accent_color?: string
    header_text?: string
    show_purpose?: boolean
    show_access_code?: boolean
  } | null
}>()

const { kioskKey } = useKioskKey()
const badgeRef = ref<HTMLElement | null>(null)

const accentColor = computed(() => props.badgeSettings?.accent_color || '#1f2937')
const headerText = computed(() => props.badgeSettings?.header_text?.trim() || 'VISITOR')
const showPurpose = computed(() => props.badgeSettings?.show_purpose === true)
const showAccessCode = computed(() => props.badgeSettings?.show_access_code !== false)

async function printBadge() {
  if (!badgeRef.value) return

  try {
    await $fetch('/api/kiosk/print-badge', {
      method: 'POST',
      headers: { 'x-kiosk-key': kioskKey.value ?? '' },
      body: { site_id: props.visit.site_id, visit_id: props.visit.id },
    }).catch(() => console.warn('Failed to log print job'))
  } catch (e) {
    console.warn('Print logging error:', e)
  }

  const printWindow = window.open('', '', 'width=400,height=600')
  if (!printWindow) return

  const badgeHTML = badgeRef.value.innerHTML
  const color = accentColor.value

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Visitor Badge</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; width: 80mm; padding: 4mm; background: white; }
          @media print {
            body { margin: 0; padding: 0; width: 80mm; }
            .badge { break-inside: avoid; }
          }
          .badge {
            border: 2px solid ${color};
            border-radius: 8px;
            padding: 12px;
            text-align: center;
            background: white;
            width: 100%;
          }
          .badge-header { font-size: 10px; color: ${color}; margin-bottom: 8px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; }
          .visitor-name { font-size: 16px; font-weight: bold; color: #1f2937; margin-bottom: 6px; word-break: break-word; line-height: 1.3; }
          .qr-container { margin: 8px 0; text-align: center; }
          .qr-container img { width: 100%; max-width: 120px; height: auto; }
          .badge-details { font-size: 9px; color: #374151; margin-top: 8px; text-align: center; border-top: 1px solid ${color}33; padding-top: 6px; }
          .detail-row { margin: 3px 0; line-height: 1.4; }
          .label { font-weight: bold; font-size: 8px; }
          .value { font-size: 9px; }
          .access-code { font-family: 'Courier New', monospace; font-weight: bold; font-size: 11px; letter-spacing: 1px; margin: 4px 0; }
        </style>
      </head>
      <body>
        ${badgeHTML}
        <script>
          window.print();
          window.onafterprint = function() { window.close(); };
        <\/script>
      </body>
    </html>
  `)
  printWindow.document.close()
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return dateStr
  }
}
</script>

<template>
  <div>
    <!-- Badge template captured for printing -->
    <div
      ref="badgeRef"
      class="badge"
      :style="`width: 80mm; padding: 3mm; background: white; border: 2px solid ${accentColor}; border-radius: 2mm; text-align: center; font-family: Arial, sans-serif;`"
    >
      <!-- Logo or header text -->
      <div v-if="logoUrl" style="margin-bottom: 6px; text-align: center;">
        <img :src="logoUrl" alt="Company logo" style="max-height: 28px; max-width: 100%; object-fit: contain; display: inline-block;" />
      </div>
      <div v-else :style="`font-size: 9px; color: ${accentColor}; margin-bottom: 6px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;`">
        {{ headerText }}
      </div>

      <div style="font-size: 15px; font-weight: bold; color: #1f2937; margin-bottom: 6px; word-break: break-word;">
        {{ visit.visitor?.full_name || 'Visitor' }}
      </div>

      <!-- QR Code -->
      <div style="margin: 6px 0; text-align: center;">
        <div style="display: inline-block; padding: 4px; background: white; border: 1px solid #e5e7eb; border-radius: 2px;">
          <SharedQRCodeDisplay :data="visit.qr_code_data" :size="80" />
        </div>
      </div>

      <!-- Details -->
      <div :style="`font-size: 8px; color: #374151; margin-top: 6px; border-top: 1px solid ${accentColor}33; padding-top: 4px;`">
        <div style="margin: 2px 0;">
          <span style="font-weight: bold; font-size: 7px;">HOST:</span>
          <span style="font-size: 8px;">{{ visit.host?.full_name || 'N/A' }}</span>
        </div>

        <div style="margin: 2px 0;">
          <span style="font-weight: bold; font-size: 7px;">DATE:</span>
          <span style="font-size: 8px;">{{ formatDate(visit.visit_date || visit.created_at) }}</span>
        </div>

        <div v-if="showPurpose && visit.purpose" style="margin: 2px 0;">
          <span style="font-weight: bold; font-size: 7px;">PURPOSE:</span>
          <span style="font-size: 8px;">{{ visit.purpose }}</span>
        </div>

        <div v-if="showAccessCode" style="margin: 3px 0; padding: 2px 0;">
          <span style="font-weight: bold; font-size: 7px;">CODE:</span>
          <div style="font-family: 'Courier New', monospace; font-weight: bold; font-size: 10px; letter-spacing: 1px; margin-top: 1px;">
            {{ visit.access_code }}
          </div>
        </div>
      </div>
    </div>

    <!-- Print Button -->
    <button
      class="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg font-semibold transition-colors"
      :style="`background-color: ${accentColor};`"
      @click="printBadge"
    >
      <UIcon name="i-lucide-printer" class="h-4 w-4" />
      Print Badge
    </button>
  </div>
</template>

<style scoped>
.badge {
  page-break-inside: avoid;
}

@media print {
  body {
    margin: 0;
    padding: 0;
  }
}
</style>
