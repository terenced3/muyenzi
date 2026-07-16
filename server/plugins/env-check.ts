export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()

  // These two are hard requirements — the app cannot talk to the database without them
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

  // APP_SECRET and DOCUMENT_SIGNING_SECRET are only needed for kiosk auth and
  // document sign links. Log a warning but do not crash — login, dashboard, and
  // all management features work without them.
  if (!config.appSecret) {
    console.warn('[muyenzi] APP_SECRET is not set. Kiosk authentication will not work until this is added to your environment variables.')
  }
  if (!config.documentSigningSecret) {
    console.warn('[muyenzi] DOCUMENT_SIGNING_SECRET is not set. Document sign links will not work until this is added to your environment variables.')
  }
})
