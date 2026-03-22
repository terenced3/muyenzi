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
  const siteId = getRouterParam(event, 'siteId')!
  const { access_code } = await readBody(event)

  if (!access_code) {
    throw createError({ statusCode: 400, statusMessage: 'Access code required' })
  }

  const { data: visits, error } = await supabase
    .from('visits')
    .select('*, visitor:visitors(*), site:sites(*)')
    .eq('site_id', siteId)
    .eq('status', 'checked_in')
    .eq('access_code', access_code.toUpperCase().replace('-', ''))
    .limit(1)

  if (error || !visits?.length) {
    throw createError({ statusCode: 404, statusMessage: 'No active check-in found for this code' })
  }

  const visit = visits[0]

  const { data: updated, error: updateError } = await supabase
    .from('visits')
    .update({ status: 'checked_out', check_out_at: new Date().toISOString() })
    .eq('id', visit.id)
    .select('*, visitor:visitors(*), site:sites(*)')
    .single()

  if (updateError) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to check out' })
  }

  return { visit: updated }
})
