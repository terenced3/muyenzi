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
  const authUser = await serverSupabaseUser(event)
  if (!authUser) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const { data: actor } = await supabase
    .from('users')
    .select('company_id, role')
    .eq('id', authUser.id)
    .single()

  if (!actor) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const body = await readBody(event)
  const {
    visitor_name, visitor_phone, visitor_email, visitor_company,
    site_id, host_id, visit_date, visit_time, purpose, notes,
    custom_field_values,
    is_recurring, recurrence_type, recurrence_end_date,
  } = body

  if (!visitor_name?.trim()) throw createError({ statusCode: 400, statusMessage: 'Visitor name is required' })
  if (!visitor_phone?.trim()) throw createError({ statusCode: 400, statusMessage: 'Phone number is required' })
  if (!site_id) throw createError({ statusCode: 400, statusMessage: 'Site is required' })
  if (!host_id) throw createError({ statusCode: 400, statusMessage: 'Host is required' })
  if (!visit_date) throw createError({ statusCode: 400, statusMessage: 'Visit date is required' })

  // Verify site belongs to this company
  const { data: site } = await supabase
    .from('sites')
    .select('id, name')
    .eq('id', site_id)
    .eq('company_id', actor.company_id)
    .single()

  if (!site) throw createError({ statusCode: 404, statusMessage: 'Site not found' })

  // Upsert visitor by phone
  const { data: visitor } = await supabase
    .from('visitors')
    .upsert({
      company_id: actor.company_id,
      full_name: visitor_name.trim(),
      email: visitor_email?.trim() || null,
      phone: visitor_phone.trim(),
      company_name: visitor_company?.trim() || null,
    }, { onConflict: 'company_id,phone', ignoreDuplicates: false })
    .select('id')
    .single()

  if (!visitor?.id) throw createError({ statusCode: 500, statusMessage: 'Failed to create visitor record' })

  // Build visit rows
  const visitDates = is_recurring && recurrence_type && recurrence_end_date
    ? occurrenceDates(visit_date, recurrence_type, recurrence_end_date)
    : [visit_date]

  const groupId = visitDates.length > 1 ? crypto.randomUUID() : null

  const visitsToInsert = visitDates.map(date => {
    const accessCode = makeAccessCode()
    return {
      company_id: actor.company_id,
      site_id,
      visitor_id: visitor.id,
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
    throw createError({ statusCode: 500, statusMessage: visitError?.message ?? 'Failed to create visit' })
  }

  // Create invitation record for first visit
  await supabase.from('invitations').insert({ visit_id: insertedVisits[0].id })

  // Send email if visitor has one
  if (visitor_email?.trim()) {
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
        companyName: visitor_company?.trim() || 'our office',
        accessCode: insertedVisits[0].access_code,
        qrCodeData: insertedVisits[0].qr_code_data,
        visitId: insertedVisits[0].id,
        hasDocuments,
        recurrenceNote: visitDates.length > 1
          ? `This visit repeats ${recurrence_type} until ${recurrence_end_date}.`
          : null,
      },
    }).catch(e => console.warn('[invitations] Failed to send email:', e))
  }

  return {
    access_code: insertedVisits[0].access_code,
    qr_code_data: insertedVisits[0].qr_code_data,
    visitor_name: visitor_name.trim(),
    recurrence_count: insertedVisits.length,
  }
})
