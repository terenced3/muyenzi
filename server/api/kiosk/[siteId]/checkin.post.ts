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

  // ── Walk-in: create visitor + visit on the spot ──
  if (body.walk_in) {
    if (!body.name?.trim()) {
      throw createError({ statusCode: 400, statusMessage: 'Full name is required' })
    }
    if (!body.company_id) {
      throw createError({ statusCode: 400, statusMessage: 'company_id is required' })
    }

    const { data: visitor, error: visitorError } = await supabase
      .from('visitors')
      .insert({
        company_id: body.company_id,
        full_name: body.name.trim(),
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
        company_name: body.company?.trim() || null,
      })
      .select()
      .single()

    if (visitorError || !visitor) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to create visitor' })
    }

    const accessCode = generateAccessCode()
    const { data: newVisit, error: visitError } = await supabase
      .from('visits')
      .insert({
        company_id: body.company_id,
        site_id: siteId,
        visitor_id: visitor.id,
        purpose: body.purpose?.trim() || null,
        status: 'checked_in',
        check_in_at: new Date().toISOString(),
        access_code: accessCode,
        qr_code_data: JSON.stringify({ accessCode, siteId }),
        visit_date: new Date().toISOString().split('T')[0],
        custom_field_values: body.custom_field_values ?? null,
      })
      .select('*, visitor:visitors(*), site:sites(*), host:users(*)')
      .single()

    if (visitError || !newVisit) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to create visit' })
    }

    return { visit: newVisit }
  }

  // ── Pre-registered: look up by access code or QR data ──
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
  } else {
    throw createError({ statusCode: 400, statusMessage: 'Access code or QR data required' })
  }

  if (!resolvedCode) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid access code' })
  }

  const { data: visits, error } = await supabase
    .from('visits')
    .select('*, visitor:visitors(*), host:users(*), site:sites(*)')
    .eq('site_id', siteId)
    .eq('status', 'expected')
    .eq('access_code', resolvedCode)
    .limit(1)

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

  if (updateError || !updated) {
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
