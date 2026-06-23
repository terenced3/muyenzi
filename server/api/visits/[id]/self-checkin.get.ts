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

  const { data: visit, error } = await supabase
    .from('visits')
    .select(`
      id, status, visit_date, visit_time, purpose, check_in_at,
      visitor:visitors(full_name, phone),
      host:users(full_name),
      site:sites(name, address, company_id, company:companies(name, logo_url))
    `)
    .eq('id', visitId)
    .single()

  if (error || !visit) {
    throw createError({ statusCode: 404, statusMessage: 'Visit not found' })
  }

  const site = visit.site as any
  const visitor = Array.isArray(visit.visitor) ? visit.visitor[0] : visit.visitor
  const host = Array.isArray(visit.host) ? visit.host[0] : visit.host

  return {
    visit_id: visit.id,
    status: visit.status,
    visit_date: visit.visit_date,
    visit_time: visit.visit_time,
    purpose: visit.purpose,
    check_in_at: visit.check_in_at,
    visitor_name: (visitor as any)?.full_name ?? 'Visitor',
    host_name: (host as any)?.full_name ?? null,
    site_name: site?.name ?? '',
    site_address: site?.address ?? null,
    company_name: site?.company?.name ?? '',
    company_logo: site?.company?.logo_url ?? null,
  }
})
