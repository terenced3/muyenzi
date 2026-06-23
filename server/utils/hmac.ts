const encoder = new TextEncoder()

async function hmacHex(message: string, secret: string): Promise<string> {
  const keyData = encoder.encode(secret)
  const msgData = encoder.encode(message)
  const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, msgData)
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

// Returns a bucket string that advances every 7 days, independent of timezone.
function weekBucket(offsetWeeks = 0): string {
  return String(Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)) + offsetWeeks)
}

// Kiosk: rotates weekly — validate accepts current and previous week to handle the boundary edge case.
export async function generateKioskToken(siteId: string, secret: string): Promise<string> {
  return hmacHex(`kiosk:${siteId}:${weekBucket()}`, secret)
}

export async function validateKioskToken(siteId: string, token: string, secret: string): Promise<boolean> {
  if (!token) return false
  const current = await hmacHex(`kiosk:${siteId}:${weekBucket(0)}`, secret)
  if (timingSafeEqual(current, token)) return true
  const previous = await hmacHex(`kiosk:${siteId}:${weekBucket(-1)}`, secret)
  return timingSafeEqual(previous, token)
}

// Sign token: exp is a YYYY-MM-DD date after which the link is invalid.
// Baking exp into the HMAC means the expiry can't be tampered with.
export async function generateSignToken(visitId: string, secret: string, exp: string): Promise<string> {
  return hmacHex(`sign:${visitId}:${exp}`, secret)
}

export async function validateSignToken(visitId: string, token: string, secret: string, exp: string): Promise<boolean> {
  if (!token || !exp) return false
  if (new Date() > new Date(`${exp}T23:59:59Z`)) return false
  const expected = await generateSignToken(visitId, secret, exp)
  return timingSafeEqual(expected, token)
}

// Check-in token: exp is the visit_date (YYYY-MM-DD). Valid ±1 day to absorb timezone drift.
export async function generateCheckinToken(visitId: string, secret: string, exp: string): Promise<string> {
  return hmacHex(`checkin:${visitId}:${exp}`, secret)
}

export async function validateCheckinToken(visitId: string, token: string, secret: string, exp: string): Promise<boolean> {
  if (!token || !exp) return false
  const expMs = new Date(`${exp}T00:00:00Z`).getTime()
  const diffDays = (Date.now() - expMs) / (1000 * 60 * 60 * 24)
  if (diffDays > 1 || diffDays < -1) return false
  const expected = await generateCheckinToken(visitId, secret, exp)
  return timingSafeEqual(expected, token)
}
