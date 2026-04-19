import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole(event)
  const authUser = await serverSupabaseUser(event)
  if (!authUser) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const { data: profile } = await supabase
    .from('users')
    .select('company_id, role')
    .eq('id', authUser.id)
    .single()

  if (!profile || !['admin', 'site_manager'].includes(profile.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const id = getRouterParam(event, 'id')
  const { error } = await supabase
    .from('document_templates')
    .delete()
    .eq('id', id)
    .eq('company_id', profile.company_id)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { ok: true }
})
