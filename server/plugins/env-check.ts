export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()

  const required: [string, string][] = [
    ['SUPABASE_URL', config.public.supabaseUrl],
    ['SUPABASE_SERVICE_KEY', config.supabaseServiceKey],
    ['APP_SECRET', config.appSecret],
    ['DOCUMENT_SIGNING_SECRET', config.documentSigningSecret],
  ]

  const missing = required.filter(([, v]) => !v).map(([k]) => k)

  if (missing.length > 0) {
    throw new Error(
      `[muyenzi] Missing required environment variables: ${missing.join(', ')}. ` +
      'See .env.example for the full list. Server cannot start safely.',
    )
  }
})
