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
  const body = await readBody(event)
  const updates: Record<string, unknown> = {}
  if (body.name !== undefined) updates.name = body.name.trim()
  if (body.content !== undefined) updates.content = body.content.trim()
  if (body.is_active !== undefined) updates.is_active = body.is_active

  const { data, error } = await supabase
    .from('document_templates')
    .update(updates)
    .eq('id', id)
    .eq('company_id', profile.company_id)
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return data
})
