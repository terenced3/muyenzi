// IndexedDB helpers for offline storage
const DB_NAME = 'muyenzi_kiosk'
const STORE_VISITS = 'pending_visits'
const STORE_CACHE = 'qr_cache'

let db: IDBDatabase | null = null

export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (e) => {
      const database = (e.target as IDBOpenDBRequest).result

      // Store for offline visits
      if (!database.objectStoreNames.contains(STORE_VISITS)) {
        const store = database.createObjectStore(STORE_VISITS, { keyPath: 'id', autoIncrement: true })
        store.createIndex('status', 'status', { unique: false })
        store.createIndex('created_at', 'created_at', { unique: false })
      }

      // Store for cached QR images
      if (!database.objectStoreNames.contains(STORE_CACHE)) {
        database.createObjectStore(STORE_CACHE, { keyPath: 'key', autoIncrement: false })
      }
    }
  })
}

export async function savePendingVisit(visitData: any) {
  const database = db || (await initDB())
  return new Promise((resolve, reject) => {
    const tx = database.transaction([STORE_VISITS], 'readwrite')
    const store = tx.objectStore(STORE_VISITS)
    const request = store.add({
      ...visitData,
      created_at: new Date().toISOString(),
      status: 'pending',
    })
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

export async function getPendingVisits(): Promise<any[]> {
  const database = db || (await initDB())
  return new Promise((resolve, reject) => {
    const tx = database.transaction([STORE_VISITS], 'readonly')
    const store = tx.objectStore(STORE_VISITS)
    const index = store.index('status')
    const request = index.getAll('pending')
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

export async function markVisitSynced(id: number) {
  const database = db || (await initDB())
  return new Promise((resolve, reject) => {
    const tx = database.transaction([STORE_VISITS], 'readwrite')
    const store = tx.objectStore(STORE_VISITS)
    const request = store.delete(id)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(null)
  })
}

export async function cacheQRCode(key: string, data: string) {
  const database = db || (await initDB())
  return new Promise((resolve, reject) => {
    const tx = database.transaction([STORE_CACHE], 'readwrite')
    const store = tx.objectStore(STORE_CACHE)
    const request = store.put({ key, data, cached_at: new Date().toISOString() })
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(null)
  })
}

export async function getQRCodeFromCache(key: string): Promise<string | null> {
  const database = db || (await initDB())
  return new Promise((resolve, reject) => {
    const tx = database.transaction([STORE_CACHE], 'readonly')
    const store = tx.objectStore(STORE_CACHE)
    const request = store.get(key)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result?.data || null)
  })
}

export async function clearPendingVisits() {
  const database = db || (await initDB())
  return new Promise((resolve, reject) => {
    const tx = database.transaction([STORE_VISITS], 'readwrite')
    const store = tx.objectStore(STORE_VISITS)
    const request = store.clear()
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(null)
  })
}
