import { createClient } from '@supabase/supabase-js'
import { validateKioskToken } from '~/server/utils/hmac'

function getSupabase() {
  const config = useRuntimeConfig()
  return createClient(
    config.public.supabaseUrl as string,
    config.supabaseServiceKey as string,
  )
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const { site_id, visit_id } = body

  if (!site_id || !visit_id) {
    throw createError({ statusCode: 400, statusMessage: 'site_id and visit_id are required' })
  }

  const kioskKey = getHeader(event, 'x-kiosk-key') ?? ''
  if (!config.appSecret || !await validateKioskToken(site_id, kioskKey, config.appSecret)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid or missing kiosk key' })
  }

  const supabase = getSupabase()

  try {
    // Get site printer settings
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, company_id')
      .eq('id', site_id)
      .single()

    if (siteError || !site) {
      throw createError({ statusCode: 404, statusMessage: 'Site not found' })
    }

    // Log print job for audit
    const { error: logError } = await supabase
      .from('print_logs')
      .insert({
        site_id,
        visit_id,
        company_id: site.company_id,
        printed_at: new Date().toISOString(),
        status: 'sent',
      })

    // Logging failure must not block the print response

    return { success: true, message: 'Badge print job sent' }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to process print job',
    })
  }
})
