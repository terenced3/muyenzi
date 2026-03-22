import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const config = useRuntimeConfig()
  return createClient(
    config.public.supabaseUrl as string,
    config.supabaseServiceKey as string,
  )
}

function normalizeCode(code: string): string {
  return code.toUpperCase().replace(/-/g, '').trim()
}

export default defineEventHandler(async (event) => {
  const supabase = getSupabase()
  const siteId = getRouterParam(event, 'siteId')!
  const body = await readBody(event)
  const { access_code, qr_data } = body

  let resolvedCode: string | null = null

  if (access_code) {
    resolvedCode = normalizeCode(access_code)
  } else if (qr_data) {
    try {
      const parsed = JSON.parse(qr_data)
      if (!parsed.accessCode) throw new Error('missing accessCode in QR')
      resolvedCode = normalizeCode(parsed.accessCode)
    } catch {
      throw createError({ statusCode: 400, statusMessage: 'Invalid QR code data' })
    }
  }

  if (!resolvedCode) {
    throw createError({ statusCode: 400, statusMessage: 'Access code or QR data required' })
  }

  const { data: visits, error } = await supabase
    .from('visits')
    .select('*, visitor:visitors(*), site:sites(*)')
    .eq('site_id', siteId)
    .eq('status', 'checked_in')
    .eq('access_code', resolvedCode)
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

  if (updateError || !updated) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to check out' })
  }

  return { visit: updated }
})
