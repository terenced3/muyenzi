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
  const body = await readBody(event)
  const { access_code, qr_data } = body

  // Walk-in: create visitor + visit on the spot
  if (body.walk_in) {
    const { data: visitor } = await supabase
      .from('visitors')
      .insert({
        company_id: body.company_id,
        full_name: body.name,
        email: body.email || null,
        company_name: body.company || null,
      })
      .select()
      .single()

    if (!visitor) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to create visitor' })
    }

    const accessCode = generateAccessCode()
    const { data: newVisit } = await supabase
      .from('visits')
      .insert({
        company_id: body.company_id,
        site_id: siteId,
        visitor_id: visitor.id,
        purpose: body.purpose || null,
        status: 'checked_in',
        check_in_at: new Date().toISOString(),
        access_code: accessCode,
        qr_code_data: JSON.stringify({ accessCode, siteId }),
        visit_date: new Date().toISOString().split('T')[0],
      })
      .select('*, visitor:visitors(*), site:sites(*), host:users(*)')
      .single()

    return { visit: newVisit }
  }

  let visitQuery = supabase
    .from('visits')
    .select('*, visitor:visitors(*), host:users(*), site:sites(*)')
    .eq('site_id', siteId)
    .eq('status', 'expected')

  if (access_code) {
    visitQuery = visitQuery.eq('access_code', access_code.toUpperCase().replace('-', ''))
  } else if (qr_data) {
    try {
      const parsed = JSON.parse(qr_data)
      visitQuery = visitQuery.eq('access_code', parsed.accessCode)
    } catch {
      throw createError({ statusCode: 400, statusMessage: 'Invalid QR code' })
    }
  } else {
    throw createError({ statusCode: 400, statusMessage: 'Access code or QR data required' })
  }

  const { data: visits, error } = await visitQuery.limit(1)

  if (error || !visits?.length) {
    throw createError({ statusCode: 404, statusMessage: 'Visit not found or already checked in' })
  }

  const visit = visits[0]

  const { data: updated, error: updateError } = await supabase
    .from('visits')
    .update({ status: 'checked_in', check_in_at: new Date().toISOString() })
    .eq('id', visit.id)
    .select('*, visitor:visitors(*), host:users(*), site:sites(*)')
    .single()

  if (updateError) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to check in' })
  }

  // Notify host
  if (visit.host_id) {
    await supabase.from('notifications').insert({
      user_id: visit.host_id,
      company_id: visit.company_id,
      type: 'visitor_arrived',
      message: `${visit.visitor.full_name} has arrived at ${visit.site.name}`,
    })
  }

  return { visit: updated }
})
