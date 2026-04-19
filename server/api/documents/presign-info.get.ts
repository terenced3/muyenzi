import { serverSupabaseServiceRole } from '#supabase/server'

// Public endpoint — returns visit + unsigned templates for pre-signing via email link
export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole(event)
  const { visit_id } = getQuery(event) as { visit_id?: string }

  if (!visit_id) throw createError({ statusCode: 400, statusMessage: 'visit_id required' })

  const { data: visit, error } = await supabase
    .from('visits')
    .select('id, company_id, visitor_id, status, visit_date, visitor:visitors(full_name)')
    .eq('id', visit_id)
    .single()

  if (error || !visit) throw createError({ statusCode: 404, statusMessage: 'Visit not found' })
  if (['cancelled', 'checked_out', 'no_show'].includes(visit.status)) {
    throw createError({ statusCode: 410, statusMessage: 'This visit is no longer active' })
  }

  const [{ data: templates }, { data: signed }] = await Promise.all([
    supabase
      .from('document_templates')
      .select('id, name, content')
      .eq('company_id', visit.company_id)
      .eq('is_active', true)
      .order('created_at', { ascending: true }),
    supabase
      .from('document_signatures')
      .select('template_id')
      .eq('visit_id', visit_id),
  ])

  const signedIds = new Set((signed ?? []).map((s: { template_id: string }) => s.template_id))
  const unsigned = (templates ?? []).filter((t: { id: string }) => !signedIds.has(t.id))

  const visitor = Array.isArray(visit.visitor) ? visit.visitor[0] : visit.visitor

  return {
    visit_id: visit.id,
    visitor_id: visit.visitor_id,
    company_id: visit.company_id,
    visitor_name: visitor?.full_name ?? 'Visitor',
    visit_date: visit.visit_date,
    unsigned_templates: unsigned,
    already_signed: signedIds.size,
    total_templates: templates?.length ?? 0,
  }
})
