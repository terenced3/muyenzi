import { createClient } from '@supabase/supabase-js'
import { validateCheckinToken } from '~/server/utils/hmac'

function getSupabase() {
  const config = useRuntimeConfig()
  return createClient(
    config.public.supabaseUrl as string,
    config.supabaseServiceKey as string,
  )
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const visitId = getRouterParam(event, 'id')!
  const { ct, exp } = getQuery(event) as { ct?: string; exp?: string }

  if (!config.appSecret || !await validateCheckinToken(visitId, ct ?? '', config.appSecret, exp ?? '')) {
    throw createError({ statusCode: 403, statusMessage: 'Invalid or expired check-in link' })
  }

  const supabase = getSupabase()

  const { data: visit, error: fetchError } = await supabase
    .from('visits')
    .select('*, visitor:visitors(*), host:users(*), site:sites(*, company:companies(name, logo_url))')
    .eq('id', visitId)
    .single()

  if (fetchError || !visit) {
    throw createError({ statusCode: 404, statusMessage: 'Visit not found' })
  }

  // Already checked in — return success so the page can show a friendly message
  if (visit.status === 'checked_in') {
    return { already_checked_in: true, check_in_at: visit.check_in_at }
  }

  if (['cancelled', 'checked_out', 'no_show'].includes(visit.status)) {
    throw createError({ statusCode: 410, statusMessage: 'This visit is no longer active' })
  }

  // Blacklist check
  const visitor = visit.visitor as any
  if (visitor?.phone) {
    const { data: blocked } = await supabase
      .from('visitor_blacklist')
      .select('reason')
      .eq('company_id', visit.company_id)
      .eq('phone', visitor.phone)
      .maybeSingle()

    if (blocked) {
      throw createError({ statusCode: 403, statusMessage: 'Entry not permitted. Please contact reception.' })
    }
  }

  // Atomic check-in — WHERE status = 'expected' prevents double check-in from race conditions
  const { data: updated, error: updateError } = await supabase
    .from('visits')
    .update({ status: 'checked_in', check_in_at: new Date().toISOString() })
    .eq('id', visitId)
    .eq('status', 'expected')
    .select('id, check_in_at')
    .maybeSingle()

  if (!updated) {
    // 0 rows affected — someone else checked in between our fetch and update
    throw createError({ statusCode: 409, statusMessage: 'Visit already checked in' })
  }

  if (updateError) {
    throw createError({ statusCode: 500, statusMessage: 'Check-in failed — please try again' })
  }

  // Notify host — non-fatal
  try {
    if (visit.host_id) {
      const host = visit.host as any
      const site = visit.site as any

      await supabase.from('notifications').insert({
        user_id: visit.host_id,
        company_id: visit.company_id,
        type: 'visitor_arrived',
        message: `${visitor?.full_name} has arrived at ${site?.name} (mobile check-in)`,
      })

      if (host?.email) {
        await $fetch('/api/email/notify-arrival', {
          method: 'POST',
          body: {
            hostEmail: host.email,
            hostName: host.full_name,
            visitorName: visitor?.full_name,
            siteName: site?.name,
            checkInTime: updated.check_in_at,
          },
        }).catch(() => {})
      }
    }
  } catch {
    // Notification failure must not affect the response
  }

  return { check_in_at: updated.check_in_at }
})
