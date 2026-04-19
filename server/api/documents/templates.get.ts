import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole(event)
  const { company_id } = getQuery(event) as { company_id?: string }

  if (!company_id) throw createError({ statusCode: 400, statusMessage: 'company_id required' })

  const { data, error } = await supabase
    .from('document_templates')
    .select('*')
    .eq('company_id', company_id)
    .order('created_at', { ascending: true })

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return data
})
