const kioskKey = ref<string | null>(null)

interface StoredKey {
  key: string
  week: number
}

function currentWeekBucket(): number {
  return Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
}

function storageKey(siteId: string) {
  return `kiosk_key_${siteId}`
}

export function useKioskKey() {
  function load(siteId: string) {
    if (!process.client) return
    try {
      const raw = localStorage.getItem(storageKey(siteId))
      if (!raw) { kioskKey.value = null; return }
      const stored: StoredKey = JSON.parse(raw)
      // Accept current and previous week bucket (mirrors server-side validation window)
      const bucket = currentWeekBucket()
      kioskKey.value = (stored.week === bucket || stored.week === bucket - 1) ? stored.key : null
    } catch {
      kioskKey.value = null
    }
  }

  function save(siteId: string, key: string) {
    if (!process.client) return
    const stored: StoredKey = { key, week: currentWeekBucket() }
    localStorage.setItem(storageKey(siteId), JSON.stringify(stored))
    kioskKey.value = key
  }

  function clear(siteId: string) {
    if (!process.client) return
    localStorage.removeItem(storageKey(siteId))
    kioskKey.value = null
  }

  return { kioskKey, load, save, clear }
}
