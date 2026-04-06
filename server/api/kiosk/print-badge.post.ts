import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const config = useRuntimeConfig()
  return createClient(
    config.public.supabaseUrl as string,
    config.supabaseServiceKey as string,
  )
}

export default defineEventHandler(async (event) => {
  const supabase = getSupabase()
  const body = await readBody(event)
  const { site_id, visit_id } = body

  if (!site_id || !visit_id) {
    throw createError({ statusCode: 400, statusMessage: 'site_id and visit_id are required' })
  }

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

    if (logError) {
      console.warn('Failed to log print job:', logError)
      // Don't fail the whole request if logging fails
    }

    return { success: true, message: 'Badge print job sent' }
  } catch (error) {
    console.error('Print job failed:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to process print job',
    })
  }
})
