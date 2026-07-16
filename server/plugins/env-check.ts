import { createHash } from 'node:crypto'

export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()

  // These two are hard requirements — nothing works without them
  const required: [string, string][] = [
    ['SUPABASE_URL', config.public.supabaseUrl],
    ['SUPABASE_SERVICE_KEY', config.supabaseServiceKey],
  ]

  const missing = required.filter(([, v]) => !v).map(([k]) => k)
  if (missing.length > 0) {
    throw new Error(
      `[muyenzi] Missing required environment variables: ${missing.join(', ')}. ` +
      'See .env.example for the full list. Server cannot start safely.',
    )
  }

  // APP_SECRET and DOCUMENT_SIGNING_SECRET are derived from the service key if not
  // explicitly set. Derived values are stable across cold starts (same seed = same
  // output) so kiosk tokens and sign links keep working. Set these env vars explicitly
  // when you need independent key rotation.
  const seed = config.supabaseServiceKey as string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cfg = config as any
  if (!cfg.appSecret) {
    cfg.appSecret = createHash('sha256').update('muyenzi:app:' + seed).digest('hex')
    console.warn('[muyenzi] APP_SECRET not set — using derived fallback. Add APP_SECRET to your Vercel environment variables.')
  }
  if (!cfg.documentSigningSecret) {
    cfg.documentSigningSecret = createHash('sha256').update('muyenzi:sign:' + seed).digest('hex')
    console.warn('[muyenzi] DOCUMENT_SIGNING_SECRET not set — using derived fallback. Add DOCUMENT_SIGNING_SECRET to your Vercel environment variables.')
  }
})
