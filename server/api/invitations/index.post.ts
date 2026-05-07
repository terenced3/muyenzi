import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function makeAccessCode(): string {
  const arr = new Uint32Array(6)
  crypto.getRandomValues(arr)
  return Array.from(arr).map(v => CHARS[v % CHARS.length]).join('')
}

function occurrenceDates(start: string, type: 'daily' | 'weekly' | 'monthly', end: string): string[] {
  const dates: string[] = []
  const endDate = new Date(end)
  const cur = new Date(start)
  while (cur <= endDate && dates.length < 52) {
    dates.push(cur.toISOString().split('T')[0])
    if (type === 'daily') cur.setDate(cur.getDate() + 1)
    else if (type === 'weekly') cur.setDate(cur.getDate() + 7)
    else cur.setMonth(cur.getMonth() + 1)
  }
  return dates
}

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole(event)

  // ── Auth ────────────────────────────────────────────────────
  const authUser = await serverSupabaseUser(event).catch(() => null)
  if (!authUser) {
    throw createError({ statusCode: 401, statusMessage: 'You must be logged in to create invitations' })
  }

  const { data: actor } = await supabase
    .from('users')
    .select('id, company_id, role, full_name')
    .eq('id', authUser.id)
    .single()

  if (!actor?.company_id) {
    throw createError({ statusCode: 403, statusMessage: 'Your user profile was not found — please contact your admin' })
  }

  // ── Validate body ────────────────────────────────────────────
  const body = await readBody(event)
  const {
    visitor_name, visitor_phone, visitor_email, visitor_company,
    site_id, host_id, visit_date, visit_time, purpose, notes,
    custom_field_values,
    is_recurring, recurrence_type, recurrence_end_date,
  } = body

  if (!visitor_name?.trim()) throw createError({ statusCode: 400, statusMessage: 'Visitor name is required' })
  if (!visitor_phone?.trim()) throw createError({ statusCode: 400, statusMessage: 'Phone number is required' })
  if (!site_id) throw createError({ statusCode: 400, statusMessage: 'Please select a site' })
  if (!host_id) throw createError({ statusCode: 400, statusMessage: 'Please select a host' })
  if (!visit_date) throw createError({ statusCode: 400, statusMessage: 'Visit date is required' })

  // ── Verify site belongs to this company ──────────────────────
  const { data: site } = await supabase
    .from('sites')
    .select('id, name')
    .eq('id', site_id)
    .eq('company_id', actor.company_id)
    .single()

  if (!site) {
    throw createError({ statusCode: 404, statusMessage: 'Site not found — it may not belong to your company' })
  }

  // ── Find or create visitor ───────────────────────────────────
  // Explicit find-then-create is more reliable than upsert+select on conflict
  const { data: existingVisitor } = await supabase
    .from('visitors')
    .select('id')
    .eq('company_id', actor.company_id)
    .eq('phone', visitor_phone.trim())
    .maybeSingle()

  let visitorId: string

  if (existingVisitor) {
    visitorId = existingVisitor.id
    // Keep visitor profile up to date
    await supabase
      .from('visitors')
      .update({
        full_name: visitor_name.trim(),
        email: visitor_email?.trim() || null,
        company_name: visitor_company?.trim() || null,
      })
      .eq('id', visitorId)
  } else {
    const { data: newVisitor, error: visitorError } = await supabase
      .from('visitors')
      .insert({
        company_id: actor.company_id,
        full_name: visitor_name.trim(),
        email: visitor_email?.trim() || null,
        phone: visitor_phone.trim(),
        company_name: visitor_company?.trim() || null,
      })
      .select('id')
      .single()

    if (visitorError || !newVisitor) {
      console.error('[invitations] visitor insert error:', visitorError)
      throw createError({
        statusCode: 500,
        statusMessage: `Could not save visitor record: ${visitorError?.message ?? 'unknown error'}`,
      })
    }
    visitorId = newVisitor.id
  }

  // ── Build visit rows ─────────────────────────────────────────
  const visitDates = is_recurring && recurrence_type && recurrence_end_date
    ? occurrenceDates(visit_date, recurrence_type, recurrence_end_date)
    : [visit_date]

  const groupId = visitDates.length > 1 ? crypto.randomUUID() : null

  const visitsToInsert = visitDates.map(date => {
    const accessCode = makeAccessCode()
    return {
      company_id: actor.company_id,
      site_id,
      visitor_id: visitorId,
      host_id,
      purpose: purpose?.trim() || null,
      visit_date: date,
      visit_time: visit_time || null,
      notes: notes?.trim() || null,
      access_code: accessCode,
      qr_code_data: JSON.stringify({ accessCode, siteId: site_id }),
      status: 'expected',
      custom_field_values: custom_field_values ?? null,
      recurrence_type: visitDates.length > 1 ? recurrence_type : null,
      recurrence_end_date: visitDates.length > 1 ? recurrence_end_date : null,
      recurrence_group_id: groupId,
    }
  })

  const { data: insertedVisits, error: visitError } = await supabase
    .from('visits')
    .insert(visitsToInsert)
    .select()

  if (visitError || !insertedVisits?.length) {
    console.error('[invitations] visit insert error:', visitError)
    throw createError({
      statusCode: 500,
      statusMessage: `Could not create visit: ${visitError?.message ?? 'unknown error'}`,
    })
  }

  // ── Create invitation record ─────────────────────────────────
  await supabase
    .from('invitations')
    .insert({ visit_id: insertedVisits[0].id })

  // ── Send email (fire and forget — never blocks the response) ─
  if (visitor_email?.trim()) {
    const sendEmail = async () => {
      const { data: docs } = await supabase
        .from('document_templates')
        .select('id, is_active')
        .eq('company_id', actor.company_id)

      const hasDocuments = (docs ?? []).some((d: any) => d.is_active !== false)

      await $fetch('/api/email/send-invitation', {
        method: 'POST',
        body: {
          visitorEmail: visitor_email.trim(),
          visitorName: visitor_name.trim(),
          siteName: site.name,
          companyName: visitor_company?.trim() || site.name,
          accessCode: insertedVisits[0].access_code,
          qrCodeData: insertedVisits[0].qr_code_data,
          visitId: insertedVisits[0].id,
          hasDocuments,
          recurrenceNote: visitDates.length > 1
            ? `This visit repeats ${recurrence_type} until ${recurrence_end_date}.`
            : null,
        },
      })
    }
    void sendEmail().catch(e => console.warn('[invitations] email send failed:', e))
  }

  return {
    access_code: insertedVisits[0].access_code,
    qr_code_data: insertedVisits[0].qr_code_data,
    visitor_name: visitor_name.trim(),
    recurrence_count: insertedVisits.length,
  }
})
