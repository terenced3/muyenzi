<script setup lang="ts">
import type { VisitWithRelations } from '~/types/database'

const props = defineProps<{
  visit: VisitWithRelations | any
  printerEnabled?: boolean
}>()

const badgeRef = ref<HTMLElement | null>(null)

async function printBadge() {
  if (!badgeRef.value) return

  // Log the print job to the server
  try {
    await $fetch('/api/kiosk/print-badge', {
      method: 'POST',
      body: {
        site_id: props.visit.site_id,
        visit_id: props.visit.id,
      },
    }).catch(() => {
      // Silently fail server logging - don't block printing
      console.warn('Failed to log print job')
    })
  } catch (e) {
    console.warn('Print logging error:', e)
  }

  // Open print dialog
  const printWindow = window.open('', '', 'width=400,height=600')
  if (!printWindow) return

  const badgeHTML = badgeRef.value.innerHTML
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Visitor Badge</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            width: 80mm;
            padding: 4mm;
            background: white;
          }
          @media print {
            body { margin: 0; padding: 0; width: 80mm; }
            .badge { break-inside: avoid; }
          }
          .badge {
            border: 2px solid #1f2937;
            border-radius: 8px;
            padding: 12px;
            text-align: center;
            background: white;
            width: 100%;
          }
          .badge-header {
            font-size: 10px;
            color: #6b7280;
            margin-bottom: 8px;
            text-transform: uppercase;
            font-weight: bold;
            letter-spacing: 0.5px;
          }
          .visitor-name {
            font-size: 16px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 6px;
            word-break: break-word;
            line-height: 1.3;
          }
          .qr-container {
            margin: 8px 0;
            text-align: center;
          }
          .qr-container img {
            width: 100%;
            max-width: 120px;
            height: auto;
          }
          .badge-details {
            font-size: 9px;
            color: #374151;
            margin-top: 8px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
            padding-top: 6px;
          }
          .detail-row {
            margin: 3px 0;
            line-height: 1.4;
          }
          .label {
            font-weight: bold;
            font-size: 8px;
          }
          .value {
            font-size: 9px;
          }
          .access-code {
            font-family: 'Courier New', monospace;
            font-weight: bold;
            font-size: 11px;
            letter-spacing: 1px;
            margin: 4px 0;
          }
        </style>
      </head>
      <body>
        ${badgeHTML}
        <script>
          window.print();
          window.onafterprint = function() { window.close(); };
        </script>
      </body>
    </html>
  `)
  printWindow.document.close()
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return dateStr
  }
}
</script>

<template>
  <div>
    <!-- Badge Template (for printing) -->
    <div
      ref="badgeRef"
      class="badge"
      style="width: 80mm; padding: 3mm; background: white; border: 2px solid #1f2937; border-radius: 2mm; text-align: center; font-family: Arial, sans-serif;"
    >
      <div style="font-size: 9px; color: #6b7280; margin-bottom: 6px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.3px;">
        VISITOR BADGE
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
      <div style="font-size: 8px; color: #374151; margin-top: 6px; border-top: 1px solid #e5e7eb; padding-top: 4px;">
        <div style="margin: 2px 0;">
          <span style="font-weight: bold; font-size: 7px;">HOST:</span>
          <span style="font-size: 8px;">{{ visit.host?.full_name || 'N/A' }}</span>
        </div>

        <div style="margin: 2px 0;">
          <span style="font-weight: bold; font-size: 7px;">DATE:</span>
          <span style="font-size: 8px;">{{ formatDate(visit.visit_date || visit.created_at) }}</span>
        </div>

        <div style="margin: 3px 0; padding: 2px 0;">
          <span style="font-weight: bold; font-size: 7px;">CODE:</span>
          <div style="font-family: 'Courier New', monospace; font-weight: bold; font-size: 10px; letter-spacing: 1px; margin-top: 1px;">
            {{ visit.access_code }}
          </div>
        </div>
      </div>
    </div>

    <!-- Print Button -->
    <button
      @click="printBadge"
      class="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors"
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
