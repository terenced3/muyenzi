export const useOfflineSync = () => {
  const isOnline = ref(navigator.onLine)
  const isSyncing = ref(false)
  const pendingVisitsCount = ref(0)
  const lastSyncTime = ref<string | null>(null)
  let syncInterval: ReturnType<typeof setInterval> | null = null

  onMounted(async () => {
    // Initialize DB
    await initDB()

    // Listen for online/offline events
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Load initial pending count
    await updatePendingCount()

    // Start sync interval (every 5 seconds when online)
    syncInterval = setInterval(async () => {
      if (isOnline.value && !isSyncing.value) {
        await syncPendingVisits()
      }
    }, 5000)
  })

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
    if (syncInterval) clearInterval(syncInterval)
  })

  function handleOnline() {
    isOnline.value = true
    console.log('🟢 Connection restored')
    // Try to sync immediately when coming back online
    syncPendingVisits()
  }

  function handleOffline() {
    isOnline.value = false
    console.log('🔴 Connection lost')
  }

  async function updatePendingCount() {
    const pending = await getPendingVisits()
    pendingVisitsCount.value = pending.length
  }

  async function saveVisitOffline(visitData: any) {
    try {
      await savePendingVisit(visitData)
      await updatePendingCount()
      return { success: true }
    } catch (error) {
      console.error('Failed to save visit offline:', error)
      return { success: false, error }
    }
  }

  async function syncPendingVisits() {
    if (isSyncing.value || !isOnline.value) return

    const pending = await getPendingVisits()
    if (pending.length === 0) return

    isSyncing.value = true
    const supabase = useSupabaseClient()
    let syncedCount = 0

    for (const visit of pending) {
      try {
        // Try to sync each visit
        const { error } = await supabase
          .from('visits')
          .insert({
            company_id: visit.company_id,
            site_id: visit.site_id,
            visitor_id: visit.visitor_id,
            host_id: visit.host_id || null,
            purpose: visit.purpose || null,
            status: visit.status,
            check_in_at: visit.check_in_at || new Date().toISOString(),
            check_out_at: visit.check_out_at || null,
            access_code: visit.access_code,
            qr_code_data: visit.qr_code_data,
            visit_date: visit.visit_date,
            custom_field_values: visit.custom_field_values || null,
            notes: visit.notes || null,
          })

        if (!error) {
          // Mark as synced
          await markVisitSynced(visit.id)
          syncedCount++
          console.log(`✅ Synced visit ${syncedCount}/${pending.length}`)
        } else {
          console.warn(`⚠️ Failed to sync visit ${visit.id}:`, error.message)
        }
      } catch (e) {
        console.error(`❌ Error syncing visit ${visit.id}:`, e)
      }
    }

    isSyncing.value = false
    lastSyncTime.value = new Date().toISOString()
    await updatePendingCount()

    if (syncedCount > 0) {
      console.log(`🎉 Successfully synced ${syncedCount} visits`)
    }
  }

  return {
    isOnline: readonly(isOnline),
    isSyncing: readonly(isSyncing),
    pendingVisitsCount: readonly(pendingVisitsCount),
    lastSyncTime: readonly(lastSyncTime),
    saveVisitOffline,
    syncPendingVisits,
    updatePendingCount,
  }
}
