import { serverSupabaseServiceRole } from '#supabase/server'

// Returns active templates that have NOT yet been signed for a given visit
export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole(event)
  const { visit_id, company_id } = getQuery(event) as { visit_id?: string; company_id?: string }

  if (!visit_id || !company_id) {
    throw createError({ statusCode: 400, statusMessage: 'visit_id and company_id required' })
  }

  const [{ data: templates }, { data: signed }] = await Promise.all([
    supabase
      .from('document_templates')
      .select('id, name, content')
      .eq('company_id', company_id)
      .eq('is_active', true)
      .order('created_at', { ascending: true }),
    supabase
      .from('document_signatures')
      .select('template_id')
      .eq('visit_id', visit_id),
  ])

  const signedIds = new Set((signed ?? []).map((s: { template_id: string }) => s.template_id))
  return (templates ?? []).filter((t: { id: string }) => !signedIds.has(t.id))
})
