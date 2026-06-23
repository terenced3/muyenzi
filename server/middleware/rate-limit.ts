// In-memory rate limiter for kiosk endpoints.
// Limits each IP to 20 requests per 60-second window.
// Resets on new window — no sliding window, intentionally simple.

const WINDOW_MS = 60_000
const MAX_REQUESTS = 20

const store = new Map<string, { count: number; windowStart: number }>()

export default defineEventHandler((event) => {
  const url = getRequestURL(event).pathname
  if (!url.startsWith('/api/kiosk/')) return

  const ip = (
    getRequestHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim()
    ?? getRequestHeader(event, 'x-real-ip')
    ?? event.node.req.socket?.remoteAddress
    ?? 'unknown'
  )

  const now = Date.now()
  const entry = store.get(ip)

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    store.set(ip, { count: 1, windowStart: now })
    return
  }

  entry.count++
  if (entry.count > MAX_REQUESTS) {
    throw createError({ statusCode: 429, statusMessage: 'Too many requests — try again later' })
  }
})
