import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

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

  const { visitor_id } = getQuery(event) as { visitor_id?: string }
  if (!visitor_id) throw createError({ statusCode: 400, statusMessage: 'visitor_id required' })

  // Fetch visitor record
  const { data: visitor, error: vErr } = await supabase
    .from('visitors')
    .select('*')
    .eq('id', visitor_id)
    .eq('company_id', actor.company_id)
    .single()

  if (vErr || !visitor) throw createError({ statusCode: 404, statusMessage: 'Visitor not found' })

  // Fetch all visits with related data
  const { data: visits } = await supabase
    .from('visits')
    .select('id, visit_date, visit_time, status, check_in_at, check_out_at, purpose, notes, access_code, custom_field_values, site:sites(name, address), host:users(full_name, email)')
    .eq('visitor_id', visitor_id)
    .eq('company_id', actor.company_id)
    .order('visit_date', { ascending: false })

  // Fetch document signatures
  const { data: signatures } = await supabase
    .from('document_signatures')
    .select('signed_at, pre_signed, template:document_templates(name)')
    .eq('visitor_id', visitor_id)
    .eq('company_id', actor.company_id)

  const exportPayload = {
    export_generated_at: new Date().toISOString(),
    export_note: 'This export contains all personal data held for this individual under GDPR Article 15 (Right of Access).',
    visitor: {
      id: visitor.id,
      full_name: visitor.full_name,
      email: visitor.email,
      phone: visitor.phone,
      company_name: visitor.company_name,
      first_recorded: visitor.created_at,
    },
    visits: (visits ?? []).map((v: any) => ({
      date: v.visit_date,
      time: v.visit_time,
      status: v.status,
      check_in_at: v.check_in_at,
      check_out_at: v.check_out_at,
      purpose: v.purpose,
      notes: v.notes,
      site: v.site?.name,
      site_address: v.site?.address,
      host: v.host?.full_name,
      custom_fields: v.custom_field_values,
    })),
    document_signatures: (signatures ?? []).map((s: any) => ({
      document: Array.isArray(s.template) ? s.template[0]?.name : s.template?.name,
      signed_at: s.signed_at,
      pre_signed: s.pre_signed,
    })),
    total_visits: visits?.length ?? 0,
  }

  // Audit the export
  await supabase.from('audit_logs').insert({
    company_id: actor.company_id,
    user_id: authUser.id,
    action: 'gdpr_export',
    resource: 'visitor',
    metadata: {
      visitor_id,
      visitor_name: visitor.full_name,
      visitor_phone: visitor.phone,
    },
  })

  setHeader(event, 'Content-Type', 'application/json')
  setHeader(event, 'Content-Disposition', `attachment; filename="visitor-data-${visitor_id.slice(0, 8)}.json"`)
  return exportPayload
})
