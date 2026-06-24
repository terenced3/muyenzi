// Nuxt reads .env.local automatically in development.
// In production (Vercel) environment variables are injected by the platform.

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export default defineNuxtConfig({
  devtools: { enabled: false },

  app: {
    head: {
      link: [
        { rel: 'manifest', href: '/manifest.json' },
        { rel: 'apple-touch-icon', href: '/icons/icon-192.png' },
      ],
      meta: [
        { name: 'theme-color', content: '#6366f1' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'Muyenzi Kiosk' },
      ],
    },
  },

  modules: [
    '@nuxt/ui',
    '@nuxtjs/supabase',
    '@pinia/nuxt',
  ],

  supabase: {
    url: supabaseUrl,
    key: supabaseKey,
    serviceKey: supabaseServiceKey,
    redirect: false,
  },

  colorMode: {
    preference: 'light',
  },

  runtimeConfig: {
    supabaseServiceKey,
    resendApiKey: process.env.RESEND_API_KEY,
    appSecret: process.env.APP_SECRET || '',
    documentSigningSecret: process.env.DOCUMENT_SIGNING_SECRET || '',
    public: {
      supabaseUrl,
    },
  },

  compatibilityDate: '2025-01-01',

  typescript: {
    strict: true,
  },
})
