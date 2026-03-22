import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local before module options are evaluated
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export default defineNuxtConfig({
  devtools: { enabled: true },

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

  ui: {
    primary: 'indigo',
    gray: 'slate',
  },

  colorMode: {
    preference: 'light',
  },

  runtimeConfig: {
    supabaseServiceKey,
    resendApiKey: process.env.RESEND_API_KEY,
    public: {
      supabaseUrl,
    },
  },

  compatibilityDate: '2025-01-01',

  typescript: {
    strict: true,
  },
})
