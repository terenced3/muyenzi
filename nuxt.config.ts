export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@nuxtjs/supabase',
    '@pinia/nuxt',
  ],

  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    redirect: false,
  },

  ui: {
    primary: 'indigo',
    gray: 'slate',
  },

  colorMode: {
    preference: 'light',
  },

  runtimeConfig: {
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    resendApiKey: process.env.RESEND_API_KEY,
    public: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    },
  },

  compatibilityDate: '2025-01-01',

  typescript: {
    strict: true,
  },
})
