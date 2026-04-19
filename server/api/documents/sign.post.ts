import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole(event)
  const body = await readBody(event)
  const { template_id, visit_id, visitor_id, company_id, signature_data, pre_signed } = body

  if (!template_id || !visit_id || !visitor_id || !company_id || !signature_data) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }

  const { data, error } = await supabase
    .from('document_signatures')
    .upsert({
      template_id,
      visit_id,
      visitor_id,
      company_id,
      signature_data,
      pre_signed: pre_signed ?? false,
      signed_at: new Date().toISOString(),
    }, { onConflict: 'template_id,visit_id' })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return data
})
